# Master Build Plan — Valor Learning Center (LMS)

## Features (dependency order):
1. ✅ **Schema + Data Layer** — EXTENDED existing Course/Lesson/LessonProgress models (tables existed, empty) + new CourseGrant + TrainingSettings; SQL: `scripts/lms-schema.sql` (run in Supabase SQL Editor). NOTE: `courses` table has tenant RLS — writes must use SET LOCAL pattern (lib/db/tenant-scoped-prisma.ts)
2. ✅ **API Layer** — built: lib/learning/{access,progress,youtube}.ts + app/api/learning/{courses,courses/[courseId],courses/[courseId]/lessons,courses/[courseId]/grants,courses/[courseId]/view,lessons/[lessonId],settings,catalog,progress,progress/complete}. tsc clean. RUNTIME TESTS PENDING until scripts/lms-schema.sql is run in Supabase (also adds lesson_progress.updatedAt — script updated after first user notification)
3. ✅ **Admin Course Builder** — app/admin/learning/page.tsx (list + create + default unlock message), app/admin/learning/[courseId]/page.tsx (editor: details, publish, lessons w/ auto duration probe via components/learning/useYouTubeDuration.ts, reorder, grants panel, delete). tsc + next build pass. Runtime test pending SQL.
4. ✅ **Agent Learning Center** — app/learning/page.tsx (catalog: locked = greyed+grayscale+unlock message card; unlocked = progress bar + Continue), app/learning/[courseId]/page.tsx (sequential lesson list, 403-locked handling, links to /learning/[courseId]/[lessonId] — player page is Feature 5). tsc clean.
5. ✅ **No-Skip Player** — built: app/learning/[courseId]/[lessonId]/page.tsx + components/learning/NoSkipPlayer.tsx (controls:0 + click shield, 250ms snap-back poll, 5s heartbeat, resume at maxWatched, Mark Done gated by server canMarkDone, next-lesson/back-to-course nav). YTPlayer interface widened in useYouTubeDuration.ts. tsc + next build pass. Runtime smoke test pending.
6. ✅ **Reports + CSV** — built: lib/learning/reports.ts (audience = grants ∪ enrollees; dashboard/course-report/transcript/CSV builders), app/api/learning/reports/route.ts (?courseId= / ?userId= branches), reports/export/route.ts (CSV w/ BOM+CRLF, attachment), app/admin/learning/reports/page.tsx (stats cards + course/agent tables + inline drill-downs), Reports button added to admin course builder header. tsc + next build pass. Runtime smoke test pending.
7. ✅ **Sidebar + Polish** — built: AppLayout.tsx "Learning Center" → /learning (replaces legacy "Training" link; Video Library child kept; expandedSections key training→learningcenter), admin "Course Builder" → /admin/learning. README.md Learning Center section added (features, entry points, file map, Supabase DDL note). tsc + next build pass. ALL FEATURES COMPLETE — runtime smoke test is the only remaining step.

## Shared Dependencies
- No new npm packages required (YouTube IFrame API is a script tag; CSV generated server-side as text)
- DDL: run `scripts/create-lms-tables.sql` in Supabase SQL Editor (NOT prisma db push — role lacks owner perms)

## Infrastructure First
- None — uses existing auth, tenancy, AppLayout, Supabase

## Interview Decisions (locked)
- Purpose: onboarding + product training + compliance (all)
- Phil (admin) creates ALL content
- Video: YouTube **unlisted** (Vimeo domain-lock = future upgrade path)
- Watch rules: full watch required, NO forward seek; pause + rewind OK; bite-size videos; then Mark Done
- Sequential lessons within a course (N locked until N-1 done)
- Gating: per role OR per user (or ALL); locked content visible but greyed with admin-customizable unlock message (per-course override + global default)
- Reporting: ALL — completion lists + full dashboard + per-agent transcripts + CSV export
- No quizzes/certificates in P0 (P1 candidates)
