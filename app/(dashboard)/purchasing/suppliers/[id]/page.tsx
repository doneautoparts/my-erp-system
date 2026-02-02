import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { updateSupplier } from '../../actions'
import { notFound } from 'next/navigation'

export default async function EditSupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  // Fetch Supplier
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (!supplier) {
    return notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/purchasing/suppliers"
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Supplier</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <form action={updateSupplier} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        <input type="hidden" name="id" value={supplier.id} />

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              name="name"
              required
              defaultValue={supplier.name}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* NEW TIN FIELD */}
          <div>
            <label className="block text-sm font-medium text-gray-700">TIN Number (Tax ID)</label>
            <input
              name="tin_number"
              defaultValue={supplier.tin_number || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Person</label>
              <input
                name="contact"
                defaultValue={supplier.contact_person || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Default Currency</label>
              <select
                name="currency"
                defaultValue={supplier.currency}
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
                defaultValue={supplier.phone || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={supplier.email || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Full Address</label>
            <textarea
              name="address"
              rows={3}
              defaultValue={supplier.address || ''}
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
            Update Supplier
          </button>
        </div>

      </form>
    </div>
  )
}