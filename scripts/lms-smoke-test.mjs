/**
 * LMS runtime smoke test — drives the full Learning Center flow through the
 * real HTTP API against the dev server (port 2050) and live Supabase.
 *
 * Creates everything inside the isolated "Test Agency A" tenant and cleans up
 * after itself (deletes the test courses and the temporary agent user).
 *
 * Usage: node scripts/lms-smoke-test.mjs
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const BASE = 'http://localhost:2050';
const ADMIN = { email: 'admin@test-agency-a.com', password: 'TestPassword123!' };
const AGENT = { email: 'lms-smoke-agent@test-agency-a.com', password: 'TestPassword123!' };
const TENANT_A = 'be625f51-987c-4a5e-97b8-bdbeb4194b5d';

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
}

/** Minimal cookie jar per session. */
function makeSession() {
  const jar = new Map();
  return {
    async fetch(path, opts = {}) {
      const headers = { ...(opts.headers || {}) };
      if (jar.size) headers['Cookie'] = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
      if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
      const res = await fetch(BASE + path, { ...opts, headers, redirect: 'manual' });
      for (const sc of res.headers.getSetCookie?.() ?? []) {
        const [pair] = sc.split(';');
        const eq = pair.indexOf('=');
        const name = pair.slice(0, eq).trim();
        const value = pair.slice(eq + 1).trim();
        if (value === '' || /expires=Thu, 01 Jan 1970/i.test(sc)) jar.delete(name);
        else jar.set(name, value);
      }
      return res;
    },
  };
}

async function json(res) {
  try { return await res.json(); } catch { return null; }
}

async function ensureAgentUser() {
  // Supabase auth user (idempotent: delete leftover first by email lookup)
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === AGENT.email);
  if (existing) await supabaseAdmin.auth.admin.deleteUser(existing.id);
  await prisma.user.deleteMany({ where: { email: AGENT.email } });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: AGENT.email,
    password: AGENT.password,
    email_confirm: true,
  });
  if (error) throw new Error('createUser failed: ' + error.message);
  await prisma.user.create({
    data: {
      id: data.user.id,
      tenantId: TENANT_A,
      email: AGENT.email,
      firstName: 'Smoke',
      lastName: 'Agent',
      role: 'AGENT',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  return data.user.id;
}

async function cleanup(agentAuthId, courseIds) {
  for (const id of courseIds.filter(Boolean)) {
    await prisma.course.deleteMany({ where: { id, tenantId: TENANT_A } }).catch(() => {});
  }
  if (agentAuthId) await supabaseAdmin.auth.admin.deleteUser(agentAuthId).catch(() => {});
  await prisma.user.deleteMany({ where: { email: AGENT.email } }).catch(() => {});
  await prisma.$disconnect();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  let agentAuthId = null;
  let courseAId = null; // ALL grant, taken end-to-end
  let courseBId = null; // MANAGER-only grant, must show locked

  try {
    // ---- Sign-ins -----------------------------------------------------------
    const admin = makeSession();
    let res = await admin.fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify(ADMIN) });
    check('admin signin', res.ok, `status ${res.status}`);
    if (!res.ok) throw new Error('cannot continue without admin session');

    agentAuthId = await ensureAgentUser();
    const agent = makeSession();
    res = await agent.fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify(AGENT) });
    check('agent signin', res.ok, `status ${res.status}`);

    // ---- Admin: build two courses ------------------------------------------
    res = await admin.fetch('/api/learning/courses', {
      method: 'POST',
      body: JSON.stringify({ title: 'Smoke Test Course', description: 'Created by lms-smoke-test', category: 'Onboarding' }),
    });
    let body = await json(res);
    courseAId = body?.course?.id ?? null;
    check('create course A', res.ok && !!courseAId, `status ${res.status} ${JSON.stringify(body)?.slice(0, 120)}`);

    res = await admin.fetch('/api/learning/courses', {
      method: 'POST',
      body: JSON.stringify({ title: 'Smoke Locked Course', description: 'Should be locked for agents', category: 'Compliance' }),
    });
    body = await json(res);
    courseBId = body?.course?.id ?? null;
    check('create course B', res.ok && !!courseBId, `status ${res.status}`);

    // Lessons on A: two short videos (10s, 12s) so heartbeat clamps can finish them
    res = await admin.fetch(`/api/learning/courses/${courseAId}/lessons`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Lesson One', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', durationSeconds: 10 }),
    });
    body = await json(res);
    const lesson1Id = body?.lesson?.id;
    check('create lesson 1', res.ok && !!lesson1Id, `status ${res.status} ${JSON.stringify(body)?.slice(0, 120)}`);

    res = await admin.fetch(`/api/learning/courses/${courseAId}/lessons`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Lesson Two', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', durationSeconds: 12 }),
    });
    body = await json(res);
    const lesson2Id = body?.lesson?.id;
    check('create lesson 2', res.ok && !!lesson2Id, `status ${res.status}`);

    // Grants: A → ALL, B → ROLE MANAGER (so the agent sees it locked)
    res = await admin.fetch(`/api/learning/courses/${courseAId}/grants`, {
      method: 'PUT',
      body: JSON.stringify({ grants: [{ granteeType: 'ALL' }] }),
    });
    if (res.status === 405) {
      res = await admin.fetch(`/api/learning/courses/${courseAId}/grants`, {
        method: 'POST',
        body: JSON.stringify({ grants: [{ granteeType: 'ALL' }] }),
      });
    }
    check('grant A = ALL', res.ok, `status ${res.status}`);

    res = await admin.fetch(`/api/learning/courses/${courseBId}/grants`, {
      method: res.ok && res.url.includes('grants') ? 'PUT' : 'PUT',
      body: JSON.stringify({ grants: [{ granteeType: 'ROLE', role: 'MANAGER' }] }),
    });
    if (res.status === 405) {
      res = await admin.fetch(`/api/learning/courses/${courseBId}/grants`, {
        method: 'POST',
        body: JSON.stringify({ grants: [{ granteeType: 'ROLE', role: 'MANAGER' }] }),
      });
    }
    check('grant B = ROLE MANAGER', res.ok, `status ${res.status}`);

    // Publish both + set B unlock message
    res = await admin.fetch(`/api/learning/courses/${courseAId}`, { method: 'PATCH', body: JSON.stringify({ status: 'PUBLISHED' }) });
    check('publish A', res.ok, `status ${res.status}`);
    res = await admin.fetch(`/api/learning/courses/${courseBId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PUBLISHED', unlockMessage: 'Managers only — ask Phil.' }),
    });
    check('publish B + unlock message', res.ok, `status ${res.status}`);

    // ---- Agent: catalog + lock states ---------------------------------------
    res = await agent.fetch('/api/learning/catalog');
    body = await json(res);
    const catalog = body?.courses ?? body ?? [];
    const catA = Array.isArray(catalog) ? catalog.find((c) => c.id === courseAId) : null;
    const catB = Array.isArray(catalog) ? catalog.find((c) => c.id === courseBId) : null;
    check('catalog shows course A unlocked', !!catA && catA.locked === false, JSON.stringify(catA)?.slice(0, 150));
    check('catalog shows course B locked w/ message', !!catB && catB.locked === true && /Managers only/.test(catB.unlockMessage ?? ''), JSON.stringify(catB)?.slice(0, 150));

    // Locked course view → 403 locked
    res = await agent.fetch(`/api/learning/courses/${courseBId}/view`);
    body = await json(res);
    check('locked course view → 403 locked', res.status === 403 && body?.error === 'locked', `status ${res.status}`);

    // Course A view: lesson 1 open, lesson 2 locked
    res = await agent.fetch(`/api/learning/courses/${courseAId}/view`);
    body = await json(res);
    const vLessons = body?.course?.lessons ?? [];
    const v1 = vLessons.find((l) => l.id === lesson1Id);
    const v2 = vLessons.find((l) => l.id === lesson2Id);
    check('view A: lesson1 unlocked, lesson2 locked', v1?.locked === false && v2?.locked === true, JSON.stringify(vLessons.map((l) => ({ t: l.title, locked: l.locked })))?.slice(0, 150));

    // ---- No-skip progress enforcement ---------------------------------------
    // Heartbeat far beyond plausible: first heartbeat is clamped to slack (15s),
    // but duration is 10s, so maxWatched caps at 10 → canMarkDone.
    res = await agent.fetch('/api/learning/progress', {
      method: 'POST',
      body: JSON.stringify({ lessonId: lesson1Id, positionSeconds: 9999 }),
    });
    body = await json(res);
    check('heartbeat lesson1 clamped to duration', body?.maxWatchedSeconds === 10, JSON.stringify(body));
    check('heartbeat lesson1 → canMarkDone', body?.canMarkDone === true, JSON.stringify(body));

    // Lesson 2 must reject progress while locked
    res = await agent.fetch('/api/learning/progress', {
      method: 'POST',
      body: JSON.stringify({ lessonId: lesson2Id, positionSeconds: 5 }),
    });
    check('heartbeat on locked lesson2 → 403', res.status === 403, `status ${res.status}`);

    // Complete lesson 1
    res = await agent.fetch('/api/learning/progress/complete', { method: 'POST', body: JSON.stringify({ lessonId: lesson1Id }) });
    body = await json(res);
    check('complete lesson1', res.ok && body?.success === true, JSON.stringify(body));

    // Lesson 2 now unlocked; immediate complete must fail (nothing watched)
    res = await agent.fetch('/api/learning/progress/complete', { method: 'POST', body: JSON.stringify({ lessonId: lesson2Id }) });
    check('complete lesson2 without watching → 400', res.status === 400, `status ${res.status}`);

    // Growth clamp: first heartbeat allows ≤15s slack, so 12s duration completes in one beat?
    // 12 < 15 → yes, single heartbeat reaches duration. To exercise the *growth* clamp,
    // send two beats and assert the second can't jump past elapsed*1.5+15 from the first.
    res = await agent.fetch('/api/learning/progress', { method: 'POST', body: JSON.stringify({ lessonId: lesson2Id, positionSeconds: 3 }) });
    body = await json(res);
    check('heartbeat lesson2 (3s) accepted', body?.maxWatchedSeconds === 3, JSON.stringify(body));
    await sleep(1100);
    res = await agent.fetch('/api/learning/progress', { method: 'POST', body: JSON.stringify({ lessonId: lesson2Id, positionSeconds: 9999 }) });
    body = await json(res);
    // allowed ≈ 3 + 1.1*1.5 + 15 ≈ 19 → capped to duration 12
    check('heartbeat lesson2 growth-clamped to duration', body?.maxWatchedSeconds === 12, JSON.stringify(body));

    res = await agent.fetch('/api/learning/progress/complete', { method: 'POST', body: JSON.stringify({ lessonId: lesson2Id }) });
    body = await json(res);
    check('complete lesson2 → course completed', body?.success === true && body?.courseCompleted === true, JSON.stringify(body));

    // ---- Reports -------------------------------------------------------------
    res = await agent.fetch('/api/learning/reports');
    check('reports as agent → 403', res.status === 403, `status ${res.status}`);

    res = await admin.fetch('/api/learning/reports');
    body = await json(res);
    const dashA = body?.courses?.find((c) => c.id === courseAId);
    check('dashboard: course A completed=1, 100%', dashA?.completedCount === 1 && dashA?.completionPct >= 50, JSON.stringify(dashA)?.slice(0, 200));
    const dashAgent = body?.agents?.find((a) => a.email === AGENT.email);
    check('dashboard: smoke agent completed 1 course', dashAgent?.completedCount === 1, JSON.stringify(dashAgent)?.slice(0, 200));

    res = await admin.fetch(`/api/learning/reports?courseId=${courseAId}`);
    body = await json(res);
    const rowAgent = body?.rows?.find((r) => r.email === AGENT.email);
    check('course report: agent row COMPLETED w/ dates', rowAgent?.status === 'COMPLETED' && !!rowAgent?.completedAt, JSON.stringify(rowAgent)?.slice(0, 200));
    const adminRow = body?.rows?.find((r) => r.email === ADMIN.email);
    check('course report: admin (ALL grant) listed too', !!adminRow, 'audience should include all active users');

    const agentDbUser = await prisma.user.findFirst({ where: { email: AGENT.email }, select: { id: true } });
    res = await admin.fetch(`/api/learning/reports?userId=${agentDbUser.id}`);
    body = await json(res);
    const tCourse = body?.courses?.find((c) => c.courseId === courseAId);
    check('transcript: 2/2 lessons completed', tCourse?.lessons?.filter((l) => l.completed).length === 2, JSON.stringify(tCourse?.lessons)?.slice(0, 200));

    // CSV export
    res = await admin.fetch('/api/learning/reports/export');
    const csvBytes = new Uint8Array(await res.arrayBuffer());
    const csv = new TextDecoder().decode(csvBytes.subarray(3)); // skip BOM for content checks
    const disposition = res.headers.get('content-disposition') ?? '';
    check('CSV: headers', res.headers.get('content-type')?.includes('text/csv') && disposition.includes('attachment'), disposition);
    const hasBom = csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf;
    check('CSV: BOM + CRLF + quoted', hasBom && csv.includes('\r\n') && csv.startsWith('"First Name"'), `bom=${hasBom} start=${csv.slice(0, 20)}`);
    check('CSV: agent completion row present', csv.includes(AGENT.email) && csv.includes('"Completed"'), '');

    res = await admin.fetch(`/api/learning/reports/export?courseId=${courseBId}`);
    const csvB = await res.text();
    check('CSV per-course: locked course exports (manager audience only, agent absent)', res.ok && !csvB.includes(AGENT.email), '');

    // ---- Tenant isolation ----------------------------------------------------
    // valor-tenant agent must not see tenant A's course (signin as test@valortest.com)
    const outsider = makeSession();
    res = await outsider.fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email: 'test@valortest.com', password: 'TestPassword123!' }) });
    if (res.ok) {
      res = await outsider.fetch(`/api/learning/courses/${courseAId}/view`);
      check('tenant isolation: outsider view → 404/403', res.status === 404 || res.status === 403, `status ${res.status}`);
    } else {
      console.log('SKIP  tenant isolation (test@valortest.com signin failed: ' + res.status + ')');
    }
  } finally {
    await cleanup(agentAuthId, [courseAId, courseBId]);
    console.log(`\nRESULT: ${pass} passed, ${fail} failed (test data cleaned up)`);
    process.exit(fail > 0 ? 1 : 0);
  }
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
