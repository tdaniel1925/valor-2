import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning ALL seed/demo data and content...");

  const DEMO_TENANT_ID = "demo-tenant-id";
  const DEMO_USER_ID = "demo-user-id";

  try {
    // Delete ALL content (help articles, videos, etc.) - not tenant-specific
    console.log("\n📚 Deleting all content data...");

    await prisma.articleFeedback.deleteMany({});
    console.log("  ✓ Deleted all article feedback");

    await prisma.helpArticle.deleteMany({});
    console.log("  ✓ Deleted all help articles");

    await prisma.fAQ.deleteMany({});
    console.log("  ✓ Deleted all FAQs");

    await prisma.videoWatchHistory.deleteMany({});
    console.log("  ✓ Deleted all video watch history");

    await prisma.video.deleteMany({});
    console.log("  ✓ Deleted all videos");

    await prisma.videoCategory.deleteMany({});
    console.log("  ✓ Deleted all video categories");

    await prisma.productInfo.deleteMany({});
    console.log("  ✓ Deleted all product info");

    await prisma.resourceFavorite.deleteMany({});
    console.log("  ✓ Deleted all resource favorites");

    await prisma.resource.deleteMany({});
    console.log("  ✓ Deleted all resources");

    await prisma.eventAttendee.deleteMany({});
    console.log("  ✓ Deleted all event attendees");

    await prisma.trainingEvent.deleteMany({});
    console.log("  ✓ Deleted all training events");

    await prisma.certification.deleteMany({});
    console.log("  ✓ Deleted all certifications");

    await prisma.lessonProgress.deleteMany({});
    console.log("  ✓ Deleted all lesson progress");

    await prisma.enrollment.deleteMany({});
    console.log("  ✓ Deleted all enrollments");

    await prisma.lesson.deleteMany({});
    console.log("  ✓ Deleted all lessons");

    await prisma.course.deleteMany({});
    console.log("  ✓ Deleted all courses");

    // Delete all data associated with demo tenant
    console.log("\n🏢 Deleting demo tenant data...");

    // Get demo cases to delete related notes
    const demoCases = await prisma.case.findMany({
      where: { tenantId: DEMO_TENANT_ID },
      select: { id: true }
    });
    const demoCaseIds = demoCases.map(c => c.id);

    if (demoCaseIds.length > 0) {
      await prisma.caseNote.deleteMany({ where: { caseId: { in: demoCaseIds } } });
      console.log("  ✓ Deleted demo case notes");
    }

    await prisma.notification.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo notifications");

    await prisma.commission.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo commissions");

    await prisma.case.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo cases");

    await prisma.quote.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo quotes");

    await prisma.contract.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo contracts");

    await prisma.auditLog.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo audit logs");

    // Get demo orgs to delete members
    const demoOrgs = await prisma.organization.findMany({
      where: { tenantId: DEMO_TENANT_ID },
      select: { id: true }
    });
    const demoOrgIds = demoOrgs.map(o => o.id);

    if (demoOrgIds.length > 0) {
      await prisma.organizationMember.deleteMany({ where: { organizationId: { in: demoOrgIds } } });
      console.log("  ✓ Deleted demo org members");
    }

    await prisma.organization.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo organizations");

    await prisma.goal.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo goals");

    // SmartOffice data
    await prisma.smartOfficeChatHistory.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo SmartOffice chat history");

    await prisma.smartOfficeCustomReport.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo SmartOffice custom reports");

    await prisma.smartOfficeSyncLog.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo SmartOffice sync logs");

    await prisma.smartOfficeAgent.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo SmartOffice agents");

    await prisma.dashboardLayout.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo dashboard layouts");

    await prisma.savedFilter.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo saved filters");

    await prisma.policyNote.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo policy notes");

    await prisma.smartOfficePolicy.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo SmartOffice policies");

    // Get demo users to delete profiles
    const demoUsers = await prisma.user.findMany({
      where: { tenantId: DEMO_TENANT_ID },
      select: { id: true }
    });
    const demoUserIds = demoUsers.map(u => u.id);

    if (demoUserIds.length > 0) {
      await prisma.userProfile.deleteMany({ where: { userId: { in: demoUserIds } } });
      console.log("  ✓ Deleted demo user profiles");
    }

    await prisma.user.deleteMany({ where: { tenantId: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo users");

    await prisma.tenant.deleteMany({ where: { id: DEMO_TENANT_ID } });
    console.log("  ✓ Deleted demo tenant");

    console.log("\n✅ Seed/demo data cleaned successfully!");
    console.log("\n📊 Remaining data:");

    const tenantCount = await prisma.tenant.count();
    const userCount = await prisma.user.count();
    const caseCount = await prisma.case.count();

    console.log(`  - Tenants: ${tenantCount}`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Cases: ${caseCount}`);

  } catch (error) {
    console.error("❌ Error cleaning seed data:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
