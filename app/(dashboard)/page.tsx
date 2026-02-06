import { createClient } from '@/utils/supabase/server'
import { 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  ShoppingCart, 
  ArrowRight, 
  Plus, 
  Package 
} from 'lucide-react'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // --- 1. FETCH DATA PARALLEL (Fast Loading) ---
  
  // A. Sales Today
  const { data: salesToday } = await supabase
    .from('sales')
    .select('total_amount')
    .eq('sale_date', today)

  // B. Receivables (Money Customers Owe You)
  // Logic: Sum of (total - paid) where total > paid
  const { data: unpaidSales } = await supabase
    .from('sales')
    .select('total_amount, paid_amount')
    .lt('paid_amount', supabase.rpc('get_total_amount')) // Pseudo-logic, we'll calc in JS for simplicity on small data
    // For simple dashboards, fetching active sales is fast enough
  
  const { data: allActiveSales } = await supabase
    .from('sales')
    .select('total_amount, paid_amount')
    .neq('status', 'Cancelled')

  // C. Payables (Money You Owe Suppliers)
  const { data: allActivePurchases } = await supabase
    .from('purchases')
    .select('total_amount, paid_amount, currency, exchange_rate')
    .neq('status', 'Cancelled')

  // D. Low Stock Items (Limit 5 for display)
  const { data: lowStockItems } = await supabase
    .from('variants')
    .select('id, item_code, name, stock_quantity, min_stock_level, products(name)')
    .not('min_stock_level', 'is', null) // Filter out items without alerts
    
    // We can't easily filter "col1 <= col2" in simple Supabase query without RPC
    // So we fetch items with low stock numbers (e.g. < 10) and filter in JS for precision
    .lt('stock_quantity', 10) 
    .limit(50)

  // E. Recent Sales List
  const { data: recentSales } = await supabase
    .from('sales')
    .select('id, reference_no, customer_name, total_amount, status')
    .order('created_at', { ascending: false })
    .limit(5)


  // --- 2. CALCULATE METRICS (JavaScript) ---

  // Sales Today
  const totalSalesToday = salesToday?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

  // Receivables (Customers owe us)
  const totalReceivables = allActiveSales?.reduce((sum, s) => {
    const balance = (s.total_amount || 0) - (s.paid_amount || 0)
    return sum + (balance > 0 ? balance : 0)
  }, 0) || 0

  // Payables (We owe suppliers) - Convert USD to RM approx if needed
  const totalPayables = allActivePurchases?.reduce((sum, p) => {
    const total = p.total_amount || 0
    const paid = p.paid_amount || 0
    let balance = total - paid
    
    // Convert USD balance to RM for summary
    if (p.currency === 'USD') {
      balance = balance * (p.exchange_rate || 4.5)
    }
    
    return sum + (balance > 0 ? balance : 0)
  }, 0) || 0

  // Filter Low Stock (Strict check: Stock <= Min)
  const criticalStock = lowStockItems?.filter(i => i.stock_quantity <= (i.min_stock_level || 5)).slice(0, 5) || []

  return (
    <div className="space-y-8">
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview for {new Date().toDateString()}</p>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Sales Today */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Today</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">RM {totalSalesToday.toFixed(2)}</h3>
          <p className="text-sm text-gray-500 mt-1">Sales Revenue</p>
        </div>

        {/* Card 2: Receivables */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">RM {totalReceivables.toFixed(2)}</h3>
          <p className="text-sm text-gray-500 mt-1">To Collect (Customers)</p>
        </div>

        {/* Card 3: Payables */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
              <ShoppingCart size={24} />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Pending</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">RM {totalPayables.toFixed(2)}</h3>
          <p className="text-sm text-gray-500 mt-1">To Pay (Suppliers)</p>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <AlertTriangle size={24} />
            </div>
            <span className="text-xs font-bold text-red-500 uppercase">Action Needed</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{criticalStock.length} Items</h3>
          <p className="text-sm text-gray-500 mt-1">Low Stock Alert</p>
        </div>
      </div>

      {/* --- BOTTOM SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Quick Actions & Low Stock List */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
             <Link href="/sales/new" className="flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all">
                <Plus size={24} />
                <span className="font-bold">New Sale</span>
             </Link>
             <Link href="/inventory/new" className="flex items-center justify-center gap-3 p-4 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all">
                <Package size={24} />
                <span className="font-bold">Add Inventory</span>
             </Link>
          </div>

          {/* Low Stock Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
             <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-50">
                <h3 className="font-bold text-red-900 flex items-center gap-2">
                   <AlertTriangle size={18} /> Critical Low Stock
                </h3>
                <Link href="/inventory" className="text-xs font-bold text-red-700 hover:underline">View All</Link>
             </div>
             <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                   <tr>
                      <th className="px-4 py-2 text-left">Item Code</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-center">Stock</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {criticalStock.map(item => (
                      <tr key={item.id}>
                         <td className="px-4 py-3 font-bold text-gray-700">{item.item_code}</td>
                         <td className="px-4 py-3 text-gray-600">{item.products?.name} - {item.name}</td>
                         <td className="px-4 py-3 text-center">
                            <span className="inline-flex px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                               {item.stock_quantity}
                            </span>
                         </td>
                      </tr>
                   ))}
                   {criticalStock.length === 0 && (
                      <tr>
                         <td colSpan={3} className="px-4 py-6 text-center text-gray-400">All stock levels are healthy.</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>

        </div>

        {/* Right: Recent Sales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-fit">
           <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Recent Sales</h3>
              <Link href="/sales" className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                 <ArrowRight size={18} />
              </Link>
           </div>
           <div className="divide-y divide-gray-100">
              {recentSales?.map(sale => (
                 <div key={sale.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                       <span className="font-bold text-gray-800">{sale.reference_no}</span>
                       <span className="font-bold text-green-600">RM {sale.total_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                       <span>{sale.customer_name || 'Walk-in'}</span>
                       <span className={`px-2 py-0.5 rounded-full ${sale.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {sale.status}
                       </span>
                    </div>
                 </div>
              ))}
              {(!recentSales || recentSales.length === 0) && (
                 <div className="p-8 text-center text-gray-400 text-sm">No sales yet.</div>
              )}
           </div>
           <div className="p-3 bg-gray-50 border-t border-gray-200">
              <Link href="/sales/new" className="block w-full text-center text-sm font-bold text-blue-600 hover:text-blue-800">
                 + Create New Sale
              </Link>
           </div>
        </div>

      </div>
    </div>
  )
}