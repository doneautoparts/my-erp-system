import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { createPayment } from '../actions'

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, sale_id?: string }>
}) {
  const { error, sale_id } = await searchParams
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Fetch Unpaid/Partial Sales
  const { data: sales } = await supabase
    .from('sales')
    .select('id, reference_no, customer_name, total_amount, paid_amount, customers(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">{error}</div>}

      <form action={createPayment} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        {/* SELECT INVOICE */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Invoice / Sale</label>
          <select 
            name="sale_id" 
            required 
            defaultValue={sale_id || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 p-3 bg-white"
          >
            <option value="">-- Choose Invoice --</option>
            {/* FIX: Added (s: any) to bypass TypeScript strict array/object check */}
            {sales?.map((s: any) => {
              const balance = (s.total_amount || 0) - (s.paid_amount || 0)
              const isPaid = balance <= 0
              
              // Handle potential array vs object structure for customers
              const custName = Array.isArray(s.customers) 
                ? s.customers[0]?.name 
                : s.customers?.name

              return (
                <option key={s.id} value={s.id} className={isPaid ? 'text-green-600' : 'text-red-600'}>
                  {s.reference_no || 'Ref ???'} - {custName || s.customer_name} 
                  {isPaid ? ' (PAID)' : ` (Owe: RM ${balance.toFixed(2)})`}
                </option>
              )
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Amount (RM)</label>
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
              <option value="Cash">Cash</option>
              <option value="Transfer">Bank Transfer</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ref No (Bank/Cheque)</label>
            <input name="reference_no" placeholder="e.g. MBB-123456" className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea name="notes" rows={2} className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-green-600 text-white p-3 rounded-md font-bold hover:bg-green-500">
            <Save size={18} /> Save Payment
          </button>
        </div>

      </form>
    </div>
  )
}