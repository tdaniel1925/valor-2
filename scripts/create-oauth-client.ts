import { PrismaClient } from '@prisma/client';
import { generateClientId, generateClientSecret, hashClientSecret } from '../lib/sso/jwt';

const prisma = new PrismaClient();

async function createOAuthClient() {
  try {
    // Get tenant (using first tenant or valor tenant)
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: 'valor' },
          { status: 'ACTIVE' }
        ]
      }
    });

    if (!tenant) {
      console.error('❌ No tenant found. Create a tenant first.');
      process.exit(1);
    }

    // Generate credentials
    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const hashedSecret = await hashClientSecret(clientSecret);

    // Get client details from command line or use defaults
    const name = process.argv[2] || 'Test OAuth Client';
    const redirectUri = process.argv[3] || 'http://localhost:3001/callback';

    // Create OAuth client
    const client = await prisma.oAuthClient.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        clientId,
        clientSecret: hashedSecret,
        name,
        description: `OAuth client for ${name}`,
        redirectUris: [redirectUri, `${redirectUri}/oauth/callback`],
        allowedScopes: ['openid', 'profile', 'email', 'tenant', 'role'],
        grantTypes: ['authorization_code', 'refresh_token'],
        accessTokenTTL: 3600, // 1 hour
        refreshTokenTTL: 2592000, // 30 days
        isActive: true,
      },
    });

    console.log('\n✅ OAuth Client Created Successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CLIENT CREDENTIALS (Save these securely!)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n🆔 Client ID:\n   ${clientId}`);
    console.log(`\n🔑 Client Secret:\n   ${clientSecret}`);
    console.log('\n⚠️  IMPORTANT: Save the client secret now!');
    console.log('   You will NOT be able to see it again.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📱 CLIENT DETAILS:');
    console.log(`   Name: ${client.name}`);
    console.log(`   Tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`   Redirect URIs:`);
    client.redirectUris.forEach(uri => console.log(`     - ${uri}`));
    console.log(`   Scopes: ${client.allowedScopes.join(', ')}`);
    console.log(`   Grant Types: ${client.grantTypes.join(', ')}`);
    console.log(`   Access Token TTL: ${client.accessTokenTTL}s (${client.accessTokenTTL / 3600}h)`);
    console.log(`   Refresh Token TTL: ${client.refreshTokenTTL}s (${client.refreshTokenTTL / 86400}d)`);

    console.log('\n🔗 AUTHORIZATION URL:');
    const authUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&state=test123`;
    console.log(`   ${authUrl}`);

    console.log('\n💡 QUICK START:');
    console.log('   1. Visit the authorization URL above');
    console.log('   2. Log in to Valor (if not already logged in)');
    console.log('   3. You\'ll be redirected with an authorization code');
    console.log('   4. Exchange the code for an access token:');
    console.log(`\n   curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/token \\`);
    console.log('     -H "Content-Type: application/x-www-form-urlencoded" \\');
    console.log('     -d "grant_type=authorization_code" \\');
    console.log('     -d "code=YOUR_CODE_HERE" \\');
    console.log(`     -d "redirect_uri=${redirectUri}" \\`);
    console.log(`     -d "client_id=${clientId}" \\`);
    console.log(`     -d "client_secret=${clientSecret}"`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ Failed to create OAuth client:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: npx tsx scripts/create-oauth-client.ts [name] [redirect_uri]
createOAuthClient();
