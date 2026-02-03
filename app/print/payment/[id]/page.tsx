import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PrintAction from '../../print-button'

export default async function PrintPaymentReceipt({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select(`
      *,
      sales (
        reference_no,
        total_amount,
        paid_amount,
        customers (name, address, company_name)
      )
    `)
    .eq('id', id)
    .single()

  if (!payment) return notFound()

  const { data: myCompany } = await supabase.from('companies').select('*').limit(1).single()

  const customerName = payment.sales?.customers?.name || "Walk-in Customer"
  const customerCompany = payment.sales?.customers?.company_name || ""

  return (
    <div className="max-w-3xl mx-auto border border-gray-200 p-8 print:border-0 print:p-0 font-sans">
      <PrintAction />

      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide">Official Receipt</h1>
          <div className="mt-2 text-sm text-gray-500 whitespace-pre-line">
             <p className="font-bold text-gray-900">{myCompany?.name || "MY COMPANY"}</p>
             {myCompany?.address}
             <p>Tel: {myCompany?.phone}</p>
             {myCompany?.tin_number && <p className="font-mono text-xs mt-1">TIN: {myCompany.tin_number}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-mono font-bold text-gray-700">{payment.receipt_no || 'RCT-PENDING'}</h2>
          <p className="text-sm text-gray-500 mt-1">Date: {payment.payment_date}</p>
        </div>
      </div>

      {/* Receipt Body */}
      <div className="bg-gray-50 p-8 rounded-md border border-gray-100 print:bg-white print:border-2 print:border-gray-200">
        
        <div className="grid grid-cols-1 gap-6 text-sm">
            <div className="flex justify-between border-b border-gray-300 pb-2">
                <span className="font-bold text-gray-500 uppercase">Received From</span>
                <div className="text-right">
                    <span className="block font-bold text-lg">{customerName}</span>
                    <span className="block text-gray-500">{customerCompany}</span>
                </div>
            </div>

            <div className="flex justify-between border-b border-gray-300 pb-2">
                <span className="font-bold text-gray-500 uppercase">Amount Received</span>
                <span className="font-bold text-xl">MYR {payment.amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between border-b border-gray-300 pb-2">
                <span className="font-bold text-gray-500 uppercase">Payment Method</span>
                <span className="uppercase">{payment.method} {payment.reference_no ? `(Ref: ${payment.reference_no})` : ''}</span>
            </div>

            <div className="flex justify-between pb-2">
                <span className="font-bold text-gray-500 uppercase">Payment For</span>
                <span className="font-mono">Invoice #{payment.sales?.reference_no}</span>
            </div>
        </div>

        {payment.notes && (
            <div className="mt-6 pt-4 border-t border-dashed border-gray-400">
                <p className="text-xs text-gray-500 uppercase font-bold">Notes</p>
                <p className="text-sm italic">{payment.notes}</p>
            </div>
        )}

      </div>

      {/* Signature Section */}
      <div className="mt-16 grid grid-cols-2 gap-8">
        <div></div>
        <div className="text-center">
            <div className="border-t border-black w-full mb-2"></div>
            <p className="text-xs uppercase font-bold text-gray-400">Authorized Signature</p>
            <p className="text-xs text-gray-400">{myCompany?.name}</p>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-gray-400">
        <p>This receipt is computer generated and valid without a seal.</p>
      </div>
    </div>
  )
}