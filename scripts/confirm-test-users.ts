import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_USERS = [
  'admin@test-agency-a.com',
  'admin@test-agency-b.com',
];

async function confirmTestUsers() {
  console.log('Confirming test user email addresses...\n');

  for (const email of TEST_USERS) {
    try {
      // Get user by email
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error(`❌ Error listing users:`, listError.message);
        continue;
      }

      const user = users.find(u => u.email === email);

      if (!user) {
        console.log(`⚠️  User not found: ${email}`);
        continue;
      }

      // Update user to confirm email
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (error) {
        console.error(`❌ Failed to confirm ${email}:`, error.message);
      } else {
        console.log(`✅ Confirmed email for: ${email}`);
      }
    } catch (error: any) {
      console.error(`❌ Error confirming ${email}:`, error.message);
    }
  }

  console.log('\n✅ Done! Test users can now log in.');
}

confirmTestUsers();
