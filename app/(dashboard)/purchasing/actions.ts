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
    .insert({ name, contact_person: contact, email, phone, currency })

  if (error) return redirect(`/purchasing/suppliers/new?error=${encodeURIComponent(error.message)}`)

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
    .update({ name, contact_person: contact, email, phone, currency })
    .eq('id', id)

  if (error) return redirect(`/purchasing/suppliers/${id}?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/purchasing/suppliers')
  redirect('/purchasing/suppliers')
}

// ==============================
// 2. PURCHASE ORDER ACTIONS
// ==============================

export async function createPurchase(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const supplierId = formData.get('supplier_id') as string
  const referenceNo = formData.get('reference_no') as string
  const purchaseDate = formData.get('purchase_date') as string
  const exchangeRate = parseFloat(formData.get('exchange_rate') as string) || 1.0

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('currency')
    .eq('id', supplierId)
    .single()

  if (!supplier) return redirect(`/purchasing/new?error=Supplier not found`)

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

  if (error) return redirect(`/purchasing/new?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/purchasing')
  redirect(`/purchasing/${newPurchase.id}`)
}

// ==============================
// 3. PURCHASE ITEM ACTIONS (NEW)
// ==============================

export async function addItemToPurchase(formData: FormData) {
  const supabase = await createClient()

  const purchaseId = formData.get('purchase_id') as string
  const variantId = formData.get('variant_id') as string
  const quantity = parseInt(formData.get('quantity') as string)
  const unitCost = parseFloat(formData.get('unit_cost') as string)

  if (!variantId) {
    return redirect(`/purchasing/${purchaseId}?error=Please select a product`)
  }

  const totalCost = quantity * unitCost

  const { error } = await supabase
    .from('purchase_items')
    .insert({
      purchase_id: purchaseId,
      variant_id: variantId,
      quantity,
      unit_cost: unitCost,
      total_cost: totalCost
    })

  if (error) return redirect(`/purchasing/${purchaseId}?error=${encodeURIComponent(error.message)}`)

  // Update Total Amount on the Purchase Header
  await calculatePurchaseTotal(purchaseId, supabase)

  revalidatePath(`/purchasing/${purchaseId}`)
}

export async function removeItemFromPurchase(formData: FormData) {
  const supabase = await createClient()
  const itemId = formData.get('item_id') as string
  const purchaseId = formData.get('purchase_id') as string

  const { error } = await supabase.from('purchase_items').delete().eq('id', itemId)

  if (error) return redirect(`/purchasing/${purchaseId}?error=${encodeURIComponent(error.message)}`)

  await calculatePurchaseTotal(purchaseId, supabase)

  revalidatePath(`/purchasing/${purchaseId}`)
}

export async function completePurchase(formData: FormData) {
  const supabase = await createClient()
  const purchaseId = formData.get('purchase_id') as string

  // Update status to 'Completed'. 
  // The Database Trigger (handle_purchase_stock) will automatically increase inventory!
  const { error } = await supabase
    .from('purchases')
    .update({ status: 'Completed' })
    .eq('id', purchaseId)

  if (error) return redirect(`/purchasing/${purchaseId}?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/purchasing')
  revalidatePath('/inventory') // Refresh inventory so we see new stock
  redirect('/purchasing')
}

// Helper: Recalculate the Grand Total of the PO
async function calculatePurchaseTotal(purchaseId: string, supabase: any) {
  const { data: items } = await supabase
    .from('purchase_items')
    .select('total_cost')
    .eq('purchase_id', purchaseId)

  const total = items?.reduce((sum: number, item: any) => sum + item.total_cost, 0) || 0

  await supabase
    .from('purchases')
    .update({ total_amount: total })
    .eq('id', purchaseId)
}