import { createClient } from "@supabase/supabase-js"

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const createClientSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance

  // Use environment variables if available, otherwise fall back to hardcoded values
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fkygaoyqrcceybfwrpnv.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreWdhb3lxcmNjZXliZndycG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzA2NzQsImV4cCI6MjA2MjgwNjY3NH0.Ldas24-MU0JtqBcSXwfna3Nl9x4ka3Nar4xLhQvS4aM"

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)

  return supabaseInstance
}

export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || "https://fkygaoyqrcceybfwrpnv.supabase.co"
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZreWdhb3lxcmNjZXliZndycG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzA2NzQsImV4cCI6MjA2MjgwNjY3NH0.Ldas24-MU0JtqBcSXwfna3Nl9x4ka3Nar4xLhQvS4aM"

  return createClient(supabaseUrl, supabaseServiceKey)
}
