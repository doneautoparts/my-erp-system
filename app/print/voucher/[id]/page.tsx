import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PrintAction from '../../print-button'

export default async function PrintPaymentVoucher({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch Voucher + PO + Supplier + Company
  const { data: pv } = await supabase
    .from('supplier_payments')
    .select(`
      *,
      purchases (
        reference_no,
        supplier_ref,
        suppliers (name, address),
        companies (*)
      )
    `)
    .eq('id', id)
    .single()

  if (!pv) return notFound()

  const myCompany = pv.purchases?.companies || { name: "MY COMPANY", address: "" }
  const supplier = pv.purchases?.suppliers

  return (
    <div className="max-w-3xl mx-auto border border-gray-200 p-8 print:border-0 print:p-0 font-sans">
      <PrintAction />

      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide">Payment Voucher</h1>
          <div className="mt-2 text-sm text-gray-500 whitespace-pre-line">
             <p className="font-bold text-gray-900">{myCompany.name}</p>
             {myCompany.address}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-mono font-bold text-gray-700">{pv.voucher_no || 'PV-PENDING'}</h2>
          <p className="text-sm text-gray-500 mt-1">Date: {pv.payment_date}</p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-gray-50 p-8 rounded-md border border-gray-100">
        <div className="grid grid-cols-1 gap-6 text-sm">
            
            <div className="flex justify-between border-b border-gray-300 pb-2">
                <span className="font-bold text-gray-500 uppercase">Paid To (Supplier)</span>
                <div className="text-right">
                    <span className="block font-bold text-lg">{supplier?.name}</span>
                    <span className="block text-gray-500 whitespace-pre-line">{supplier?.address}</span>
                </div>
            </div>

            <div className="flex justify-between border-b border-gray-300 pb-2">
                <span className="font-bold text-gray-500 uppercase">Amount Paid</span>
                <span className="font-bold text-xl">
                    {pv.purchases?.currency === 'USD' ? 'USD' : 'RM'} {pv.amount.toFixed(2)}
                </span>
            </div>

            <div className="flex justify-between border-b border-gray-300 pb-2">
                <span className="font-bold text-gray-500 uppercase">Payment Details</span>
                <span className="uppercase">{pv.method} {pv.reference_no ? `(Ref: ${pv.reference_no})` : ''}</span>
            </div>

            <div className="flex justify-between pb-2">
                <span className="font-bold text-gray-500 uppercase">For Invoice/PO</span>
                <div className="text-right">
                    <span className="block font-mono">PO: {pv.purchases?.reference_no}</span>
                    {pv.purchases?.supplier_ref && (
                        <span className="block text-gray-500 text-xs">Supp Inv: {pv.purchases?.supplier_ref}</span>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-16 grid grid-cols-2 gap-12">
        <div>
            <p className="text-xs uppercase font-bold text-gray-400 mb-12">Prepared By:</p>
            <div className="border-t border-black w-full"></div>
            <p className="text-xs mt-1">Accounts Dept</p>
        </div>
        <div>
            <p className="text-xs uppercase font-bold text-gray-400 mb-12">Approved By:</p>
            <div className="border-t border-black w-full"></div>
            <p className="text-xs mt-1">Director</p>
        </div>
      </div>
    </div>
  )
}