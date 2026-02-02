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

  // Insert Payment
  const { error } = await supabase
    .from('payments')
    .insert({
      sale_id: saleId,
      amount,
      payment_date: paymentDate,
      method,
      reference_no: referenceNo,
      notes
    })

  if (error) {
    return redirect(`/payments/new?error=${encodeURIComponent(error.message)}`)
  }

  // Check if fully paid (Optional logic to update status to 'Completed' if not already)
  // For now, we rely on the trigger to update 'paid_amount'

  revalidatePath('/payments')
  revalidatePath('/sales')
  redirect('/payments')
}