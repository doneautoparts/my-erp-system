import Link from 'next/link'
import { Plus, CreditCard } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      sales (
        reference_no,
        customer_name,
        customers(name)
      )
    `)
    .order('payment_date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payment Receipts</h1>
        <Link
          href="/payments/new"
          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
        >
          <Plus size={16} />
          Receive Payment
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Ref</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount (RM)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments?.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.payment_date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {p.sales?.reference_no}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {p.sales?.customers?.name || p.sales?.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.method} <span className="text-xs text-gray-400">{p.reference_no}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-700">
                  {p.amount.toFixed(2)}
                </td>
              </tr>
            ))}
            {payments?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}