import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function PurchasingPage() {
  const supabase = await createClient()

  // Fetch purchases with supplier names
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      *,
      suppliers (name, currency)
    `)
    .order('purchase_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <Link
          href="/purchasing/new"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus size={16} />
          New Purchase Order
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="relative px-6 py-3"><span className="sr-only">View</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchases?.map((po) => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {po.purchase_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {po.reference_no}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {po.suppliers?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    po.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {po.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {po.suppliers?.currency} {po.total_amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/purchasing/${po.id}`} className="text-blue-600 hover:text-blue-900">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {purchases?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No purchase orders found. Click "New Purchase Order" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}