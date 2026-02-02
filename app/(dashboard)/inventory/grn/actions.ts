'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGRNFromPO(purchaseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Fetch PO details
  const { data: po } = await supabase
    .from('purchases')
    .select('*, purchase_items(*)')
    .eq('id', purchaseId)
    .single()

  if (!po) throw new Error("PO not found")

  // 2. Generate GRN Number
  const grnNo = `GRN-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`

  // 3. Create GRN Header
  const { data: newGrn, error: grnError } = await supabase
    .from('grn')
    .insert({
      grn_no: grnNo,
      purchase_id: purchaseId,
      status: 'Draft',
      created_by: user?.id
    })
    .select('id')
    .single()

  if (grnError) throw new Error(grnError.message)

  // 4. Copy Items from PO to GRN
  const grnItems = po.purchase_items.map((item: any) => ({
    grn_id: newGrn.id,
    variant_id: item.variant_id,
    order_qty: item.quantity,
    received_qty: item.quantity, // Default to full receipt
  }))

  const { error: itemsError } = await supabase.from('grn_items').insert(grnItems)
  if (itemsError) throw new Error(itemsError.message)

  return newGrn.id
}

export async function updateGrnItem(formData: FormData) {
  const supabase = await createClient()
  const itemId = formData.get('item_id') as string
  const grnId = formData.get('grn_id') as string
  const receivedQty = parseInt(formData.get('received_qty') as string)

  await supabase
    .from('grn_items')
    .update({ received_qty: receivedQty })
    .eq('id', itemId)

  revalidatePath(`/inventory/grn/${grnId}`)
}

export async function confirmGRN(formData: FormData) {
  const supabase = await createClient()
  const grnId = formData.get('grn_id') as string

  const { error } = await supabase
    .from('grn')
    .update({ status: 'Completed' })
    .eq('id', grnId)

  if (error) {
    return redirect(`/inventory/grn/${grnId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/inventory')
  redirect(`/inventory/grn/${grnId}`)
}