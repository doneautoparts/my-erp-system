import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { createPurchase } from '../actions'
import { SubmitButton } from './submit-button'

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // FIX: Properly await searchParams
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: suppliers } = await supabase.from('suppliers').select('id, name, currency').order('name')
  const { data: companies } = await supabase.from('companies').select('id, name').order('name')
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchasing" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
      </div>

      {/* ERROR DISPLAY BOX */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-bold text-red-800">Action Failed</p>
              <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
            </div>
          </div>
        </div>
      )}

      <form action={createPurchase} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Order Details</h2>
          
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-200">
             <strong>Auto-Numbering:</strong> System will generate PO Number (e.g. POT2602...) automatically.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Issuing Company</label>
            <select name="company_id" required className="mt-1 block w-full rounded-md border border-gray-300 p-3 bg-gray-50">
              {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Select Supplier</label>
            <select name="supplier_id" required className="mt-1 block w-full rounded-md border border-gray-300 p-3 bg-white">
              <option value="">-- Choose Supplier --</option>
              {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.currency})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier Quotation / Invoice Ref (Optional)</label>
              <input
                name="supplier_ref"
                placeholder="e.g. QUO-998877"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input name="purchase_date" type="date" defaultValue={today} required className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700">Exchange Rate</label>
               <input name="exchange_rate" type="number" step="0.0001" defaultValue="1.0000" className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <SubmitButton />
        </div>

      </form>
    </div>
  )
}