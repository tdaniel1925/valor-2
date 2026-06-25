import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { prisma } from '@/lib/db/prisma';
import { getOrgForEmail } from '@/lib/downline/service';

const ADMIN_ROLES = ['ADMINISTRATOR', 'EXECUTIVE'];

// An "agency" is an agent row whose name reads like a company.
const COMPANY = /\b(LLC|L\.L\.C|Inc|Incorporated|Group|Services|Financial|Insurance|Agency|Holdings|Brokers|Partners|Associates|Company|Corp)\b/i;
const PERSON = /^[A-Z][A-Za-z'’.-]+ +[A-Z][A-Za-z'’.-]+/;

/**
 * GET /api/book-search?q=...
 *
 * Type-ahead over the logged-in user's OWN scoped book (their downline; admins
 * see everyone). Returns matching agencies (company-named entities) and reps
 * (people), matched by name or email. Used by the header search to drill the
 * Dashboard / My Organization / Cases pages into one agency or rep.
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    const authUser = await requireAuth(request);

    const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
    if (q.length < 2) return NextResponse.json({ agencies: [], reps: [] });

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { email: true, role: true },
    });
    const email = dbUser?.email || authUser.email || '';
    const isAdmin = !!dbUser && ADMIN_ROLES.includes(dbUser.role);

    // The user's scoped roster (own + downline; admins = all).
    const org = await getOrgForEmail(tenant.tenantId, email, { isAdmin });
    const downline = (org.downline ?? []) as Array<{ name: string; email: string | null; contactId: string | null }>;

    // Pull emails for the downline agents (downline rows already carry name/email).
    const matches = downline.filter((d) => {
      const name = (d.name || '').toLowerCase();
      const em = (d.email || '').toLowerCase();
      return name.includes(q) || em.includes(q);
    });

    const isAgency = (name: string) => COMPANY.test(name) && !PERSON.test(name);

    const agencies = matches
      .filter((d) => isAgency(d.name))
      .slice(0, 12)
      .map((d) => ({ type: 'agency' as const, name: d.name, email: d.email, contactId: d.contactId }));

    const reps = matches
      .filter((d) => !isAgency(d.name))
      .slice(0, 12)
      .map((d) => ({ type: 'rep' as const, name: d.name, email: d.email, contactId: d.contactId }));

    return NextResponse.json({ agencies, reps });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[BOOK_SEARCH] error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
