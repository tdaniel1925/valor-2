import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");
  console.log("ℹ️  This is a fresh instance - no demo data will be created.");
  console.log("ℹ️  Please create your tenant and users through the signup process.");

  // Count existing data
  const tenantCount = await prisma.tenant.count();
  const userCount = await prisma.user.count();

  console.log("\n📊 Current database state:");
  console.log(`  - Tenants: ${tenantCount}`);
  console.log(`  - Users: ${userCount}`);

  if (tenantCount === 0) {
    console.log("\n⚠️  No tenants found. The application will guide you through tenant creation on first signup.");
  }

  console.log("\n✅ Seed completed - database is ready for use!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
