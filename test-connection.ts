import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = 'https://zjgsjkcwsvsztahuaewh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY is not set in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // First, try to get the current user
    console.log('Testing auth...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Auth successful!');
    console.log('User:', user);

    // Try to get a single profile without any joins
    console.log('\nTesting single profile access...');
    const { data: singleProfile, error: singleProfileError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .limit(1)
      .single();

    if (singleProfileError) {
      console.error('Single profile error:', singleProfileError);
    } else {
      console.log('Single profile:', singleProfile);
    }

    // Try to get virtual accounts without any joins
    console.log('\nTesting virtual accounts access...');
    const { data: virtualAccounts, error: virtualAccountsError } = await supabase
      .from('virtual_accounts')
      .select('id, account_number, bank_name')
      .limit(1);

    if (virtualAccountsError) {
      console.error('Virtual accounts error:', virtualAccountsError);
    } else {
      console.log('Virtual accounts:', virtualAccounts);
    }

    // Try a raw query to check if we can access the table at all
    console.log('\nTesting raw query...');
    const { data: rawData, error: rawError } = await supabase
      .rpc('check_table_access', { table_name: 'profiles' });

    if (rawError) {
      console.error('Raw query error:', rawError);
    } else {
      console.log('Raw query result:', rawData);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection(); 