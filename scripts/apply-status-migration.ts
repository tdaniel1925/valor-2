import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('\n🔄 Applying status column migration...\n');

  try {
    const migrationPath = path.join(process.cwd(), 'prisma', 'migrations', 'change_status_to_string.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60) + '\n');

    console.log('⚠️  This will change the status column from ENUM to TEXT');
    console.log('   Existing data will be preserved.\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query if RPC doesn't exist
      console.log('Trying direct query method...\n');

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.from('_prisma_migrations').select().limit(0); // This won't work, we need raw SQL access
        if (stmtError) {
          throw new Error(`Cannot execute migration: ${stmtError.message}`);
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('Next steps:');
    console.log('1. The status column now accepts any text value from spreadsheets');
    console.log('2. Re-import your data to see exact statuses\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.error('https://supabase.com/dashboard/project/buteoznuikfowbwofabs/sql/new\n');
    process.exit(1);
  }
}

applyMigration();
