import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSsoTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'oauth_%'
      ORDER BY table_name
    `;

    console.log('✅ SSO Tables found:', tables);

    // Check if we can query them
    const clientCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM oauth_clients`;
    console.log('OAuth clients:', clientCount);

    const codeCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM oauth_authorization_codes`;
    console.log('Authorization codes:', codeCount);

    const tokenCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM oauth_tokens`;
    console.log('OAuth tokens:', tokenCount);

    console.log('\n✅ All SSO tables are working!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSsoTables();
