'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function checkPermissions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) throw new Error("No User")

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || 'user'
    
    if (role !== 'admin' && role !== 'manager') {
        throw new Error("Unauthorized: View Only.")
    }
    return { supabase, user }
}

export async function createGRNFromPO(purchaseId: string) {
  const { supabase, user } = await checkPermissions()

  const { data: po } = await supabase.from('purchases').select('*, purchase_items(*)').eq('id', purchaseId).single()
  if (!po) throw new Error("PO not found")

  const { data: grnNo, error: refError } = await supabase.rpc('generate_doc_number', { prefix: 'GRN' })
  if (refError) throw new Error(refError.message)

  const { data: newGrn, error: grnError } = await supabase
    .from('grn')
    .insert({
      grn_no: grnNo as string, 
      purchase_id: purchaseId,
      status: 'Draft',
      created_by: user?.id
    })
    .select('id')
    .single()

  if (grnError) throw new Error(grnError.message)

  const grnItems = po.purchase_items.map((item: any) => ({
    grn_id: newGrn.id,
    variant_id: item.variant_id,
    order_qty: item.quantity,
    received_qty: item.quantity, 
  }))

  const { error: itemsError } = await supabase.from('grn_items').insert(grnItems)
  if (itemsError) throw new Error(itemsError.message)

  // LOG
  await supabase.from('user_logs').insert({
    user_email: user.email, action: 'CREATE_GRN', details: `Created ${grnNo}`,
    resource_type: 'GRN', resource_id: newGrn.id, severity: 'info'
  })

  return newGrn.id
}

export async function updateGrnItem(formData: FormData) {
  const { supabase } = await checkPermissions()
  const itemId = formData.get('item_id') as string
  const grnId = formData.get('grn_id') as string
  const receivedQty = parseInt(formData.get('received_qty') as string)

  await supabase.from('grn_items').update({ received_qty: receivedQty }).eq('id', itemId)
  revalidatePath(`/inventory/grn/${grnId}`)
}

export async function confirmGRN(formData: FormData) {
  const grnId = formData.get('grn_id') as string
  try {
      const { supabase, user } = await checkPermissions()
      const { error } = await supabase.from('grn').update({ status: 'Completed' }).eq('id', grnId)
      if (error) throw error

      // LOG (Critical Action: Stock Update)
      await supabase.from('user_logs').insert({
        user_email: user.email, action: 'CONFIRM_GRN', details: `Confirmed GRN ${grnId} (Stock Updated)`,
        resource_type: 'GRN', resource_id: grnId, severity: 'critical'
      })

  } catch (err: any) {
      return redirect(`/inventory/grn/${grnId}?error=${encodeURIComponent(err.message)}`)
  }

  revalidatePath('/inventory')
  redirect(`/inventory/grn/${grnId}`)
}