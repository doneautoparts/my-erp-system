import Link from 'next/link'
import { Printer } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function DocumentCenter({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const activeView = view || 'po'
  const supabase = await createClient()

  // FIX: Explicitly tell TypeScript this array can hold any type of object
  let docs: any[] = []

  if (activeView === 'po') {
    const { data } = await supabase
      .from('purchases')
      .select('id, reference_no, purchase_date, total_amount, currency, status, suppliers(name)')
      .order('created_at', { ascending: false })
    docs = data || []
  } else if (activeView === 'grn') {
    const { data } = await supabase
      .from('grn')
      .select('id, grn_no, received_date, status, purchases(suppliers(name))')
      .order('created_at', { ascending: false })
    docs = data || []
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Document Center</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link href="/documents?view=po" className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeView === 'po' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Purchase Orders
          </Link>
          <Link href="/documents?view=grn" className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeView === 'grn' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Goods Received Notes (GRN)
          </Link>
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {docs.map((doc: any) => (
              <tr key={doc.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                  {activeView === 'po' ? doc.reference_no : doc.grn_no}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {activeView === 'po' ? doc.purchase_date : doc.received_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activeView === 'po' ? doc.suppliers?.name : doc.purchases?.suppliers?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link 
                    href={activeView === 'po' ? `/print/purchase/${doc.id}` : `/print/grn/${doc.id}`} 
                    target="_blank"
                    className="text-gray-400 hover:text-gray-900"
                  >
                    <Printer size={18} />
                  </Link>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}