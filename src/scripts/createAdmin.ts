import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
config({ path: join(__dirname, '../../.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminAccount() {
  try {
    console.log('Starting admin account creation...');
    
    // 1. Create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'samuelekelejnr@gmail.com',
      password: 'Sammy4real1986@',
      options: {
        data: {
          full_name: 'System Administrator',
          is_admin: true,
          role: 'super_admin'
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user data returned');
    }

    console.log('User account created successfully:', authData.user.id);

    // 2. Update the profile to set is_admin to true
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_admin: true,
        role: 'super_admin',
        full_name: 'System Administrator'
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    console.log('Profile updated successfully');

    // 3. Verify the account was created correctly
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      console.error('Verification error:', verifyError);
      throw verifyError;
    }

    console.log('Verification successful:', verifyData);

    console.log('\nAdmin account created successfully!');
    console.log('Email:', authData.user.email);
    console.log('Password: Sammy4real1986@');
    console.log('Please verify your email address before logging in.');
    
    // 4. Try to sign in to verify credentials
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'samuelekelejnr@gmail.com',
      password: 'Sammy4real1986@'
    });

    if (signInError) {
      console.error('Sign in verification failed:', signInError);
    } else {
      console.log('Sign in verification successful');
    }

  } catch (error) {
    console.error('Error creating admin account:', error);
  }
}

// Run the function
createAdminAccount(); 