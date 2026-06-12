// Browser-safe Supabase client. Uses the public anon key + RLS — never put the
// service-role key or DATABASE_URL here (Vite would bundle it into the client).
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
