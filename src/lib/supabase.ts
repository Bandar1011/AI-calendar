import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // For development - use placeholder values if environment variables are not set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
} 