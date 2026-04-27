/**
 * Environment Variable Check
 *
 * Fails loudly if required environment variables are missing.
 * Run manually before deploying:
 *   npm run check-env
 *
 * Or hook into CI/CD as a pre-deploy step.
 */

interface EnvVar {
  name: string;
  description: string;
}

const REQUIRED_VARS: EnvVar[] = [
  // Database
  { name: 'DATABASE_URL', description: 'Supabase/Postgres connection string' },
  { name: 'DIRECT_URL', description: 'Direct Postgres URL for migrations' },

  // Supabase Auth
  { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anon key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key (server-only)' },

  // App
  { name: 'NEXT_PUBLIC_APP_URL', description: 'Public app base URL' },
  { name: 'JWT_SECRET', description: 'Secret for JWT / OAuth token signing' },

  // Email
  { name: 'RESEND_API_KEY', description: 'Resend API key for transactional email' },
  { name: 'FROM_EMAIL', description: 'From address for outbound emails' },
  { name: 'RESEND_WEBHOOK_SECRET', description: 'Resend/Svix webhook signing secret' },
];

const WARN_VARS: EnvVar[] = [
  // Stripe (required in production; optional in dev if Stripe is disabled)
  { name: 'STRIPE_SECRET_KEY', description: 'Stripe secret key' },
  { name: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook signing secret' },
];

function checkEnv(): void {
  let failed = false;
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of REQUIRED_VARS) {
    const val = process.env[v.name];
    if (!val || val.trim() === '') {
      missing.push(`  ✗ ${v.name.padEnd(35)} — ${v.description}`);
      failed = true;
    }
  }

  for (const v of WARN_VARS) {
    const val = process.env[v.name];
    if (!val || val.trim() === '') {
      warnings.push(`  ⚠ ${v.name.padEnd(35)} — ${v.description}`);
    }
  }

  if (warnings.length > 0) {
    console.warn('\nEnvironment warnings (optional in dev, required in production):');
    warnings.forEach((w) => console.warn(w));
  }

  if (failed) {
    console.error('\n❌ Missing required environment variables:\n');
    missing.forEach((m) => console.error(m));
    console.error('\nCopy .env.local.example and fill in the missing values.\n');
    process.exit(1);
  }

  console.log('✅ Environment check passed.');
}

checkEnv();
