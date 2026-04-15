import { prisma } from '../lib/db/prisma';

async function main() {
  console.log('Checking SmartOffice data...\n');

  // Check SmartOfficePolicy
  const policyCount = await prisma.smartOfficePolicy.count();
  console.log(`SmartOfficePolicy count: ${policyCount}`);

  if (policyCount > 0) {
    const samplePolicies = await prisma.smartOfficePolicy.findMany({
      take: 3,
      select: {
        id: true,
        policyNumber: true,
        primaryAdvisor: true,
        carrierName: true,
        status: true,
        tenantId: true,
      },
    });
    console.log('Sample policies:', JSON.stringify(samplePolicies, null, 2));
  }

  // Check Case table for comparison
  const caseCount = await prisma.case.count();
  console.log(`\nCase table count: ${caseCount}`);

  if (caseCount > 0) {
    const sampleCases = await prisma.case.findMany({
      take: 3,
      select: {
        id: true,
        policyNumber: true,
        primaryAdvisor: true,
        carrier: true,
        status: true,
        tenantId: true,
      },
    });
    console.log('Sample cases:', JSON.stringify(sampleCases, null, 2));
  }

  // Check SmartOfficeAgent
  const agentCount = await prisma.smartOfficeAgent.count();
  console.log(`\nSmartOfficeAgent count: ${agentCount}`);

  await prisma.$disconnect();
}

main().catch(console.error);
