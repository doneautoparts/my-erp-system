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

// 1. CUSTOMER PAYMENT (IN)
export async function createPayment(formData: FormData) {
  try {
    const { supabase } = await checkPermissions()
    const saleId = formData.get('sale_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const paymentDate = formData.get('payment_date') as string
    const method = formData.get('method') as string
    const referenceNo = formData.get('reference_no') as string
    const notes = formData.get('notes') as string

    const { data: refData, error: refError } = await supabase.rpc('generate_doc_number', { prefix: 'RCT' })
    if (refError) throw refError
    const receiptNo = refData as string

    const { error } = await supabase.from('payments').insert({
      sale_id: saleId, receipt_no: receiptNo, amount, payment_date: paymentDate,
      method, reference_no: referenceNo, notes
    })
    if (error) throw error

  } catch (err: any) {
    return redirect(`/payments/new?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath('/payments'); revalidatePath('/sales'); redirect('/payments')
}

// 2. SUPPLIER PAYMENT (OUT)
export async function createSupplierPayment(formData: FormData) {
  try {
    const { supabase } = await checkPermissions()
    const purchaseId = formData.get('purchase_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const paymentDate = formData.get('payment_date') as string
    const method = formData.get('method') as string
    const referenceNo = formData.get('reference_no') as string
    const notes = formData.get('notes') as string

    const { data: refData, error: refError } = await supabase.rpc('generate_doc_number', { prefix: 'PV' })
    if (refError) throw refError
    const voucherNo = refData as string

    const { error } = await supabase.from('supplier_payments').insert({
      purchase_id: purchaseId, voucher_no: voucherNo, amount, payment_date: paymentDate,
      method, reference_no: referenceNo, notes
    })
    if (error) throw error

  } catch (err: any) {
    return redirect(`/payments/pay-supplier?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath('/payments'); revalidatePath('/purchasing'); redirect('/payments?tab=outgoing')
}