'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 1. CREATE USER (Still needs Admin Client if we want to bypass signup, but let's keep it simple or redirect)
// For now, we will just redirect to the signup page if they try this, or keep the existing logic if it works.
// However, since we are fixing a crash, let's comment out the risky parts or leave them but focus on UPDATE.

// 2. DELETE USER (Uses standard client now, relies on RLS)
export async function deleteUser(formData: FormData) {
  const supabase = await createClient()
  const targetUserId = formData.get('id') as string

  // Try to delete from profiles (Auth user deletion usually requires Service Role, 
  // but deleting the profile is a good start for the UI).
  // Note: To fully delete from Auth, we usually need the Service Role. 
  // If this fails, we will know.
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', targetUserId)

  if (error) {
    return redirect(`/admin/users?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/users')
}

// 3. UPDATE ROLE (Uses standard client now - Safe!)
export async function updateUserRole(formData: FormData) {
  const supabase = await createClient()
  
  const targetUserId = formData.get('id') as string
  const newRole = formData.get('role') as string

  // This now works because of the new RLS policy we just added
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) {
    return redirect(`/admin/users?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/users')
}

// 4. CREATE USER (Simplified Redirect)
// Since we are using the "Incognito Sign Up" method, we don't need this complex function crashing the app.
export async function createUser(formData: FormData) {
    // Placeholder to prevent crash if form is submitted
    return redirect(`/admin/users?error=Please use the Sign Up page in an Incognito window to add users.`)
}