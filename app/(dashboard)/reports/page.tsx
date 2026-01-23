import { createClient } from '@/utils/supabase/server'
import { Printer, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function ReportsPage() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  // 1. Fetch Completed Sales (Revenue)
  const { data: sales } = await supabase
    .from('sales')
    .select('total_amount, sale_date')
    .eq('status', 'Completed')
    // Filter for current year could be added here, but for now we show All Time
    // .gte('sale_date', `${currentYear}-01-01`)
    // .lte('sale_date', `${currentYear}-12-31`)

  // 2. Fetch Completed Purchases (Expenses)
  const { data: purchases } = await supabase
    .from('purchases')
    .select('total_amount, currency, exchange_rate, purchase_date')
    .eq('status', 'Completed')

  // 3. Calculate Totals (Logic)
  
  // Total Sales (MYR)
  const totalRevenue = sales?.reduce((sum, record) => sum + (record.total_amount || 0), 0) || 0

  // Total Purchases (Convert everything to MYR)
  const totalExpenses = purchases?.reduce((sum, record) => {
    let amountInMYR = record.total_amount || 0
    
    // If USD, multiply by the exchange rate recorded at time of purchase
    if (record.currency === 'USD') {
      amountInMYR = amountInMYR * (record.exchange_rate || 1)
    }
    
    return sum + amountInMYR
  }, 0) || 0

  const netCashFlow = totalRevenue - totalExpenses

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Summary</h1>
          <p className="text-sm text-gray-500">Audit Overview (All Time)</p>
        </div>
        <button 
          // Simple print trigger for now
          // In a real app, we might link to a dedicated PDF page like in Step 6
          className="print:hidden flex items-center gap-2 rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          <Printer size={16} />
          <span>Print Summary</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* REVENUE CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales (Revenue)</p>
              <h3 className="text-2xl font-bold text-gray-900">MYR {totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* EXPENSE CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Purchases (Cost)</p>
              <h3 className="text-2xl font-bold text-gray-900">MYR {totalExpenses.toFixed(2)}</h3>
              <p className="text-xs text-gray-400 mt-1">Includes converted USD costs</p>
            </div>
          </div>
        </div>

        {/* NET CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${netCashFlow >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Net Cash Flow</p>
              <h3 className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                MYR {netCashFlow.toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* LHDN Quick Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Transaction Ledger</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount (MYR)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Combine Sales and Purchases for a ledger view */}
              {/* Note: In a real heavy app, we would do this sort in database. For SME, JS sort is fine. */}
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
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className={item.isCredit ? 'text-green-600' : 'text-red-600'}>{item.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-900">
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