-- ============================================
-- LEARNING CENTER (LMS) — schema update
-- Run this in the Supabase SQL Editor (valor_app_role cannot run DDL)
-- Idempotent: safe to run more than once.
-- ============================================

-- 1. Courses: unlock message + manual ordering
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "unlockMessage" TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- 2. Lessons: no-skip video tracking fields
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "youtubeVideoId" TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;

-- 3. Lesson progress: furthest second actually watched + heartbeat timestamp
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS "maxWatchedSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 4. Course grants: who can see/take a course (ALL | ROLE | USER)
CREATE TABLE IF NOT EXISTS course_grants (
    "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "courseId"    TEXT NOT NULL REFERENCES courses("id") ON DELETE CASCADE,
    "granteeType" TEXT NOT NULL,
    "role"        TEXT,
    "userId"      TEXT REFERENCES users("id") ON DELETE CASCADE,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "course_grants_courseId_idx" ON course_grants("courseId");
CREATE INDEX IF NOT EXISTS "course_grants_userId_idx" ON course_grants("userId");

-- 5. Training settings: per-tenant default unlock message
CREATE TABLE IF NOT EXISTS training_settings (
    "id"                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tenantId"             TEXT NOT NULL UNIQUE REFERENCES tenants("id") ON DELETE CASCADE,
    "defaultUnlockMessage" TEXT NOT NULL DEFAULT 'Complete the previous courses or contact your administrator to unlock this content.',
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. RLS must be OFF on the new tables (matches firelight_* precedent; tenant
-- scoping is enforced in the API layer). RLS got enabled on them in Supabase
-- (likely via a dashboard security prompt) with no policies, which silently
-- hides all rows and rejects writes (42501). Explicitly disable:
ALTER TABLE course_grants     DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_settings DISABLE ROW LEVEL SECURITY;
