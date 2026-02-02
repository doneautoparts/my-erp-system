import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createCustomer } from '../actions'

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Customer</h1>
      </div>

      <form action={createCustomer} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select name="type" className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2">
              <option value="Personal">Personal / Walk-in</option>
              <option value="Company">Company / Workshop</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Name *</label>
            <input name="name" required className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input name="company_name" className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
        </div>

        {/* NEW TIN FIELD */}
        <div>
          <label className="block text-sm font-medium text-gray-700">TIN Number (For e-Invoice)</label>
          <input name="tin_number" className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2 font-mono text-sm" placeholder="e.g. IG1234567890" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Address</label>
          <textarea name="address" rows={3} className="form-input mt-1 block w-full rounded-md border border-gray-300 p-2" />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md font-bold hover:bg-blue-500">
          <Save className="inline mr-2" size={18} /> Save Customer
        </button>
      </form>
    </div>
  )
}