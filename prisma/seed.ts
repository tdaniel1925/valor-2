import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.commission.deleteMany();
  await prisma.caseNote.deleteMany();
  await prisma.case.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create Organizations (Hierarchical)
  console.log("🏢 Creating organizations...");

  const valorHQ = await prisma.organization.create({
    data: {
      name: "Valor Financial Specialists HQ",
      type: "IMO",
      ein: "12-3456789",
      phone: "(555) 100-0000",
      email: "hq@valorfinancial.com",
      address: "123 Main Street",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      status: "ACTIVE",
    },
  });

  const westCoastMGA = await prisma.organization.create({
    data: {
      name: "West Coast MGA",
      type: "MGA",
      parentId: valorHQ.id,
      phone: "(555) 200-0000",
      email: "westcoast@valorfinancial.com",
      address: "456 Pacific Ave",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      status: "ACTIVE",
    },
  });

  const sfAgency = await prisma.organization.create({
    data: {
      name: "SF Elite Insurance Agency",
      type: "Agency",
      parentId: westCoastMGA.id,
      phone: "(555) 300-0000",
      email: "sf@valorfinancial.com",
      address: "789 Market Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94103",
      status: "ACTIVE",
    },
  });

  // Create Users with Profiles
  console.log("👤 Creating users and profiles...");

  // Demo User (the one logged in)
  const demoUser = await prisma.user.create({
    data: {
      id: "demo-user-id",
      email: "demo@valorfinancial.com",
      firstName: "Alex",
      lastName: "Thompson",
      phone: "(555) 123-4567",
      role: "AGENT",
      status: "ACTIVE",
      emailVerified: true,
      profile: {
        create: {
          licenseNumber: "CA-LIC-123456",
          licenseState: "CA",
          licenseExpiration: new Date("2026-12-31"),
          npn: "12345678",
          gaid: "AG-001",
          agencyName: "Thompson Insurance Group",
          yearsOfExperience: 5,
          specializations: ["Life Insurance", "Annuities", "Health Insurance"],
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        },
      },
    },
  });

  // Executive User
  const executiveUser = await prisma.user.create({
    data: {
      email: "phil.martinez@valorfinancial.com",
      firstName: "Phil",
      lastName: "Martinez",
      phone: "(555) 100-1111",
      role: "EXECUTIVE",
      status: "ACTIVE",
      emailVerified: true,
      profile: {
        create: {
          licenseNumber: "CA-LIC-999999",
          licenseState: "CA",
          licenseExpiration: new Date("2027-06-30"),
          npn: "99999999",
          gaid: "EX-001",
          agencyName: "Valor Financial Specialists",
          yearsOfExperience: 20,
          specializations: ["Management", "Strategy", "Training"],
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
        },
      },
    },
  });

  // Manager User
  const managerUser = await prisma.user.create({
    data: {
      email: "michael.chen@valorfinancial.com",
      firstName: "Michael",
      lastName: "Chen",
      phone: "(555) 200-2222",
      role: "MANAGER",
      status: "ACTIVE",
      emailVerified: true,
      profile: {
        create: {
          licenseNumber: "CA-LIC-555555",
          licenseState: "CA",
          licenseExpiration: new Date("2026-09-30"),
          npn: "55555555",
          gaid: "MG-001",
          agencyName: "West Coast MGA",
          yearsOfExperience: 12,
          specializations: ["Team Management", "Life Insurance", "Annuities"],
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
        },
      },
    },
  });

  // Agent User 2
  const agentUser = await prisma.user.create({
    data: {
      email: "sarah.johnson@valorfinancial.com",
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "(555) 300-3333",
      role: "AGENT",
      status: "ACTIVE",
      emailVerified: true,
      profile: {
        create: {
          licenseNumber: "CA-LIC-777777",
          licenseState: "CA",
          licenseExpiration: new Date("2025-12-31"),
          npn: "77777777",
          gaid: "AG-002",
          agencyName: "SF Elite Insurance Agency",
          yearsOfExperience: 3,
          specializations: ["Term Life", "Final Expense"],
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        },
      },
    },
  });

  // Create Organization Members
  console.log("👥 Creating organization memberships...");

  await prisma.organizationMember.createMany({
    data: [
      {
        organizationId: valorHQ.id,
        userId: executiveUser.id,
        role: "EXECUTIVE",
        commissionSplit: 0.05,
        isActive: true,
      },
      {
        organizationId: westCoastMGA.id,
        userId: managerUser.id,
        role: "MANAGER",
        commissionSplit: 0.15,
        isActive: true,
      },
      {
        organizationId: sfAgency.id,
        userId: demoUser.id,
        role: "AGENT",
        commissionSplit: 0.50,
        isActive: true,
      },
      {
        organizationId: sfAgency.id,
        userId: agentUser.id,
        role: "AGENT",
        commissionSplit: 0.50,
        isActive: true,
      },
    ],
  });

  // Create Contracts
  console.log("📄 Creating contracts...");

  const contracts = await prisma.contract.createMany({
    data: [
      {
        userId: demoUser.id,
        organizationId: sfAgency.id,
        carrierName: "Pacific Life",
        productType: "Life Insurance",
        contractNumber: "PL-2024-001",
        commissionLevel: 0.95,
        status: "ACTIVE",
        effectiveDate: new Date("2024-01-01"),
        expirationDate: new Date("2026-12-31"),
        requestedAt: new Date("2023-12-01"),
        approvedAt: new Date("2023-12-15"),
      },
      {
        userId: demoUser.id,
        organizationId: sfAgency.id,
        carrierName: "Nationwide",
        productType: "Annuity",
        contractNumber: "NW-2024-002",
        commissionLevel: 0.90,
        status: "ACTIVE",
        effectiveDate: new Date("2024-02-01"),
        expirationDate: new Date("2026-12-31"),
        requestedAt: new Date("2024-01-05"),
        approvedAt: new Date("2024-01-20"),
      },
      {
        userId: demoUser.id,
        organizationId: sfAgency.id,
        carrierName: "Mutual of Omaha",
        productType: "Life Insurance",
        contractNumber: null,
        commissionLevel: null,
        status: "PENDING",
        effectiveDate: null,
        requestedAt: new Date("2024-11-01"),
      },
    ],
  });

  // Create Quotes
  console.log("💰 Creating quotes...");

  const quote1 = await prisma.quote.create({
    data: {
      userId: demoUser.id,
      clientName: "John Smith",
      clientEmail: "john.smith@email.com",
      clientPhone: "(555) 400-4444",
      clientAge: 45,
      clientState: "CA",
      type: "TERM_LIFE",
      carrier: "Pacific Life",
      productName: "Term Life 20",
      coverageAmount: 500000,
      premium: 75.00,
      term: 20,
      status: "SENT",
      expiresAt: new Date("2024-12-31"),
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      userId: demoUser.id,
      clientName: "Mary Williams",
      clientEmail: "mary.w@email.com",
      clientPhone: "(555) 500-5555",
      clientAge: 62,
      clientState: "CA",
      type: "FIXED_ANNUITY",
      carrier: "Nationwide",
      productName: "Fixed Annuity Plus",
      coverageAmount: 250000,
      premium: 250000,
      status: "APPLIED",
    },
  });

  // Create Cases
  console.log("📋 Creating cases...");

  const case1 = await prisma.case.create({
    data: {
      userId: demoUser.id,
      quoteId: quote1.id,
      clientName: "John Smith",
      clientEmail: "john.smith@email.com",
      clientPhone: "(555) 400-4444",
      carrier: "Pacific Life",
      productType: "Term Life",
      productName: "Term Life 20",
      applicationNumber: "APP-2024-001",
      policyNumber: "POL-2024-001",
      coverageAmount: 500000,
      premium: 75.00,
      status: "ISSUED",
      statusNotes: "Policy issued successfully",
      externalId: "PL-APP-123456",
      externalSystem: "iPipeline iGo",
      submittedAt: new Date("2024-10-15"),
      approvedAt: new Date("2024-11-01"),
      issuedAt: new Date("2024-11-10"),
    },
  });

  const case2 = await prisma.case.create({
    data: {
      userId: demoUser.id,
      quoteId: quote2.id,
      clientName: "Mary Williams",
      clientEmail: "mary.w@email.com",
      clientPhone: "(555) 500-5555",
      carrier: "Nationwide",
      productType: "Fixed Annuity",
      productName: "Fixed Annuity Plus",
      applicationNumber: "APP-2024-002",
      coverageAmount: 250000,
      premium: 250000,
      status: "IN_UNDERWRITING",
      statusNotes: "Awaiting medical records",
      pendingRequirements: ["Medical Records", "Financial Statement"],
      externalId: "NW-APP-789012",
      externalSystem: "Firelight",
      submittedAt: new Date("2024-11-05"),
    },
  });

  // Create Case Notes
  console.log("📝 Creating case notes...");

  await prisma.caseNote.createMany({
    data: [
      {
        caseId: case1.id,
        content: "Application submitted successfully",
        isInternal: false,
        createdBy: demoUser.id,
        createdAt: new Date("2024-10-15"),
      },
      {
        caseId: case1.id,
        content: "Client completed medical exam",
        isInternal: false,
        createdBy: demoUser.id,
        createdAt: new Date("2024-10-25"),
      },
      {
        caseId: case2.id,
        content: "Application submitted to carrier",
        isInternal: false,
        createdBy: demoUser.id,
        createdAt: new Date("2024-11-05"),
      },
      {
        caseId: case2.id,
        content: "Carrier requested additional medical records",
        isInternal: true,
        createdBy: demoUser.id,
        createdAt: new Date("2024-11-12"),
      },
    ],
  });

  // Create Commissions
  console.log("💵 Creating commissions...");

  await prisma.commission.createMany({
    data: [
      {
        userId: demoUser.id,
        caseId: case1.id,
        type: "FIRST_YEAR",
        status: "PAID",
        carrier: "Pacific Life",
        policyNumber: "POL-2024-001",
        amount: 900.00,
        percentage: 0.95,
        splitAmount: 450.00,
        periodStart: new Date("2024-11-01"),
        periodEnd: new Date("2024-11-30"),
        paidAt: new Date("2024-12-05"),
      },
      {
        userId: demoUser.id,
        caseId: case2.id,
        type: "FIRST_YEAR",
        status: "PENDING",
        carrier: "Nationwide",
        amount: 5000.00,
        percentage: 0.90,
        splitAmount: 2500.00,
        periodStart: new Date("2024-12-01"),
        periodEnd: new Date("2024-12-31"),
      },
    ],
  });

  // Create Notifications
  console.log("🔔 Creating notifications...");

  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        type: "CASE_UPDATE",
        title: "Case Approved",
        message: "Your case for John Smith has been approved!",
        link: "/cases/1",
        isRead: false,
      },
      {
        userId: demoUser.id,
        type: "COMMISSION_PAID",
        title: "Commission Paid",
        message: "You received $450.00 in commission",
        link: "/commissions",
        isRead: true,
      },
      {
        userId: demoUser.id,
        type: "CONTRACT_UPDATE",
        title: "Contract Approved",
        message: "Your Mutual of Omaha contract request is being reviewed",
        link: "/contracts",
        isRead: false,
      },
    ],
  });

  // Create Audit Logs
  console.log("📜 Creating audit logs...");

  await prisma.auditLog.createMany({
    data: [
      {
        userId: demoUser.id,
        action: "LOGIN",
        entityType: "User",
        entityId: demoUser.id,
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
      },
      {
        userId: demoUser.id,
        action: "CREATE_CASE",
        entityType: "Case",
        entityId: case1.id,
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`  - Organizations: 3`);
  console.log(`  - Users: 4`);
  console.log(`  - Contracts: 3`);
  console.log(`  - Quotes: 2`);
  console.log(`  - Cases: 2`);
  console.log(`  - Commissions: 2`);
  console.log(`  - Notifications: 3`);
  console.log("\n🔑 Demo Login:");
  console.log(`  Email: demo@valorfinancial.com`);
  console.log(`  User ID: demo-user-id`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
