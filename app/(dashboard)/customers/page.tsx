import Link from 'next/link'
import { Plus, Pencil, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function CustomersPage() {
  const supabase = await createClient()
  
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link 
          href="/customers/new" 
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus size={16} /> Add Customer
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {customers?.map((c) => (
          <div key={c.id} className="relative flex flex-col space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-blue-400 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  {c.company_name && <p className="text-xs text-gray-500">{c.company_name}</p>}
                </div>
              </div>
              <Link href={`/customers/${c.id}`} className="text-gray-400 hover:text-blue-600">
                <Pencil size={16} />
              </Link>
            </div>
            
            <div className="pt-2 text-sm text-gray-600 space-y-1">
              <p>Type: <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">{c.type}</span></p>
              {c.phone && <p>📞 {c.phone}</p>}
              {c.address && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.address}</p>}
            </div>
          </div>
        ))}
        {customers?.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                No customers found. Add one to get started.
            </div>
        )}
      </div>
    </div>
  )
}