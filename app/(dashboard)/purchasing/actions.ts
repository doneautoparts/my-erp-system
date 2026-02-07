'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- SECURITY GUARD ---
async function checkPermissions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    const role = profile?.role || 'user'
    
    if (role !== 'admin' && role !== 'manager') {
        throw new Error("Unauthorized: View Only Access. Contact Manager.")
    }
    return { supabase, user }
}

// 1. SUPPLIER ACTIONS
export async function createSupplier(formData: FormData) {
  try {
    const { supabase } = await checkPermissions()
    const name = formData.get('name') as string
    const contact = formData.get('contact') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const tin_number = formData.get('tin_number') as string
    const currency = formData.get('currency') as string

    const { error } = await supabase.from('suppliers').insert({ name, contact_person: contact, email, phone, address, tin_number, currency })
    if (error) throw error
  } catch (err: any) {
    return redirect(`/purchasing/suppliers/new?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath('/purchasing/suppliers'); redirect('/purchasing/suppliers')
}

export async function updateSupplier(formData: FormData) {
  const id = formData.get('id') as string
  try {
    const { supabase } = await checkPermissions()
    const name = formData.get('name') as string
    const contact = formData.get('contact') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const tin_number = formData.get('tin_number') as string
    const currency = formData.get('currency') as string

    const { error } = await supabase.from('suppliers').update({ name, contact_person: contact, email, phone, address, tin_number, currency }).eq('id', id)
    if (error) throw error
  } catch (err: any) {
    return redirect(`/purchasing/suppliers/${id}?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath('/purchasing/suppliers'); redirect('/purchasing/suppliers')
}

// 2. PURCHASE ORDER ACTIONS
export async function createPurchase(formData: FormData) {
  let newId = null
  try {
    const { supabase, user } = await checkPermissions()
    const companyId = formData.get('company_id') as string
    const supplierId = formData.get('supplier_id') as string
    const purchaseDate = formData.get('purchase_date') as string
    const exchangeRate = parseFloat(formData.get('exchange_rate') as string) || 1.0
    const supplierRef = formData.get('supplier_ref') as string 

    const { data: refData, error: refError } = await supabase.rpc('generate_doc_number', { prefix: 'POT' })
    if (refError) throw refError
    const docNumber = refData as string

    const { data: supplier } = await supabase.from('suppliers').select('currency').eq('id', supplierId).single()
    if (!supplier) throw new Error("Supplier not found")

    const { data: newPurchase, error } = await supabase.from('purchases').insert({
      company_id: companyId, supplier_id: supplierId, reference_no: docNumber, supplier_ref: supplierRef,
      purchase_date: purchaseDate, currency: supplier.currency, exchange_rate: exchangeRate,
      status: 'Pending', created_by: user?.id
    }).select('id').single()

    if (error) throw error
    newId = newPurchase.id
  } catch (err: any) {
    return redirect(`/purchasing/new?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath('/purchasing'); redirect(`/purchasing/${newId}`)
}

// 3. PURCHASE ITEM ACTIONS
export async function addItemToPurchase(formData: FormData) {
  const purchaseId = formData.get('purchase_id') as string
  try {
    const { supabase } = await checkPermissions()
    const variantId = formData.get('variant_id') as string
    const quantity = parseInt(formData.get('quantity') as string)
    const unitCost = parseFloat(formData.get('unit_cost') as string)
    if (!variantId) throw new Error("Product needed")

    const totalCost = quantity * unitCost
    const { error } = await supabase.from('purchase_items').insert({
      purchase_id: purchaseId, variant_id: variantId, quantity, unit_cost: unitCost, total_cost: totalCost
    })
    if (error) throw error
    await calculatePurchaseTotal(purchaseId, supabase)
  } catch (err: any) {
    return redirect(`/purchasing/${purchaseId}?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath(`/purchasing/${purchaseId}`)
}

export async function removeItemFromPurchase(formData: FormData) {
  const purchaseId = formData.get('purchase_id') as string
  try {
    const { supabase } = await checkPermissions()
    const itemId = formData.get('item_id') as string
    const { error } = await supabase.from('purchase_items').delete().eq('id', itemId)
    if (error) throw error
    await calculatePurchaseTotal(purchaseId, supabase)
  } catch (err: any) {
    return redirect(`/purchasing/${purchaseId}?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath(`/purchasing/${purchaseId}`)
}

export async function completePurchase(formData: FormData) {
  const purchaseId = formData.get('purchase_id') as string
  try {
    const { supabase } = await checkPermissions()
    const { error } = await supabase.from('purchases').update({ status: 'Ordered' }).eq('id', purchaseId)
    if (error) throw error
  } catch (err: any) {
    return redirect(`/purchasing/${purchaseId}?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath('/purchasing'); redirect('/purchasing')
}

async function calculatePurchaseTotal(purchaseId: string, supabase: any) {
  const { data: items } = await supabase.from('purchase_items').select('total_cost').eq('purchase_id', purchaseId)
  const total = items?.reduce((sum: number, item: any) => sum + item.total_cost, 0) || 0
  await supabase.from('purchases').update({ total_amount: total }).eq('id', purchaseId)
}