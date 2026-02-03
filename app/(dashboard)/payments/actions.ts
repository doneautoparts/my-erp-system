'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- CUSTOMER PAYMENT (MONEY IN) ---
export async function createPayment(formData: FormData) {
  const supabase = await createClient()

  const saleId = formData.get('sale_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const paymentDate = formData.get('payment_date') as string
  const method = formData.get('method') as string
  const referenceNo = formData.get('reference_no') as string
  const notes = formData.get('notes') as string

  // Generate Receipt No (RCT)
  const { data: refData, error: refError } = await supabase
    .rpc('generate_doc_number', { prefix: 'RCT' })

  if (refError) return redirect(`/payments/new?error=${encodeURIComponent(refError.message)}`)
  const receiptNo = refData as string

  const { error } = await supabase
    .from('payments')
    .insert({
      sale_id: saleId,
      receipt_no: receiptNo,
      amount,
      payment_date: paymentDate,
      method,
      reference_no: referenceNo,
      notes
    })

  if (error) return redirect(`/payments/new?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/payments')
  revalidatePath('/sales')
  redirect('/payments')
}

// --- SUPPLIER PAYMENT (MONEY OUT) ---
export async function createSupplierPayment(formData: FormData) {
  const supabase = await createClient()

  const purchaseId = formData.get('purchase_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const paymentDate = formData.get('payment_date') as string
  const method = formData.get('method') as string
  const referenceNo = formData.get('reference_no') as string
  const notes = formData.get('notes') as string

  // Generate Voucher No (PV)
  const { data: refData, error: refError } = await supabase
    .rpc('generate_doc_number', { prefix: 'PV' })

  if (refError) return redirect(`/payments/pay-supplier?error=${encodeURIComponent(refError.message)}`)
  const voucherNo = refData as string

  const { error } = await supabase
    .from('supplier_payments')
    .insert({
      purchase_id: purchaseId,
      voucher_no: voucherNo,
      amount,
      payment_date: paymentDate,
      method,
      reference_no: referenceNo,
      notes
    })

  if (error) return redirect(`/payments/pay-supplier?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/payments')
  revalidatePath('/purchasing')
  redirect('/payments?tab=outgoing')
}