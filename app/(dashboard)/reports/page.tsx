import { createClient } from '@/utils/supabase/server'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { ReportPrintButton } from './print-button'

export default async function ReportsPage() {
  const supabase = await createClient()

  // 1. Fetch Completed Sales (Revenue)
  const { data: sales } = await supabase
    .from('sales')
    .select('total_amount, sale_date')
    .eq('status', 'Completed')

  // 2. Fetch Completed Purchases (Expenses)
  const { data: purchases } = await supabase
    .from('purchases')
    .select('total_amount, currency, exchange_rate, purchase_date')
    .eq('status', 'Completed')

  // 3. Calculate Totals
  const totalRevenue = sales?.reduce((sum, record) => sum + (record.total_amount || 0), 0) || 0

  const totalExpenses = purchases?.reduce((sum, record) => {
    let amountInMYR = record.total_amount || 0
    if (record.currency === 'USD') {
      amountInMYR = amountInMYR * (record.exchange_rate || 1)
    }
    return sum + amountInMYR
  }, 0) || 0

  const netCashFlow = totalRevenue - totalExpenses

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Summary</h1>
          <p className="text-sm text-gray-500">Audit Overview (All Time)</p>
        </div>
        {/* The New Clickable Button */}
        <ReportPrintButton />
      </div>

      {/* Print-only Header (Visible only when printing) */}
      <div className="hidden print:block text-center mb-8 border-b border-black pb-4">
        <h1 className="text-2xl font-bold uppercase">Financial Audit Report</h1>
        <p className="text-sm">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
        
        {/* REVENUE CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border-black print:shadow-none">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600 print:hidden">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 print:text-black">Total Sales</p>
              <h3 className="text-2xl font-bold text-gray-900 print:text-black">MYR {totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* EXPENSE CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border-black print:shadow-none">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600 print:hidden">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 print:text-black">Total Purchases</p>
              <h3 className="text-2xl font-bold text-gray-900 print:text-black">MYR {totalExpenses.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* NET CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border-black print:shadow-none">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full print:hidden ${netCashFlow >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 print:text-black">Net Cash Flow</p>
              <h3 className={`text-2xl font-bold print:text-black ${netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                MYR {netCashFlow.toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* LHDN Ledger Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden print:shadow-none print:border-black">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 print:bg-white print:border-black">
          <h3 className="text-lg font-medium text-gray-900">Transaction Ledger</h3>
        </div>
        <div className="max-h-96 overflow-y-auto print:max-h-none print:overflow-visible">
          <table className="min-w-full divide-y divide-gray-200 print:divide-black">
            <thead className="bg-gray-50 sticky top-0 print:static print:bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase print:text-black">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase print:text-black">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase print:text-black">Amount (MYR)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 print:divide-black">
              {[
                ...(sales || []).map(s => ({ date: s.sale_date, type: 'Sale', amount: s.total_amount, isCredit: true })),
                ...(purchases || []).map(p => ({ 
                    date: p.purchase_date, 
                    type: `Purchase (${p.currency})`, 
                    amount: p.currency === 'USD' ? (p.total_amount * p.exchange_rate) : p.total_amount, 
                    isCredit: false 
                }))
              ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 print:hover:bg-white">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:text-black">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 print:text-black">
                    <span className={item.isCredit ? 'text-green-600 print:text-black' : 'text-red-600 print:text-black'}>{item.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-900 print:text-black">
                    {item.isCredit ? '+' : '-'} {item.amount?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}