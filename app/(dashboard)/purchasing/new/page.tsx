import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { createPurchase } from '../actions'
import { SubmitButton } from './submit-button'

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  // Fetch supplierss
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, currency')
    .order('name')

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchasing" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <form action={createPurchase} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Order Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Supplier</label>
            <select
              name="supplier_id"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers?.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reference No. (Invoice)</label>
              <input
                name="reference_no"
                placeholder="e.g. INV-2024-001"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                name="purchase_date"
                type="date"
                defaultValue={today}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Exchange Rate (For USD)</label>
             <p className="text-xs text-gray-500 mb-1">If paying in RM, leave as 1.0. If USD, enter rate (e.g. 4.50)</p>
             <input
                name="exchange_rate"
                type="number"
                step="0.0001"
                defaultValue="1.0000"
                className="block w-32 rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
          </div>
        </div>

        <div className="pt-4">
          <SubmitButton />
        </div>

      </form>
    </div>
  )
}
