'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- CREATE SUPPLIER ---
export async function createSupplier(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const contact = formData.get('contact') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const currency = formData.get('currency') as string

  const { error } = await supabase
    .from('suppliers')
    .insert({
      name,
      contact_person: contact,
      email,
      phone,
      currency
    })

  if (error) {
    return redirect(`/purchasing/suppliers/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/purchasing/suppliers')
  redirect('/purchasing/suppliers')
}

// --- UPDATE SUPPLIER ---
export async function updateSupplier(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const contact = formData.get('contact') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const currency = formData.get('currency') as string

  const { error } = await supabase
    .from('suppliers')
    .update({
      name,
      contact_person: contact,
      email,
      phone,
      currency
    })
    .eq('id', id)

  if (error) {
    return redirect(`/purchasing/suppliers/${id}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/purchasing/suppliers')
  redirect('/purchasing/suppliers')
}