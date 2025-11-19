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

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@valorfinancial.com",
      firstName: "Jessica",
      lastName: "Rodriguez",
      phone: "(555) 000-0001",
      role: "ADMINISTRATOR",
      status: "ACTIVE",
      emailVerified: true,
      profile: {
        create: {
          licenseNumber: "CA-LIC-111111",
          licenseState: "CA",
          licenseExpiration: new Date("2027-12-31"),
          npn: "11111111",
          gaid: "AD-001",
          agencyName: "Valor Financial Specialists HQ",
          yearsOfExperience: 15,
          specializations: ["Administration", "Compliance", "Training"],
          emailNotifications: true,
          smsNotifications: true,
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
        userId: adminUser.id,
        role: "ADMINISTRATOR",
        commissionSplit: 0.03,
        isActive: true,
      },
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

  // Additional quotes for demo user
  await prisma.quote.createMany({
    data: [
      // Whole Life
      {
        userId: demoUser.id,
        clientName: "Robert Chen",
        clientEmail: "robert.chen@email.com",
        clientPhone: "(555) 600-6666",
        clientAge: 38,
        clientState: "CA",
        type: "WHOLE_LIFE",
        carrier: "New York Life",
        productName: "Whole Life Custom Guarantee",
        coverageAmount: 750000,
        premium: 625.00,
        status: "GENERATED",
        expiresAt: new Date("2025-01-15"),
      },
      // Universal Life
      {
        userId: demoUser.id,
        clientName: "Jennifer Martinez",
        clientEmail: "j.martinez@email.com",
        clientPhone: "(555) 700-7777",
        clientAge: 52,
        clientState: "CA",
        type: "UNIVERSAL_LIFE",
        carrier: "Lincoln Financial",
        productName: "VUL Protector",
        coverageAmount: 1000000,
        premium: 850.00,
        status: "SENT",
        expiresAt: new Date("2025-02-01"),
      },
      // Indexed Universal Life
      {
        userId: demoUser.id,
        clientName: "David Kim",
        clientEmail: "dkim@email.com",
        clientPhone: "(555) 800-8888",
        clientAge: 41,
        clientState: "CA",
        type: "INDEXED_UNIVERSAL_LIFE",
        carrier: "Pacific Life",
        productName: "Indexed UL Accumulator",
        coverageAmount: 500000,
        premium: 425.00,
        status: "DRAFT",
      },
      // 10-Year Term
      {
        userId: demoUser.id,
        clientName: "Amanda White",
        clientEmail: "awhite@email.com",
        clientPhone: "(555) 900-9999",
        clientAge: 29,
        clientState: "CA",
        type: "TERM_LIFE",
        carrier: "Mutual of Omaha",
        productName: "Term Life 10",
        coverageAmount: 250000,
        premium: 25.00,
        term: 10,
        status: "SENT",
        expiresAt: new Date("2025-01-20"),
      },
      // 30-Year Term
      {
        userId: demoUser.id,
        clientName: "Michael Brown",
        clientEmail: "mbrown@email.com",
        clientPhone: "(555) 111-1111",
        clientAge: 35,
        clientState: "CA",
        type: "TERM_LIFE",
        carrier: "Protective Life",
        productName: "Term Life 30",
        coverageAmount: 1000000,
        premium: 95.00,
        term: 30,
        status: "APPLIED",
      },
      // Variable Annuity
      {
        userId: demoUser.id,
        clientName: "Patricia Davis",
        clientEmail: "pdavis@email.com",
        clientPhone: "(555) 222-2222",
        clientAge: 58,
        clientState: "CA",
        type: "VARIABLE_ANNUITY",
        carrier: "Nationwide",
        productName: "Variable Annuity Elite",
        coverageAmount: 500000,
        premium: 500000,
        status: "GENERATED",
        expiresAt: new Date("2025-02-15"),
      },
      // Indexed Annuity
      {
        userId: demoUser.id,
        clientName: "James Wilson",
        clientEmail: "jwilson@email.com",
        clientPhone: "(555) 333-3333",
        clientAge: 64,
        clientState: "CA",
        type: "INDEXED_ANNUITY",
        carrier: "Allianz",
        productName: "Index Advantage Income",
        coverageAmount: 350000,
        premium: 350000,
        status: "SENT",
        expiresAt: new Date("2025-01-30"),
      },
      // Fixed Annuity
      {
        userId: demoUser.id,
        clientName: "Linda Garcia",
        clientEmail: "lgarcia@email.com",
        clientPhone: "(555) 444-4444",
        clientAge: 67,
        clientState: "CA",
        type: "FIXED_ANNUITY",
        carrier: "American Equity",
        productName: "Fixed Rate Annuity",
        coverageAmount: 200000,
        premium: 200000,
        status: "GENERATED",
        expiresAt: new Date("2025-02-28"),
      },
      // Whole Life - Declined
      {
        userId: demoUser.id,
        clientName: "Thomas Anderson",
        clientEmail: "tanderson@email.com",
        clientPhone: "(555) 555-5555",
        clientAge: 55,
        clientState: "CA",
        type: "WHOLE_LIFE",
        carrier: "MassMutual",
        productName: "Whole Life 100",
        coverageAmount: 500000,
        premium: 550.00,
        status: "EXPIRED",
        expiresAt: new Date("2024-11-30"),
      },
      // Term Life - Draft
      {
        userId: demoUser.id,
        clientName: "Sandra Lee",
        clientEmail: "slee@email.com",
        clientPhone: "(555) 666-6666",
        clientAge: 33,
        clientState: "CA",
        type: "TERM_LIFE",
        carrier: "Prudential",
        productName: "Term Life 20",
        coverageAmount: 750000,
        premium: 65.00,
        term: 20,
        status: "DRAFT",
      },
      // Variable Life
      {
        userId: agentUser.id,
        clientName: "Christopher Taylor",
        clientEmail: "ctaylor@email.com",
        clientPhone: "(555) 777-7777",
        clientAge: 48,
        clientState: "CA",
        type: "VARIABLE_LIFE",
        carrier: "Lincoln Financial",
        productName: "Variable Life Flex",
        coverageAmount: 800000,
        premium: 725.00,
        status: "SENT",
        expiresAt: new Date("2025-01-25"),
      },
      // Indexed Annuity for other agent
      {
        userId: agentUser.id,
        clientName: "Elizabeth Moore",
        clientEmail: "emoore@email.com",
        clientPhone: "(555) 888-8888",
        clientAge: 61,
        clientState: "CA",
        type: "INDEXED_ANNUITY",
        carrier: "Great American",
        productName: "Index Elite",
        coverageAmount: 425000,
        premium: 425000,
        status: "APPLIED",
      },
    ],
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

  // Additional cases
  const case3 = await prisma.case.create({
    data: {
      userId: demoUser.id,
      clientName: "Robert Chen",
      clientEmail: "robert.chen@email.com",
      clientPhone: "(555) 600-6666",
      carrier: "New York Life",
      productType: "Whole Life",
      productName: "Whole Life Custom Guarantee",
      applicationNumber: "APP-2024-003",
      policyNumber: "POL-2024-003",
      coverageAmount: 750000,
      premium: 625.00,
      status: "APPROVED",
      statusNotes: "Approved standard rates",
      externalId: "NYL-APP-345678",
      externalSystem: "iPipeline iGo",
      submittedAt: new Date("2024-10-20"),
      approvedAt: new Date("2024-11-15"),
    },
  });

  const case4 = await prisma.case.create({
    data: {
      userId: agentUser.id,
      clientName: "Jennifer Martinez",
      clientEmail: "j.martinez@email.com",
      clientPhone: "(555) 700-7777",
      carrier: "Lincoln Financial",
      productType: "Universal Life",
      productName: "VUL Protector",
      applicationNumber: "APP-2024-004",
      policyNumber: "POL-2024-004",
      coverageAmount: 1000000,
      premium: 850.00,
      status: "ISSUED",
      statusNotes: "Policy delivered to client",
      externalId: "LFG-APP-456789",
      externalSystem: "Firelight",
      submittedAt: new Date("2024-09-15"),
      approvedAt: new Date("2024-10-10"),
      issuedAt: new Date("2024-10-25"),
    },
  });

  const case5 = await prisma.case.create({
    data: {
      userId: demoUser.id,
      clientName: "David Kim",
      clientEmail: "dkim@email.com",
      clientPhone: "(555) 800-8888",
      carrier: "Pacific Life",
      productType: "Indexed Universal Life",
      productName: "Indexed UL Accumulator",
      applicationNumber: "APP-2024-005",
      coverageAmount: 500000,
      premium: 425.00,
      status: "PENDING_REQUIREMENTS",
      statusNotes: "Waiting for client to complete medical exam",
      pendingRequirements: ["Medical Exam", "Attending Physician Statement"],
      externalId: "PL-APP-567890",
      externalSystem: "iPipeline iGo",
      submittedAt: new Date("2024-11-12"),
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
      {
        caseId: case3.id,
        content: "Application submitted with all requirements",
        isInternal: false,
        createdBy: demoUser.id,
        createdAt: new Date("2024-10-20"),
      },
      {
        caseId: case3.id,
        content: "Approved at standard rates - great news!",
        isInternal: false,
        createdBy: demoUser.id,
        createdAt: new Date("2024-11-15"),
      },
      {
        caseId: case4.id,
        content: "Initial application submitted",
        isInternal: false,
        createdBy: agentUser.id,
        createdAt: new Date("2024-09-15"),
      },
      {
        caseId: case4.id,
        content: "Policy issued and delivered to client",
        isInternal: false,
        createdBy: agentUser.id,
        createdAt: new Date("2024-10-25"),
      },
      {
        caseId: case5.id,
        content: "Application submitted - waiting on medical exam",
        isInternal: false,
        createdBy: demoUser.id,
        createdAt: new Date("2024-11-12"),
      },
      {
        caseId: case5.id,
        content: "Followed up with client about scheduling exam",
        isInternal: true,
        createdBy: demoUser.id,
        createdAt: new Date("2024-11-16"),
      },
    ],
  });

  // Create Commissions
  console.log("💵 Creating commissions...");

  await prisma.commission.createMany({
    data: [
      // Paid commissions
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
        caseId: case3.id,
        type: "FIRST_YEAR",
        status: "PAID",
        carrier: "New York Life",
        policyNumber: "POL-2024-003",
        amount: 7500.00,
        percentage: 1.00,
        splitAmount: 3750.00,
        periodStart: new Date("2024-10-01"),
        periodEnd: new Date("2024-10-31"),
        paidAt: new Date("2024-11-15"),
      },
      {
        userId: agentUser.id,
        caseId: case4.id,
        type: "FIRST_YEAR",
        status: "PAID",
        carrier: "Lincoln Financial",
        policyNumber: "POL-2024-004",
        amount: 10200.00,
        percentage: 1.00,
        splitAmount: 5100.00,
        periodStart: new Date("2024-10-01"),
        periodEnd: new Date("2024-10-31"),
        paidAt: new Date("2024-11-10"),
      },
      // Pending commissions
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
      // Renewal commissions
      {
        userId: demoUser.id,
        type: "RENEWAL",
        status: "PAID",
        carrier: "Pacific Life",
        policyNumber: "POL-2023-045",
        amount: 125.00,
        percentage: 0.05,
        splitAmount: 62.50,
        periodStart: new Date("2024-11-01"),
        periodEnd: new Date("2024-11-30"),
        paidAt: new Date("2024-12-01"),
      },
      {
        userId: agentUser.id,
        type: "RENEWAL",
        status: "PAID",
        carrier: "Mutual of Omaha",
        policyNumber: "POL-2023-078",
        amount: 85.00,
        percentage: 0.04,
        splitAmount: 42.50,
        periodStart: new Date("2024-11-01"),
        periodEnd: new Date("2024-11-30"),
        paidAt: new Date("2024-12-01"),
      },
      // Override commissions for manager
      {
        userId: managerUser.id,
        caseId: case1.id,
        type: "OVERRIDE",
        status: "PAID",
        carrier: "Pacific Life",
        policyNumber: "POL-2024-001",
        amount: 135.00,
        percentage: 0.15,
        splitAmount: 135.00,
        periodStart: new Date("2024-11-01"),
        periodEnd: new Date("2024-11-30"),
        paidAt: new Date("2024-12-05"),
      },
      {
        userId: managerUser.id,
        caseId: case4.id,
        type: "OVERRIDE",
        status: "PAID",
        carrier: "Lincoln Financial",
        policyNumber: "POL-2024-004",
        amount: 1530.00,
        percentage: 0.15,
        splitAmount: 1530.00,
        periodStart: new Date("2024-10-01"),
        periodEnd: new Date("2024-10-31"),
        paidAt: new Date("2024-11-10"),
      },
      // Bonus commission
      {
        userId: demoUser.id,
        type: "BONUS",
        status: "PAID",
        carrier: "Pacific Life",
        amount: 500.00,
        percentage: null,
        splitAmount: 500.00,
        periodStart: new Date("2024-10-01"),
        periodEnd: new Date("2024-10-31"),
        paidAt: new Date("2024-11-15"),
      },
      // Trail commission
      {
        userId: demoUser.id,
        type: "TRAIL",
        status: "PAID",
        carrier: "Nationwide",
        policyNumber: "POL-2022-123",
        amount: 75.00,
        percentage: 0.003,
        splitAmount: 37.50,
        periodStart: new Date("2024-11-01"),
        periodEnd: new Date("2024-11-30"),
        paidAt: new Date("2024-12-01"),
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
      {
        userId: adminUser.id,
        action: "LOGIN",
        entityType: "User",
        entityId: adminUser.id,
        ipAddress: "192.168.1.200",
        userAgent: "Mozilla/5.0",
      },
      {
        userId: managerUser.id,
        action: "VIEW_REPORT",
        entityType: "Report",
        entityId: "commission-report",
        ipAddress: "192.168.1.150",
        userAgent: "Mozilla/5.0",
      },
    ],
  });

  // Create Goals
  console.log("🎯 Creating goals...");

  await prisma.goal.createMany({
    data: [
      // Revenue Goals
      {
        userId: demoUser.id,
        title: "Monthly Commission Target - December",
        description: "Earn $10,000 in commissions for December 2024",
        type: "COMMISSION",
        target: 10000,
        startDate: new Date("2024-12-01"),
        endDate: new Date("2024-12-31"),
      },
      {
        userId: demoUser.id,
        title: "Q1 2025 Revenue Goal",
        description: "Generate $30,000 in total commissions for Q1 2025",
        type: "COMMISSION",
        target: 30000,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-03-31"),
      },
      {
        userId: demoUser.id,
        title: "Annual Revenue Target 2025",
        description: "Achieve $120,000 in annual commission income",
        type: "COMMISSION",
        target: 120000,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
      },
      // Production Goals
      {
        userId: demoUser.id,
        title: "Monthly Case Goal - December",
        description: "Submit 8 new cases in December 2024",
        type: "CASES",
        target: 8,
        startDate: new Date("2024-12-01"),
        endDate: new Date("2024-12-31"),
      },
      {
        userId: demoUser.id,
        title: "Q1 Policy Production",
        description: "Issue 25 new policies in Q1 2025",
        type: "PRODUCTION",
        target: 25,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-03-31"),
      },
      {
        userId: demoUser.id,
        title: "Annuity Production Target",
        description: "Write $2,000,000 in annuity premium this year",
        type: "PRODUCTION",
        target: 2000000,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
      },
      // Manager Goals
      {
        userId: managerUser.id,
        title: "Team Revenue Goal - Q1",
        description: "Team to generate $150,000 in commissions",
        type: "COMMISSION",
        target: 150000,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-03-31"),
      },
      {
        userId: managerUser.id,
        title: "Team Case Production",
        description: "Team to submit 50 cases in Q1",
        type: "CASES",
        target: 50,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-03-31"),
      },
      // Executive Goals
      {
        userId: executiveUser.id,
        title: "Organization Annual Revenue",
        description: "Organization to reach $5M in total production",
        type: "PRODUCTION",
        target: 5000000,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
      },
      {
        userId: executiveUser.id,
        title: "Q1 Organization Growth",
        description: "Achieve 20% growth in Q1 vs Q4 2024",
        type: "COMMISSION",
        target: 1200000,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-03-31"),
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`  - Organizations: 3`);
  console.log(`  - Users: 5 (1 Admin, 1 Executive, 1 Manager, 2 Agents)`);
  console.log(`  - Contracts: 3`);
  console.log(`  - Quotes: 15`);
  console.log(`  - Cases: 5`);
  console.log(`  - Case Notes: 10`);
  console.log(`  - Commissions: 11 (includes First Year, Renewal, Override, Bonus, Trail)`);
  console.log(`  - Notifications: 3`);
  console.log(`  - Goals: 10`);
  console.log(`  - Audit Logs: 4`);
  console.log("\n🔑 Demo Logins:");
  console.log(`  Agent: demo@valorfinancial.com (User ID: demo-user-id)`);
  console.log(`  Admin: admin@valorfinancial.com`);
  console.log(`  Manager: michael.chen@valorfinancial.com`);
  console.log(`  Executive: phil.martinez@valorfinancial.com`);
  console.log(`  Agent 2: sarah.johnson@valorfinancial.com`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
