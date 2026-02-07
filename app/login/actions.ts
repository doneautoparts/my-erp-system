'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // 1. Attempt Authentication
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword(data)

  if (authError) {
    redirect(`/login?error=${encodeURIComponent(authError.message)}`)
  }

  // 2. Check Approval & Role
  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('id', authData.user.id)
      .single()

    // IF NOT APPROVED -> LOGOUT AND REJECT
    if (profile && !profile.is_approved) {
      await supabase.auth.signOut()
      redirect(`/login?error=Account pending Admin approval.`)
    }

    // 3. RICH LOGGING (Step 2 Implementation)
    try {
      await supabase.from('user_logs').insert({
        user_email: data.email,
        action: 'LOGIN',
        details: 'User logged in successfully',
        resource_type: 'Auth',  // <--- NEW
        resource_id: authData.user.id, // <--- NEW (Tracks the User ID)
        severity: 'info' // <--- NEW
      })
    } catch (err) {
      console.error("Log error", err)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // LOG SIGNUP ATTEMPT
  try {
    await supabase.from('user_logs').insert({
        user_email: data.email,
        action: 'SIGNUP_ATTEMPT',
        details: 'New user registered (pending approval)',
        resource_type: 'Auth',
        severity: 'warning'
    })
  } catch (err) { console.error(err) }

  redirect(`/login?error=Account created! Please wait for Admin approval.`)
}