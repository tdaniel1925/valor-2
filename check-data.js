const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = 'postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres';
process.env.DIRECT_URL = 'postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres';

const prisma = new PrismaClient();

async function checkData() {
  try {
    await prisma.$connect();
    console.log('Checking database for existing data...\n');

    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    const productCount = await prisma.productInfo.count();
    const caseCount = await prisma.case.count();
    const commissionCount = await prisma.commission.count();
    const quoteCount = await prisma.quote.count();

    console.log('📊 Database Statistics:');
    console.log('  Users:', userCount);
    console.log('  Organizations:', orgCount);
    console.log('  Products:', productCount);
    console.log('  Cases:', caseCount);
    console.log('  Commissions:', commissionCount);
    console.log('  Quotes:', quoteCount);
    console.log('');

    if (userCount === 0) {
      console.log('⚠️  Database is empty - seed data needed');
    } else {
      console.log('✓ Database has existing data');
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error checking data:', error.message);
    process.exit(1);
  }
}

checkData();
