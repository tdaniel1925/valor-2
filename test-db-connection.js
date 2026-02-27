const { PrismaClient } = require('@prisma/client');

// Override environment variables - use direct connection
process.env.DATABASE_URL = 'postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres';
process.env.DIRECT_URL = 'postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing direct database connection (db.buteoznuikfowbwofabs.supabase.co:5432)...');
    await prisma.$connect();
    console.log('✓ Successfully connected to database!');

    // Try a simple query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✓ Database version:', result);

    // Check if any tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('✓ Existing tables:', tables.length > 0 ? tables.map(t => t.table_name).join(', ') : 'None');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
