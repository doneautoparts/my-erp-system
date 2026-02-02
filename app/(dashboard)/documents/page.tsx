import Link from 'next/link'
import { Printer } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function DocumentCenter({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const activeView = view || 'sale' // Changed default to Sales
  const supabase = await createClient()

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
  } else if (activeView === 'sale') {
    const { data } = await supabase
      .from('sales')
      .select('id, reference_no, sale_date, total_amount, paid_amount, status, customer_name, customers(name)')
      .order('created_at', { ascending: false })
    docs = data || []
  } else if (activeView === 'payment') {
    const { data } = await supabase
      .from('payments')
      .select('id, payment_date, amount, method, sales(reference_no, customers(name), customer_name)')
      .order('created_at', { ascending: false })
    docs = data || []
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Document Center</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
          <Link href="/documents?view=sale" className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeView === 'sale' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Sales Invoices
          </Link>
          <Link href="/documents?view=payment" className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeView === 'payment' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Payment Receipts
          </Link>
          <Link href="/documents?view=po" className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeView === 'po' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Purchase Orders
          </Link>
          <Link href="/documents?view=grn" className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeView === 'grn' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            GRN
          </Link>
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {docs.map((doc: any) => {
              let docNo = ''
              let date = ''
              let name = ''
              let status = ''
              let link = ''

              if (activeView === 'po') {
                docNo = doc.reference_no
                date = doc.purchase_date
                name = doc.suppliers?.name
                status = `${doc.currency} ${doc.total_amount}`
                link = `/print/purchase/${doc.id}`
              } else if (activeView === 'grn') {
                docNo = doc.grn_no
                date = doc.received_date
                name = doc.purchases?.suppliers?.name
                status = doc.status
                link = `/print/grn/${doc.id}`
              } else if (activeView === 'sale') {
                docNo = doc.reference_no
                date = doc.sale_date
                name = doc.customers?.name || doc.customer_name
                const balance = (doc.total_amount || 0) - (doc.paid_amount || 0)
                status = balance <= 0 ? 'PAID' : `Owe: ${balance.toFixed(2)}`
                link = `/print/sales/${doc.id}`
              } else if (activeView === 'payment') {
                docNo = 'PAYMENT'
                date = doc.payment_date
                name = doc.sales?.customers?.name || doc.sales?.customer_name
                status = `RM ${doc.amount} (${doc.method})`
                // No print link for individual payment receipt yet, can link to invoice
                link = `/print/sales/${doc.sales?.id}` 
              }

              return (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{docNo || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-mono">{status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={link} target="_blank" className="text-gray-400 hover:text-gray-900">
                      <Printer size={18} />
                    </Link>
                  </td>
                </tr>
              )
            })}
            {docs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No documents found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}