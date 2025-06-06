import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use default storage (cookies/localStorage) for Supabase Auth
// Do NOT set a custom storage for SSR/middleware compatibility
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
export default supabase;