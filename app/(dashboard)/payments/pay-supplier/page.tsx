import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { createSupplierPayment } from '../actions'

export default async function PaySupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Fetch Unpaid POs
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, reference_no, supplier_ref, total_amount, paid_amount, currency, suppliers(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments?tab=outgoing" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Pay Supplier (Issue Voucher)</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">{error}</div>}

      <form action={createSupplierPayment} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        {/* SELECT PO */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Purchase Order</label>
          <select 
            name="purchase_id" 
            required 
            className="mt-1 block w-full rounded-md border border-gray-300 p-3 bg-white"
          >
            <option value="">-- Choose PO to Pay --</option>
            {/* FIX: Added (p: any) to bypass strict check */}
            {purchases?.map((p: any) => {
              const balance = (p.total_amount || 0) - (p.paid_amount || 0)
              const isPaid = balance <= 0
              return (
                <option key={p.id} value={p.id} className={isPaid ? 'text-green-600' : 'text-red-600'}>
                  {p.reference_no} - {p.suppliers?.name} 
                  {isPaid ? ' (PAID)' : ` (Owe: ${p.currency} ${balance.toFixed(2)})`}
                </option>
              )
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
            <input name="amount" type="number" step="0.01" required className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input name="payment_date" type="date" defaultValue={today} required className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select name="method" className="mt-1 block w-full rounded-md border border-gray-300 p-2 bg-white">
              <option value="Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Ref / Cheque No</label>
            <input name="reference_no" placeholder="e.g. 123456" className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea name="notes" rows={2} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-600 text-white p-3 rounded-md font-bold hover:bg-red-500">
            <Save size={18} /> Issue Payment Voucher
          </button>
        </div>

      </form>
    </div>
  )
}