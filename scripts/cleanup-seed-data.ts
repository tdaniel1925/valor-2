import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning seed/demo data...");

  const DEMO_TENANT_ID = "demo-tenant-id";
  const DEMO_USER_ID = "demo-user-id";

  try {
    // Delete all data associated with demo tenant
    console.log("Deleting demo tenant data...");

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
