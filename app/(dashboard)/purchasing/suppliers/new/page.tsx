import Link from 'next/link'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { createSupplier } from '../../actions'

export default async function NewSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/purchasing/suppliers"
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Supplier</h1>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-bold text-red-800">Action Failed</p>
              <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
            </div>
          </div>
        </div>
      )}

      <form action={createSupplier} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              name="name"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">TIN Number (Tax ID)</label>
            <input
              name="tin_number"
              placeholder="e.g. C2588563300"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Person</label>
              <input
                name="contact"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Default Currency</label>
              <select
                name="currency"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="MYR">MYR (Ringgit)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Full Address</label>
            <textarea
              name="address"
              rows={3}
              placeholder="123 Jalan Industrial, 50000 Kuala Lumpur..."
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
            Save Supplier
          </button>
        </div>

      </form>
    </div>
  )
}