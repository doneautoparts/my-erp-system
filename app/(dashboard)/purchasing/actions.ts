'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ==============================
// 1. SUPPLIER ACTIONS
// ==============================

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

// ==============================
// 2. PURCHASE ORDER ACTIONS
// ==============================

export async function createPurchase(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Extract Data
  const supplierId = formData.get('supplier_id') as string
  const referenceNo = formData.get('reference_no') as string
  const purchaseDate = formData.get('purchase_date') as string
  const exchangeRate = parseFloat(formData.get('exchange_rate') as string) || 1.0

  // 1. Get Supplier Currency Details
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('currency')
    .eq('id', supplierId)
    .single()

  if (!supplier) {
    return redirect(`/purchasing/new?error=Supplier not found`)
  }

  // 2. Create the Purchase Record
  const { data: newPurchase, error } = await supabase
    .from('purchases')
    .insert({
      supplier_id: supplierId,
      reference_no: referenceNo,
      purchase_date: purchaseDate,
      currency: supplier.currency,
      exchange_rate: exchangeRate,
      status: 'Pending',
      created_by: user?.id
    })
    .select('id')
    .single()

  if (error) {
    return redirect(`/purchasing/new?error=${encodeURIComponent(error.message)}`)
  }

  // 3. Redirect to the "Add Items" page for this specific PO
  revalidatePath('/purchasing')
  redirect(`/purchasing/${newPurchase.id}`)
}