import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER = {
  email: 'test@valortest.com',
  password: 'TestPassword123!',
};

async function testLogin() {
  console.log('Testing login with:', TEST_USER.email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
  }

  if (data.user && data.session) {
    console.log('✅ Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Session expires:', new Date(data.session.expires_at! * 1000));
  } else {
    console.error('❌ No user or session returned');
    process.exit(1);
  }
}

testLogin();
