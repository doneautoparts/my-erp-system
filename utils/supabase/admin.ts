import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  // 1. Get variables and remove any invisible spaces (.trim())
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  // 2. Specific Checks
  if (!supabaseUrl) {
    throw new Error("System Error: The Database URL (NEXT_PUBLIC_SUPABASE_URL) is missing.")
  }
  
  if (!serviceRoleKey) {
    throw new Error("System Error: The Secret Key (SUPABASE_SERVICE_ROLE_KEY) is missing.")
  }

  // 3. Create Client
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}