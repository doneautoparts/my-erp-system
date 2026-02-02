'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCustomer(formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    company_name: formData.get('company_name') as string,
    type: formData.get('type') as string,
    phone: formData.get('phone') as string,
    email: formData.get('email') as string,
    address: formData.get('address') as string,
    tin_number: formData.get('tin_number') as string, // <--- NEW
  }

  const { error } = await supabase.from('customers').insert(data)

  if (error) return redirect(`/customers/new?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/customers')
  redirect('/customers')
}

export async function updateCustomer(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const data = {
    name: formData.get('name') as string,
    company_name: formData.get('company_name') as string,
    type: formData.get('type') as string,
    phone: formData.get('phone') as string,
    email: formData.get('email') as string,
    address: formData.get('address') as string,
    tin_number: formData.get('tin_number') as string, // <--- NEW
  }

  const { error } = await supabase.from('customers').update(data).eq('id', id)

  if (error) return redirect(`/customers/${id}?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/customers')
  redirect('/customers')
}