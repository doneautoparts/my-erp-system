import Link from 'next/link'
import { Plus, Building2, Pencil } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function SuppliersPage() {
  const supabase = await createClient()

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <Link
          href="/purchasing/suppliers/new"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus size={16} />
          Add Supplier
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers?.map((supplier) => (
          <div key={supplier.id} className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400">
            <div className="flex-shrink-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-500">
                <Building2 className="h-6 w-6 text-white" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="focus:outline-none">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                <p className="truncate text-sm text-gray-500">{supplier.contact_person}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                 <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${supplier.currency === 'USD' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {supplier.currency}
                </span>
                {/* Edit Button (Pencil) */}
                <Link 
                  href={`/purchasing/suppliers/${supplier.id}`}
                  className="z-10 text-gray-400 hover:text-blue-600"
                  title="Edit Supplier"
                >
                  <Pencil size={16} />
                </Link>
            </div>
          </div>
        ))}
        
        {suppliers?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No suppliers found. Add one to start purchasing.
          </div>
        )}
      </div>
    </div>
  )
}