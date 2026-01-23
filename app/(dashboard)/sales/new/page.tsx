import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createSale } from '../actions'

export default function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/sales"
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Sale</h1>
      </div>

      <form action={createSale} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Sales Info</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Sales Channel *</label>
            <select
              name="channel"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="Walk-in">Walk-in Customer</option>
              <option value="Shopee">Shopee</option>
              <option value="Lazada">Lazada</option>
              <option value="TikTok">TikTok Shop</option>
              <option value="Agent">Agent / Wholesale</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name (Optional)</label>
              <input
                name="customer_name"
                placeholder="e.g. Mr. Ali"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ref No (Order ID)</label>
              <input
                name="reference_no"
                placeholder="e.g. 230101ABC"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Date</label>
             <input
                name="sale_date"
                type="date"
                defaultValue={today}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Save size={18} />
            Create & Add Items
          </button>
        </div>

      </form>
    </div>
  )
}