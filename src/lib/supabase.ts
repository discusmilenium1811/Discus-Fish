import { createClient } from '@supabase/supabase-js'

// Browser-side Supabase client. Uses the PUBLIC (publishable/anon) key — every
// data access is still protected by Row-Level Security on the server.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced in the console during local dev if the .env isn't filled in.
  console.warn(
    'Supabase env vars are missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  username: string | null
  email: string | null
  role: UserRole
}
