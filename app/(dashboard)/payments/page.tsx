import Link from 'next/link'
import { Plus, ArrowUpRight, ArrowDownLeft, Printer } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab || 'incoming' // 'incoming' or 'outgoing'
  const supabase = await createClient()

  let data = []

  if (activeTab === 'incoming') {
    // Fetch Customer Payments
    const { data: res } = await supabase
      .from('payments')
      .select(`*, sales(reference_no, customer_name, customers(name))`)
      .order('payment_date', { ascending: false })
    data = res || []
  } else {
    // Fetch Supplier Payments (Vouchers)
    const { data: res } = await supabase
      .from('supplier_payments')
      .select(`*, purchases(reference_no, suppliers(name, currency))`)
      .order('payment_date', { ascending: false })
    data = res || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Financial Records</h1>
        
        {activeTab === 'incoming' ? (
          <Link href="/payments/new" className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
            <Plus size={16} /> Receive Payment
          </Link>
        ) : (
          <Link href="/payments/pay-supplier" className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
            <Plus size={16} /> Pay Supplier
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link href="/payments?tab=incoming" className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'incoming' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <ArrowDownLeft size={16} /> Incoming (Receipts)
          </Link>
          <Link href="/payments?tab=outgoing" className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'outgoing' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <ArrowUpRight size={16} /> Outgoing (Vouchers)
          </Link>
        </nav>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doc No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Print</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {activeTab === 'incoming' ? item.receipt_no : item.voucher_no}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.payment_date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {activeTab === 'incoming' ? item.sales?.reference_no : item.purchases?.reference_no}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activeTab === 'incoming' 
                    ? (item.sales?.customers?.name || item.sales?.customer_name) 
                    : item.purchases?.suppliers?.name}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${activeTab === 'incoming' ? 'text-green-700' : 'text-red-700'}`}>
                  {activeTab === 'outgoing' && item.purchases?.suppliers?.currency === 'USD' ? 'USD ' : 'RM '}
                  {item.amount.toFixed(2)}
                </td>
                {/* THE PRINTER ICON YOU REQUESTED */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link 
                    href={activeTab === 'incoming' ? `/print/payment/${item.id}` : `/print/voucher/${item.id}`} 
                    target="_blank"
                    className="text-gray-400 hover:text-gray-900"
                  >
                    <Printer size={18} />
                  </Link>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}