warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CHURNED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('AGENT', 'MANAGER', 'ADMINISTRATOR', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'INACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuoteType" AS ENUM ('TERM_LIFE', 'WHOLE_LIFE', 'UNIVERSAL_LIFE', 'INDEXED_UNIVERSAL_LIFE', 'VARIABLE_LIFE', 'FIXED_ANNUITY', 'INDEXED_ANNUITY', 'VARIABLE_ANNUITY');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'APPLIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_REQUIREMENTS', 'IN_UNDERWRITING', 'APPROVED', 'ISSUED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID', 'ADJUSTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('FIRST_YEAR', 'RENEWAL', 'OVERRIDE', 'BONUS', 'TRAIL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CASE_UPDATE', 'CONTRACT_UPDATE', 'COMMISSION_PAID', 'TRAINING_ASSIGNED', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('COMMISSION', 'CASES', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'LIVE_SESSION');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'DROPPED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('MARKETING_MATERIAL', 'PRODUCT_INFO', 'FORM', 'TRAINING_DOC', 'POLICY_TEMPLATE', 'PRESENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('GETTING_STARTED', 'CASES', 'COMMISSIONS', 'QUOTES', 'CONTRACTS', 'TRAINING', 'REPORTS', 'INTEGRATIONS', 'TROUBLESHOOTING', 'BEST_PRACTICES', 'COMPLIANCE', 'ADMIN');

-- CreateEnum
CREATE TYPE "SmartOfficePolicyType" AS ENUM ('LIFE', 'ANNUITY', 'OTHER');

-- CreateEnum
CREATE TYPE "SmartOfficePolicyStatus" AS ENUM ('ACTIVE', 'PENDING', 'ISSUED', 'DECLINED', 'LAPSED', 'SURRENDERED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "emailSlug" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "plan" TEXT DEFAULT 'free',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "profilePhoto" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "licenseState" TEXT,
    "licenseExpiration" TIMESTAMP(3),
    "npn" TEXT,
    "gaid" TEXT,
    "agencyName" TEXT,
    "yearsOfExperience" INTEGER,
    "specializations" TEXT[],
    "photoUrl" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "ein" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "commissionSplit" DOUBLE PRECISION,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "carrierName" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "contractNumber" TEXT,
    "commissionLevel" DOUBLE PRECISION,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "documentUrls" TEXT[],
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "clientAge" INTEGER NOT NULL,
    "clientState" TEXT NOT NULL,
    "type" "QuoteType" NOT NULL,
    "carrier" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "coverageAmount" DOUBLE PRECISION,
    "premium" DOUBLE PRECISION NOT NULL,
    "term" INTEGER,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "externalId" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "carrier" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "applicationNumber" TEXT,
    "policyNumber" TEXT,
    "coverageAmount" DOUBLE PRECISION,
    "premium" DOUBLE PRECISION,
    "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT',
    "statusNotes" TEXT,
    "pendingRequirements" TEXT[],
    "documentUrls" TEXT[],
    "externalId" TEXT,
    "externalSystem" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT,
    "type" "CommissionType" NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "carrier" TEXT NOT NULL,
    "policyNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "splitAmount" DOUBLE PRECISION,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GoalType" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnail" TEXT,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "duration" INTEGER,
    "requiredScore" INTEGER NOT NULL DEFAULT 70,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LessonType" NOT NULL,
    "order" INTEGER NOT NULL,
    "duration" INTEGER,
    "videoUrl" TEXT,
    "articleContent" TEXT,
    "attachments" TEXT[],
    "quizData" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "certificateId" TEXT,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "timeSpent" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "score" INTEGER NOT NULL,
    "pdfUrl" TEXT,
    "verificationUrl" TEXT,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "meetingUrl" TEXT,
    "capacity" INTEGER,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registered" BOOLEAN NOT NULL DEFAULT true,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'PUBLISHED',
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_info" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "benefits" TEXT[],
    "riders" TEXT[],
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "minCoverage" DOUBLE PRECISION,
    "maxCoverage" DOUBLE PRECISION,
    "commissionRates" JSONB,
    "underwritingRequirements" JSONB,
    "brochureUrl" TEXT,
    "illustrationUrl" TEXT,
    "applicationUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_articles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "tags" TEXT[],
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoUrl" TEXT,
    "attachments" TEXT[],
    "keywords" TEXT[],
    "searchableText" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "relatedArticles" TEXT[],
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT NOT NULL,
    "lastEditedBy" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_feedback" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    "helpful" BOOLEAN NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smartoffice_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "primaryAdvisor" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "carrierName" TEXT NOT NULL,
    "primaryInsured" TEXT NOT NULL,
    "statusDate" TIMESTAMP(3),
    "type" "SmartOfficePolicyType" NOT NULL,
    "status" "SmartOfficePolicyStatus" NOT NULL DEFAULT 'UNKNOWN',
    "targetAmount" DOUBLE PRECISION,
    "commAnnualizedPrem" DOUBLE PRECISION,
    "weightedPremium" DOUBLE PRECISION,
    "firstYearCommission" DOUBLE PRECISION,
    "renewalCommission" DOUBLE PRECISION,
    "additionalData" JSONB,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceFile" TEXT,
    "rawData" JSONB,
    "searchText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smartoffice_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smartoffice_agents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phones" TEXT,
    "addresses" TEXT,
    "supervisor" TEXT,
    "subSource" TEXT,
    "contractList" TEXT,
    "ssn" TEXT,
    "npn" TEXT,
    "additionalData" JSONB,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceFile" TEXT,
    "rawData" JSONB,
    "searchText" TEXT,
    "linkedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smartoffice_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smartoffice_sync_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "filesProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errors" JSONB,
    "warnings" JSONB,
    "filesProcessedList" TEXT[],
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smartoffice_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smartoffice_custom_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "columns" TEXT[],
    "groupBy" TEXT[],
    "sortBy" JSONB,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedule" TEXT,
    "recipients" TEXT[],
    "createdBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[],
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smartoffice_custom_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smartoffice_chat_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "queryType" TEXT,
    "sqlGenerated" TEXT,
    "resultsCount" INTEGER,
    "results" JSONB,
    "tokensUsed" INTEGER,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smartoffice_chat_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_emailSlug_key" ON "tenants"("emailSlug");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_npn_key" ON "user_profiles"("npn");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_gaid_key" ON "user_profiles"("gaid");

-- CreateIndex
CREATE INDEX "user_profiles_npn_idx" ON "user_profiles"("npn");

-- CreateIndex
CREATE INDEX "user_profiles_gaid_idx" ON "user_profiles"("gaid");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_ein_key" ON "organizations"("ein");

-- CreateIndex
CREATE INDEX "organizations_tenantId_idx" ON "organizations"("tenantId");

-- CreateIndex
CREATE INDEX "organizations_parentId_idx" ON "organizations"("parentId");

-- CreateIndex
CREATE INDEX "organizations_type_idx" ON "organizations"("type");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "contracts_tenantId_idx" ON "contracts"("tenantId");

-- CreateIndex
CREATE INDEX "contracts_userId_idx" ON "contracts"("userId");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_carrierName_idx" ON "contracts"("carrierName");

-- CreateIndex
CREATE INDEX "quotes_tenantId_idx" ON "quotes"("tenantId");

-- CreateIndex
CREATE INDEX "quotes_userId_idx" ON "quotes"("userId");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_type_idx" ON "quotes"("type");

-- CreateIndex
CREATE INDEX "cases_tenantId_idx" ON "cases"("tenantId");

-- CreateIndex
CREATE INDEX "cases_userId_idx" ON "cases"("userId");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_carrier_idx" ON "cases"("carrier");

-- CreateIndex
CREATE INDEX "case_notes_caseId_idx" ON "case_notes"("caseId");

-- CreateIndex
CREATE INDEX "commissions_tenantId_idx" ON "commissions"("tenantId");

-- CreateIndex
CREATE INDEX "commissions_userId_idx" ON "commissions"("userId");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

-- CreateIndex
CREATE INDEX "commissions_caseId_idx" ON "commissions"("caseId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "goals_tenantId_idx" ON "goals"("tenantId");

-- CreateIndex
CREATE INDEX "goals_userId_idx" ON "goals"("userId");

-- CreateIndex
CREATE INDEX "goals_type_idx" ON "goals"("type");

-- CreateIndex
CREATE INDEX "goals_startDate_idx" ON "goals"("startDate");

-- CreateIndex
CREATE INDEX "goals_endDate_idx" ON "goals"("endDate");

-- CreateIndex
CREATE INDEX "courses_tenantId_idx" ON "courses"("tenantId");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "courses_category_idx" ON "courses"("category");

-- CreateIndex
CREATE INDEX "courses_instructorId_idx" ON "courses"("instructorId");

-- CreateIndex
CREATE INDEX "lessons_courseId_idx" ON "lessons"("courseId");

-- CreateIndex
CREATE INDEX "lessons_type_idx" ON "lessons"("type");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_certificateId_key" ON "enrollments"("certificateId");

-- CreateIndex
CREATE INDEX "enrollments_userId_idx" ON "enrollments"("userId");

-- CreateIndex
CREATE INDEX "enrollments_courseId_idx" ON "enrollments"("courseId");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_userId_courseId_key" ON "enrollments"("userId", "courseId");

-- CreateIndex
CREATE INDEX "lesson_progress_enrollmentId_idx" ON "lesson_progress"("enrollmentId");

-- CreateIndex
CREATE INDEX "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollmentId_lessonId_key" ON "lesson_progress"("enrollmentId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_certificateNumber_key" ON "certifications"("certificateNumber");

-- CreateIndex
CREATE INDEX "certifications_userId_idx" ON "certifications"("userId");

-- CreateIndex
CREATE INDEX "certifications_courseId_idx" ON "certifications"("courseId");

-- CreateIndex
CREATE INDEX "training_events_tenantId_idx" ON "training_events"("tenantId");

-- CreateIndex
CREATE INDEX "training_events_startDate_idx" ON "training_events"("startDate");

-- CreateIndex
CREATE INDEX "training_events_instructorId_idx" ON "training_events"("instructorId");

-- CreateIndex
CREATE INDEX "event_attendees_eventId_idx" ON "event_attendees"("eventId");

-- CreateIndex
CREATE INDEX "event_attendees_userId_idx" ON "event_attendees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_eventId_userId_key" ON "event_attendees"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "resources_previousVersionId_key" ON "resources"("previousVersionId");

-- CreateIndex
CREATE INDEX "resources_tenantId_idx" ON "resources"("tenantId");

-- CreateIndex
CREATE INDEX "resources_type_idx" ON "resources"("type");

-- CreateIndex
CREATE INDEX "resources_status_idx" ON "resources"("status");

-- CreateIndex
CREATE INDEX "resources_category_idx" ON "resources"("category");

-- CreateIndex
CREATE INDEX "resources_uploadedBy_idx" ON "resources"("uploadedBy");

-- CreateIndex
CREATE INDEX "resource_favorites_userId_idx" ON "resource_favorites"("userId");

-- CreateIndex
CREATE INDEX "resource_favorites_resourceId_idx" ON "resource_favorites"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_favorites_userId_resourceId_key" ON "resource_favorites"("userId", "resourceId");

-- CreateIndex
CREATE INDEX "product_info_tenantId_idx" ON "product_info"("tenantId");

-- CreateIndex
CREATE INDEX "product_info_carrier_idx" ON "product_info"("carrier");

-- CreateIndex
CREATE INDEX "product_info_productType_idx" ON "product_info"("productType");

-- CreateIndex
CREATE INDEX "product_info_isActive_idx" ON "product_info"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "help_articles_slug_key" ON "help_articles"("slug");

-- CreateIndex
CREATE INDEX "help_articles_tenantId_idx" ON "help_articles"("tenantId");

-- CreateIndex
CREATE INDEX "help_articles_slug_idx" ON "help_articles"("slug");

-- CreateIndex
CREATE INDEX "help_articles_category_idx" ON "help_articles"("category");

-- CreateIndex
CREATE INDEX "help_articles_status_idx" ON "help_articles"("status");

-- CreateIndex
CREATE INDEX "help_articles_publishedAt_idx" ON "help_articles"("publishedAt");

-- CreateIndex
CREATE INDEX "help_articles_parentId_idx" ON "help_articles"("parentId");

-- CreateIndex
CREATE INDEX "article_feedback_articleId_idx" ON "article_feedback"("articleId");

-- CreateIndex
CREATE INDEX "article_feedback_helpful_idx" ON "article_feedback"("helpful");

-- CreateIndex
CREATE INDEX "faqs_tenantId_idx" ON "faqs"("tenantId");

-- CreateIndex
CREATE INDEX "faqs_category_idx" ON "faqs"("category");

-- CreateIndex
CREATE INDEX "faqs_isActive_idx" ON "faqs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "smartoffice_policies_policyNumber_key" ON "smartoffice_policies"("policyNumber");

-- CreateIndex
CREATE INDEX "smartoffice_policies_tenantId_idx" ON "smartoffice_policies"("tenantId");

-- CreateIndex
CREATE INDEX "smartoffice_policies_policyNumber_idx" ON "smartoffice_policies"("policyNumber");

-- CreateIndex
CREATE INDEX "smartoffice_policies_primaryAdvisor_idx" ON "smartoffice_policies"("primaryAdvisor");

-- CreateIndex
CREATE INDEX "smartoffice_policies_carrierName_idx" ON "smartoffice_policies"("carrierName");

-- CreateIndex
CREATE INDEX "smartoffice_policies_type_idx" ON "smartoffice_policies"("type");

-- CreateIndex
CREATE INDEX "smartoffice_policies_status_idx" ON "smartoffice_policies"("status");

-- CreateIndex
CREATE INDEX "smartoffice_policies_statusDate_idx" ON "smartoffice_policies"("statusDate");

-- CreateIndex
CREATE INDEX "smartoffice_policies_lastSyncDate_idx" ON "smartoffice_policies"("lastSyncDate");

-- CreateIndex
CREATE INDEX "smartoffice_agents_tenantId_idx" ON "smartoffice_agents"("tenantId");

-- CreateIndex
CREATE INDEX "smartoffice_agents_fullName_idx" ON "smartoffice_agents"("fullName");

-- CreateIndex
CREATE INDEX "smartoffice_agents_email_idx" ON "smartoffice_agents"("email");

-- CreateIndex
CREATE INDEX "smartoffice_agents_npn_idx" ON "smartoffice_agents"("npn");

-- CreateIndex
CREATE INDEX "smartoffice_agents_supervisor_idx" ON "smartoffice_agents"("supervisor");

-- CreateIndex
CREATE INDEX "smartoffice_agents_subSource_idx" ON "smartoffice_agents"("subSource");

-- CreateIndex
CREATE INDEX "smartoffice_agents_lastSyncDate_idx" ON "smartoffice_agents"("lastSyncDate");

-- CreateIndex
CREATE INDEX "smartoffice_agents_linkedUserId_idx" ON "smartoffice_agents"("linkedUserId");

-- CreateIndex
CREATE INDEX "smartoffice_sync_logs_tenantId_idx" ON "smartoffice_sync_logs"("tenantId");

-- CreateIndex
CREATE INDEX "smartoffice_sync_logs_syncType_idx" ON "smartoffice_sync_logs"("syncType");

-- CreateIndex
CREATE INDEX "smartoffice_sync_logs_status_idx" ON "smartoffice_sync_logs"("status");

-- CreateIndex
CREATE INDEX "smartoffice_sync_logs_startedAt_idx" ON "smartoffice_sync_logs"("startedAt");

-- CreateIndex
CREATE INDEX "smartoffice_custom_reports_tenantId_idx" ON "smartoffice_custom_reports"("tenantId");

-- CreateIndex
CREATE INDEX "smartoffice_custom_reports_createdBy_idx" ON "smartoffice_custom_reports"("createdBy");

-- CreateIndex
CREATE INDEX "smartoffice_custom_reports_reportType_idx" ON "smartoffice_custom_reports"("reportType");

-- CreateIndex
CREATE INDEX "smartoffice_custom_reports_isScheduled_idx" ON "smartoffice_custom_reports"("isScheduled");

-- CreateIndex
CREATE INDEX "smartoffice_chat_history_tenantId_idx" ON "smartoffice_chat_history"("tenantId");

-- CreateIndex
CREATE INDEX "smartoffice_chat_history_userId_idx" ON "smartoffice_chat_history"("userId");

-- CreateIndex
CREATE INDEX "smartoffice_chat_history_sessionId_idx" ON "smartoffice_chat_history"("sessionId");

-- CreateIndex
CREATE INDEX "smartoffice_chat_history_createdAt_idx" ON "smartoffice_chat_history"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "certifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_events" ADD CONSTRAINT "training_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_events" ADD CONSTRAINT "training_events_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "training_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_favorites" ADD CONSTRAINT "resource_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_favorites" ADD CONSTRAINT "resource_favorites_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_info" ADD CONSTRAINT "product_info_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "help_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_feedback" ADD CONSTRAINT "article_feedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "help_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartoffice_policies" ADD CONSTRAINT "smartoffice_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartoffice_agents" ADD CONSTRAINT "smartoffice_agents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartoffice_agents" ADD CONSTRAINT "smartoffice_agents_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartoffice_sync_logs" ADD CONSTRAINT "smartoffice_sync_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartoffice_custom_reports" ADD CONSTRAINT "smartoffice_custom_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartoffice_custom_reports" ADD CONSTRAINT "smartoffice_custom_reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartoffice_chat_history" ADD CONSTRAINT "smartoffice_chat_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smartoffice_chat_history" ADD CONSTRAINT "smartoffice_chat_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

