import { createClient } from '@/utils/supabase/server'
import { BarChart3, Box, Calculator } from 'lucide-react'
import Link from 'next/link'

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ po_id?: string }>
}) {
  const { po_id } = await searchParams
  const supabase = await createClient()

  // 1. Fetch Purchase Orders for Dropdown
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, reference_no, suppliers(name)')
    .order('created_at', { ascending: false })

  // 2. If PO selected, fetch items with dimensions
  let analysisItems: any[] = []
  let totalCBM = 0
  let totalCartons = 0

  if (po_id) {
    const { data: items } = await supabase
      .from('purchase_items')
      .select(`
        quantity,
        variants (
          item_code,
          name,
          ctn_qty,
          ctn_len,
          ctn_wid,
          ctn_height
        )
      `)
      .eq('purchase_id', po_id)

    if (items) {
      analysisItems = items.map((item: any) => {
        const v = item.variants
        // Calculate Logic
        const qtyPerCtn = v.ctn_qty || 1
        const cartons = Math.ceil(item.quantity / qtyPerCtn)
        
        // CBM = (L*W*H / 1,000,000) * cartons
        const singleCtnVol = (v.ctn_len * v.ctn_wid * v.ctn_height) / 1000000
        const totalVol = singleCtnVol * cartons

        totalCartons += cartons
        totalCBM += totalVol

        return {
          ...v,
          order_qty: item.quantity,
          cartons_needed: cartons,
          cbm: totalVol
        }
      })
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <BarChart3 size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Shipment Analysis (CBM)</h1>
      </div>

      {/* Select PO */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Purchase Order to Analyze</label>
        <form className="flex gap-4">
          <select 
            name="po_id" 
            defaultValue={po_id || ''}
            className="flex-1 rounded-md border border-gray-300 p-2"
          >
            <option value="">-- Choose PO --</option>
            {purchases?.map(p => (
              <option key={p.id} value={p.id}>{p.reference_no} - {p.suppliers?.name}</option>
            ))}
          </select>
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-500">
            Analyze
          </button>
        </form>
      </div>

      {/* Results */}
      {po_id && (
        <div className="space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 flex items-center gap-4">
              <Box size={32} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total Master Cartons</p>
                <h3 className="text-3xl font-bold text-blue-900">{totalCartons}</h3>
              </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 flex items-center gap-4">
              <Calculator size={32} className="text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-800">Total Volume (CBM)</p>
                <h3 className="text-3xl font-bold text-purple-900">{totalCBM.toFixed(3)} m³</h3>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white shadow overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dims (cm)</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pcs/Ctn</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Order Qty</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cartons</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CBM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analysisItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{item.item_code}</div>
                      <div className="text-xs text-gray-500">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                      {item.ctn_len} x {item.ctn_wid} x {item.ctn_height}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{item.ctn_qty}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{item.order_qty}</td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-blue-600">{item.cartons_needed}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-purple-600">{item.cbm.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}