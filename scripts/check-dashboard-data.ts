import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDashboardData() {
  try {
    console.log('=== CHECKING DASHBOARD DATA ===\n');

    // 1. Check total commissions
    const commissionCount = await prisma.commission.count();
    const commissionAggregate = await prisma.commission.aggregate({
      _sum: { amount: true },
      _min: { createdAt: true },
      _max: { createdAt: true }
    });

    console.log('📊 COMMISSIONS:');
    console.log(`  Total Count: ${commissionCount}`);
    console.log(`  Total Amount: $${commissionAggregate._sum.amount?.toLocaleString() || 0}`);
    console.log(`  Date Range: ${commissionAggregate._min.createdAt} to ${commissionAggregate._max.createdAt}`);

    // 2. Check YTD commissions (2026)
    const yearStart = new Date(2026, 0, 1);
    const ytdCommissions = await prisma.commission.aggregate({
      where: { createdAt: { gte: yearStart } },
      _sum: { amount: true },
      _count: true
    });

    console.log('\n📅 YTD 2026 COMMISSIONS:');
    console.log(`  Count: ${ytdCommissions._count}`);
    console.log(`  Amount: $${ytdCommissions._sum.amount?.toLocaleString() || 0}`);

    // 3. Check users
    const userCount = await prisma.user.count();
    const usersWithData = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        _count: {
          select: {
            commissions: true,
            cases: true
          }
        }
      },
      take: 5
    });

    console.log('\n👥 USERS:');
    console.log(`  Total Users: ${userCount}`);
    console.log('\n  Sample users with data:');
    usersWithData.forEach(user => {
      console.log(`    - ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`      Commissions: ${user._count.commissions}, Cases: ${user._count.cases}`);
    });

    // 4. Sample commissions
    const sampleCommissions = await prisma.commission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        carrier: true,
        type: true,
        status: true,
        createdAt: true,
        paidAt: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('\n💰 SAMPLE COMMISSIONS (latest 5):');
    sampleCommissions.forEach(comm => {
      console.log(`  - $${comm.amount.toLocaleString()} - ${comm.carrier} - ${comm.type} - ${comm.status}`);
      console.log(`    User: ${comm.user?.firstName} ${comm.user?.lastName}`);
      console.log(`    Created: ${comm.createdAt}, Paid: ${comm.paidAt || 'Not paid'}`);
    });

    // 5. Check cases
    const caseCount = await prisma.case.count();
    const ytdCases = await prisma.case.count({
      where: { createdAt: { gte: yearStart } }
    });

    console.log('\n📋 CASES:');
    console.log(`  Total Cases: ${caseCount}`);
    console.log(`  YTD 2026 Cases: ${ytdCases}`);

    // 6. Check if logged-in user has data
    console.log('\n🔍 CHECKING LOGGED-IN USER DATA:');
    console.log('  (Run this in browser to check current user)');
    console.log('  Navigate to: /api/dashboard');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDashboardData();
