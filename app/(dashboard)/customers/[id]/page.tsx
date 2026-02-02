import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { updateCustomer } from '../actions'
import { notFound } from 'next/navigation'

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: c } = await supabase.from('customers').select('*').eq('id', id).single()

  if (!c) return notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
      </div>

      <form action={updateCustomer} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        <input type="hidden" name="id" value={c.id} />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select name="type" defaultValue={c.type} className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2">
              <option value="Personal">Personal / Walk-in</option>
              <option value="Company">Company / Workshop</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Name *</label>
            <input name="name" required defaultValue={c.name} className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input name="company_name" defaultValue={c.company_name || ''} className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
        </div>

        {/* NEW TIN FIELD */}
        <div>
          <label className="block text-sm font-medium text-gray-700">TIN Number (For e-Invoice)</label>
          <input name="tin_number" defaultValue={c.tin_number || ''} className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2 font-mono text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" defaultValue={c.phone || ''} className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" defaultValue={c.email || ''} className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Address</label>
          <textarea name="address" rows={3} defaultValue={c.address || ''} className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md font-bold hover:bg-blue-500">
          <Save className="inline mr-2" size={18} /> Update Customer
        </button>
      </form>
    </div>
  )
}