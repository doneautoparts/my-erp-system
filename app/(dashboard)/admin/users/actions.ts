'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 1. CREATE NEW USER
export async function createUser(formData: FormData) {
  const supabase = await createClient()
  
  // Check if current user is Admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  
  if (profile?.role !== 'admin') {
    throw new Error("Unauthorized: Only Admins can create users")
  }

  // Use Admin Client to create user without logging out
  const supabaseAdmin = createAdminClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Auto-confirm email
  })

  if (error) {
    return redirect(`/admin/users?error=${encodeURIComponent(error.message)}`)
  }

  // Update their role in profiles table
  if (newUser.user) {
    await supabaseAdmin
      .from('profiles')
      .update({ role: role })
      .eq('id', newUser.user.id)
  }

  // Log the action
  await supabase.from('user_logs').insert({
    user_email: user?.email,
    action: 'CREATE_USER',
    details: `Created user ${email} as ${role}`
  })

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

// 2. DELETE USER
export async function deleteUser(formData: FormData) {
  const supabase = await createClient()
  
  // Check Admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  
  if (profile?.role !== 'admin') throw new Error("Unauthorized")

  const targetUserId = formData.get('id') as string
  const targetUserEmail = formData.get('email') as string

  const supabaseAdmin = createAdminClient()
  
  // Delete from Auth (Cascade deletes profile)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

  if (error) {
    return redirect(`/admin/users?error=${encodeURIComponent(error.message)}`)
  }

  // Log
  await supabase.from('user_logs').insert({
    user_email: user?.email,
    action: 'DELETE_USER',
    details: `Deleted user ${targetUserEmail}`
  })

  revalidatePath('/admin/users')
}

// 3. UPDATE ROLE
export async function updateUserRole(formData: FormData) {
  const supabase = await createClient()
  
  // Check Admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
  
  if (profile?.role !== 'admin') throw new Error("Unauthorized")

  const targetUserId = formData.get('id') as string
  const newRole = formData.get('role') as string

  const supabaseAdmin = createAdminClient()

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