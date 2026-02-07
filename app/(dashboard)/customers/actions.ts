'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- SECURITY GUARD ---
async function checkPermissions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()
    
    const role = profile?.role || 'user'
    
    if (role !== 'admin' && role !== 'manager') {
        throw new Error("Unauthorized: View Only Access. Contact Manager.")
    }
    return supabase
}

export async function createCustomer(formData: FormData) {
  try {
    const supabase = await checkPermissions() // <--- SECURITY CHECK

    const data = {
      name: formData.get('name') as string,
      company_name: formData.get('company_name') as string,
      type: formData.get('type') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      tin_number: formData.get('tin_number') as string,
    }

    const { error } = await supabase.from('customers').insert(data)

    if (error) throw new Error(error.message)

  } catch (err: any) {
    return redirect(`/customers/new?error=${encodeURIComponent(err.message)}`)
  }

  revalidatePath('/customers')
  redirect('/customers')
}

export async function updateCustomer(formData: FormData) {
  const id = formData.get('id') as string

  try {
    const supabase = await checkPermissions() // <--- SECURITY CHECK

    const data = {
      name: formData.get('name') as string,
      company_name: formData.get('company_name') as string,
      type: formData.get('type') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      tin_number: formData.get('tin_number') as string,
    }

    const { error } = await supabase.from('customers').update(data).eq('id', id)

    if (error) throw new Error(error.message)

  } catch (err: any) {
    return redirect(`/customers/${id}?error=${encodeURIComponent(err.message)}`)
  }

  revalidatePath('/customers')
  redirect('/customers')
}