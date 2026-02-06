'use server'

import { createClient } from '@/utils/supabase/server'
// Removed the import from utils/supabase/admin to fix the reading issue
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- INTERNAL HELPER: CREATE ADMIN CLIENT HERE ---
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("System Error: NEXT_PUBLIC_SUPABASE_URL is missing.")
  }
  
  if (!serviceRoleKey) {
    // Debugging info: Print to server logs (not visible to user)
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is undefined on the server.")
    throw new Error("System Error: The Secret Key (SUPABASE_SERVICE_ROLE_KEY) is missing in Vercel.")
  }

  return createSupabaseClient(
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

// 1. CREATE NEW USER
export async function createUser(formData: FormData) {
  let errorMessage = null

  try {
    const supabase = await createClient()
    
    // Check if current user is Admin
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    
    if (profile?.role !== 'admin') {
      throw new Error("Unauthorized: Only Admins can create users")
    }

    // Initialize Admin Client (Using local function)
    const supabaseAdmin = getAdminClient()
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string

    // Create User in Supabase Auth
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true 
    })

    if (error) {
      throw new Error(error.message)
    }

    // Update their role in profiles table
    if (newUser.user) {
      await supabaseAdmin
        .from('profiles')
        .update({ role: role })
        .eq('id', newUser.user.id)
    }

    // Log the action
    try {
        await supabase.from('user_logs').insert({
            user_email: user?.email,
            action: 'CREATE_USER',
            details: `Created user ${email} as ${role}`
        })
    } catch (logErr) {
        console.error("Logging failed:", logErr)
    }

  } catch (error: any) {
    console.error("Create User Error:", error)
    errorMessage = error.message
  }

  if (errorMessage) {
    return redirect(`/admin/users?error=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

// 2. DELETE USER
export async function deleteUser(formData: FormData) {
  let errorMessage = null

  try {
    const supabase = await createClient()
    
    // Check Admin
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    
    if (profile?.role !== 'admin') throw new Error("Unauthorized")

    const targetUserId = formData.get('id') as string
    const targetUserEmail = formData.get('email') as string

    const supabaseAdmin = getAdminClient()
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (error) throw new Error(error.message)

    // Log
    try {
        await supabase.from('user_logs').insert({
            user_email: user?.email,
            action: 'DELETE_USER',
            details: `Deleted user ${targetUserEmail}`
        })
    } catch (logErr) {
        console.error("Logging failed:", logErr)
    }

  } catch (error: any) {
    errorMessage = error.message
  }

  if (errorMessage) {
    return redirect(`/admin/users?error=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/admin/users')
}

// 3. UPDATE ROLE
export async function updateUserRole(formData: FormData) {
  const supabase = await createClient()
  
  // Check Admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  
  if (profile?.role !== 'admin') return 

  const targetUserId = formData.get('id') as string
  const newRole = formData.get('role') as string

  const supabaseAdmin = getAdminClient()

  await supabaseAdmin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  // Log
  await supabase.from('user_logs').insert({
    user_email: user?.email,
    action: 'UPDATE_ROLE',
    details: `Updated user ${targetUserId} to ${newRole}`
  })

  revalidatePath('/admin/users')
}