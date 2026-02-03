import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createSale } from '../actions'
import { SubmitButton } from './submit-button'
import { createClient } from '@/utils/supabase/server'

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const today = new Date().toISOString().split('T')[0]
  
  const supabase = await createClient()
  const { data: customers } = await supabase.from('customers').select('id, name, company_name').order('name')
  const { data: companies } = await supabase.from('companies').select('id, name').order('name')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sales" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Sale</h1>
      </div>

      <form action={createSale} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Sales Info</h2>
          
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-200">
             <strong>Auto-Numbering:</strong> Invoice No (e.g. <strong>INV2602...</strong>) is auto-generated.
          </div>

          {/* NEW COMPANY SELECTOR */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Issuing Company (Letterhead)</label>
            <select name="company_id" required className="mt-1 block w-full rounded-md border border-gray-300 p-3 bg-gray-50">
              {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sales Channel *</label>
              <select name="channel" required className="mt-1 block w-full rounded-md border border-gray-300 p-3 bg-white">
                <option value="Walk-in">Walk-in Customer</option>
                <option value="Shopee">Shopee</option>
                <option value="Lazada">Lazada</option>
                <option value="TikTok">TikTok Shop</option>
                <option value="Agent">Agent / Wholesale</option>
              </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700">Date</label>
               <input name="sale_date" type="date" defaultValue={today} required className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md space-y-4 border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Customer (Registered)</label>
              <select name="customer_id" className="mt-1 block w-full rounded-md border border-gray-300 p-3 bg-white">
                <option value="">-- Guest / Unknown --</option>
                {customers?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Manual Guest Name</label>
              <input name="customer_name" placeholder="e.g. Mr. Ali" className="mt-1 block w-full rounded-md border border-gray-300 p-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Customer PO / Reference (Optional)</label>
            <input
              name="customer_po"
              placeholder="e.g. CUST-PO-2024-001"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
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