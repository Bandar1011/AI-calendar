import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

if (!rawUrl || !rawAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

let supabaseUrl: string
try {
  supabaseUrl = new URL(rawUrl).toString()
} catch {
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL')
}

const supabaseAnonKey = rawAnonKey

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  }
})

// For server-side operations
export const createServerSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    }
  })
} 