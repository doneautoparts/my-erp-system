'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPayment(formData: FormData) {
  const supabase = await createClient()

  const saleId = formData.get('sale_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const paymentDate = formData.get('payment_date') as string
  const method = formData.get('method') as string
  const referenceNo = formData.get('reference_no') as string
  const notes = formData.get('notes') as string

  // 1. Generate Auto-Number (RCT2602xxxxx)
  const { data: refData, error: refError } = await supabase
    .rpc('generate_doc_number', { prefix: 'RCT' })

  if (refError) return redirect(`/payments/new?error=Number Gen Error: ${encodeURIComponent(refError.message)}`)
  const receiptNo = refData as string

  // 2. Insert Payment
  const { error } = await supabase
    .from('payments')
    .insert({
      sale_id: saleId,
      receipt_no: receiptNo, // AUTO GENERATED
      amount,
      payment_date: paymentDate,
      method,
      reference_no: referenceNo, // BANK REF
      notes
    })

  if (error) {
    return redirect(`/payments/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/payments')
  revalidatePath('/sales')
  redirect('/payments')
}