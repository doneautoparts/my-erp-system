'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 1. CREATE NEW SALE
export async function createSale(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const customerId = formData.get('customer_id') as string
  const customerName = formData.get('customer_name') as string
  const channel = formData.get('channel') as string
  const customerPO = formData.get('customer_po') as string // NEW
  const saleDate = formData.get('sale_date') as string

  // 1. Generate Auto-Number (INV2602xxxxx)
  const { data: refData, error: refError } = await supabase
    .rpc('generate_doc_number', { prefix: 'INV' })

  if (refError) return redirect(`/sales/new?error=Number Gen Error: ${encodeURIComponent(refError.message)}`)
  const docNumber = refData as string

  // 2. Create Sale Record
  const { data: newSale, error } = await supabase
    .from('sales')
    .insert({
      customer_id: customerId || null,
      customer_name: customerName,
      channel: channel,
      reference_no: docNumber, 
      customer_po: customerPO, 
      sale_date: saleDate,
      status: 'Pending',
      created_by: user?.id
    })
    .select('id')
    .single()

  if (error) {
    return redirect(`/sales/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/sales')
  redirect(`/sales/${newSale.id}`)
}

// 2. ADD ITEM TO SALE
export async function addItemToSale(formData: FormData) {
  const supabase = await createClient()
  const saleId = formData.get('sale_id') as string
  const variantId = formData.get('variant_id') as string
  const quantity = parseInt(formData.get('quantity') as string)
  const unitPrice = parseFloat(formData.get('unit_price') as string)

  const { data: variant } = await supabase.from('variants').select('stock_quantity, name').eq('id', variantId).single()

  if (!variant || variant.stock_quantity < quantity) {
    return redirect(`/sales/${saleId}?error=Not enough stock! Available: ${variant?.stock_quantity || 0}`)
  }

  const subtotal = quantity * unitPrice

  const { error } = await supabase.from('sale_items').insert({
      sale_id: saleId, variant_id: variantId, quantity, unit_price: unitPrice, subtotal: subtotal
    })

  if (error) return redirect(`/sales/${saleId}?error=${encodeURIComponent(error.message)}`)

  await calculateSaleTotal(saleId, supabase)
  revalidatePath(`/sales/${saleId}`)
}

// 3. REMOVE ITEM
export async function removeItemFromSale(formData: FormData) {
  const supabase = await createClient()
  const itemId = formData.get('item_id') as string
  const saleId = formData.get('sale_id') as string

  const { error } = await supabase.from('sale_items').delete().eq('id', itemId)

  if (error) return redirect(`/sales/${saleId}?error=${encodeURIComponent(error.message)}`)

  await calculateSaleTotal(saleId, supabase)
  revalidatePath(`/sales/${saleId}`)
}

// 4. COMPLETE SALE
export async function completeSale(formData: FormData) {
  const supabase = await createClient()
  const saleId = formData.get('sale_id') as string

  const { error } = await supabase.from('sales').update({ status: 'Completed' }).eq('id', saleId)

  if (error) return redirect(`/sales/${saleId}?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/sales')
  redirect('/sales')
}

// Helper
async function calculateSaleTotal(saleId: string, supabase: any) {
  const { data: items } = await supabase.from('sale_items').select('subtotal').eq('sale_id', saleId)
  const total = items?.reduce((sum: number, item: any) => sum + item.subtotal, 0) || 0
  await supabase.from('sales').update({ total_amount: total }).eq('id', saleId)
}