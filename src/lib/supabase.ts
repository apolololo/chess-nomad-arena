
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL from environment variables or use default for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
// Get Supabase anon key from environment variables or use default for development
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
