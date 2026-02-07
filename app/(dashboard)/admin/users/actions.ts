'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 1. DELETE USER
export async function deleteUser(formData: FormData) {
  const supabase = await createClient()
  const targetUserId = formData.get('id') as string

  const { error } = await supabase.from('profiles').delete().eq('id', targetUserId)

  if (error) return redirect(`/admin/users?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/users')
}

// 2. UPDATE ROLE
export async function updateUserRole(formData: FormData) {
  const supabase = await createClient()
  const targetUserId = formData.get('id') as string
  const newRole = formData.get('role') as string

  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetUserId)

  if (error) return redirect(`/admin/users?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/users')
}

// 3. TOGGLE APPROVAL (NEW)
export async function toggleApproval(formData: FormData) {
  const supabase = await createClient()
  const targetUserId = formData.get('id') as string
  const currentStatus = formData.get('current_status') === 'true'

  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: !currentStatus }) // Flip the status
    .eq('id', targetUserId)

  if (error) return redirect(`/admin/users?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/users')
}

// 4. CREATE USER (Placeholder/Redirect)
export async function createUser(formData: FormData) {
    return redirect(`/admin/users?error=Please use the Sign Up page in an Incognito window.`)
}