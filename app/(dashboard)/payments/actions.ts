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

// 1. CUSTOMER PAYMENT (IN)
export async function createPayment(formData: FormData) {
  try {
    const { supabase, user } = await checkPermissions()
    const saleId = formData.get('sale_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const paymentDate = formData.get('payment_date') as string
    const method = formData.get('method') as string
    const referenceNo = formData.get('reference_no') as string
    const notes = formData.get('notes') as string

    const { data: refData, error: refError } = await supabase.rpc('generate_doc_number', { prefix: 'RCT' })
    if (refError) throw refError
    const receiptNo = refData as string

    const { data: newPay, error } = await supabase.from('payments').insert({
      sale_id: saleId, receipt_no: receiptNo, amount, payment_date: paymentDate,
      method, reference_no: referenceNo, notes
    }).select('id').single()

    if (error) throw error

    // LOG
    await supabase.from('user_logs').insert({
        user_email: user.email, action: 'RECEIVE_PAYMENT', details: `Received ${amount} (RCT: ${receiptNo})`,
        resource_type: 'Payment', resource_id: newPay.id, severity: 'info'
    })

  } catch (err: any) {
    return redirect(`/payments/new?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath('/payments'); revalidatePath('/sales'); redirect('/payments')
}

// 2. SUPPLIER PAYMENT (OUT)
export async function createSupplierPayment(formData: FormData) {
  try {
    const { supabase, user } = await checkPermissions()
    const purchaseId = formData.get('purchase_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const paymentDate = formData.get('payment_date') as string
    const method = formData.get('method') as string
    const referenceNo = formData.get('reference_no') as string
    const notes = formData.get('notes') as string

    const { data: refData, error: refError } = await supabase.rpc('generate_doc_number', { prefix: 'PV' })
    if (refError) throw refError
    const voucherNo = refData as string

    const { data: newPay, error } = await supabase.from('supplier_payments').insert({
      purchase_id: purchaseId, voucher_no: voucherNo, amount, payment_date: paymentDate,
      method, reference_no: referenceNo, notes
    }).select('id').single()

    if (error) throw error

    // LOG
    await supabase.from('user_logs').insert({
        user_email: user.email, action: 'PAY_SUPPLIER', details: `Paid ${amount} (PV: ${voucherNo})`,
        resource_type: 'Payment', resource_id: newPay.id, severity: 'info'
    })

  } catch (err: any) {
    return redirect(`/payments/pay-supplier?error=${encodeURIComponent(err.message)}`)
  }
  revalidatePath('/payments'); revalidatePath('/purchasing'); redirect('/payments?tab=outgoing')
}