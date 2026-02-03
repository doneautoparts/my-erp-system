'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Calculator, Box, TrendingUp, DollarSign } from 'lucide-react'

// Helper for currency formatting
const formatRM = (val: number) => 
  new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(val)

export default function ProfitCalculator({ variants }: { variants: any[] }) {
  // --- 1. GLOBAL VARIABLES (The "What If" Scenarios) ---
  const [exchangeRate, setExchangeRate] = useState(4.60) // Default USD->RM
  const [shipPct, setShipPct] = useState(6.0) // Shipping % (FOB -> CIF)
  const [agentPct, setAgentPct] = useState(1.6) // Shipping Agent / Clearance
  const [fwdPct, setFwdPct] = useState(1.6) // Forwarding / Transport
  const [consumable, setConsumable] = useState(2.00) // Fixed RM per unit
  const [license, setLicense] = useState(0.30) // Fixed RM per unit

  // --- 2. SELECTION STATE ---
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [qty, setQty] = useState(1)

  // --- 3. ANALYSIS LIST STATE (Items user added to table) ---
  const [analysisList, setAnalysisList] = useState<any[]>([])

  // --- FILTER LOGIC (Same as Purchasing) ---
  const brands = useMemo(() => {
    const unique = new Set(variants.map(v => v.products?.brands?.name).filter(Boolean))
    return Array.from(unique).sort()
  }, [variants])

  const products = useMemo(() => {
    if (!selectedBrand) return []
    const filtered = variants.filter(v => v.products?.brands?.name === selectedBrand)
    const unique = new Set(filtered.map(v => v.products?.name).filter(Boolean))
    return Array.from(unique).sort()
  }, [variants, selectedBrand])

  const filteredVariants = useMemo(() => {
    if (!selectedProduct) return []
    return variants
      .filter(v => v.products?.brands?.name === selectedBrand && v.products?.name === selectedProduct)
      .sort((a, b) => (a.item_code || '').localeCompare(b.item_code || ''))
  }, [variants, selectedBrand, selectedProduct])

  // --- ADD ITEM TO LIST ---
  const handleAddItem = () => {
    const item = variants.find(v => v.id === selectedVariantId)
    if (!item) return

    // Add to list (Create a unique ID for the row in case duplicate items added)
    setAnalysisList(prev => [...prev, { ...item, analysisId: Math.random(), orderQty: qty }])
    
    // Reset selection slightly for speed
    setQty(1)
  }

  // --- REMOVE ITEM ---
  const handleRemove = (id: number) => {
    setAnalysisList(prev => prev.filter(item => item.analysisId !== id))
  }

  // --- CALCULATIONS ---
  const calculatedRows = analysisList.map(item => {
    // 1. Costs
    const baseCostUSD = item.cost_usd || 0
    const baseCostRM = baseCostUSD > 0 ? (baseCostUSD * exchangeRate) : (item.cost_rm || 0) // Fallback to RM cost if no USD
    
    // 2. Variable Costs (Percentages)
    const shipCost = baseCostRM * (shipPct / 100)
    const agentCost = baseCostRM * (agentPct / 100)
    const fwdCost = baseCostRM * (fwdPct / 100)
    
    // 3. Landed Cost
    const landedCostOne = baseCostRM + shipCost + agentCost + fwdCost + consumable + license
    
    // 4. Sales & Profit
    const sellPrice = item.price_proposal || 0 // Objective: Compare against Proposal Price
    const grossProfitOne = sellPrice - landedCostOne
    const margin = sellPrice > 0 ? (grossProfitOne / sellPrice) * 100 : 0

    // 5. CBM
    // Dims are in CM, need Meters. CBM = (L*W*H / 1,000,000)
    // Adjust for Packing Ratio (e.g. 10 pcs in 1 carton)
    const ratio = item.packing_ratio || 1
    const cartons = Math.ceil(item.orderQty / ratio)
    const singleCtnVol = (item.ctn_len * item.ctn_wid * item.ctn_height) / 1000000
    const totalCBM = singleCtnVol * cartons

    return {
      ...item,
      baseCostRM,
      shipCost,
      agentCost,
      fwdCost,
      landedCostOne,
      sellPrice,
      grossProfitOne,
      margin,
      cartons,
      totalCBM,
      totalProfit: grossProfitOne * item.orderQty
    }
  })

  // Grand Totals
  const grandTotalProfit = calculatedRows.reduce((sum, item) => sum + item.totalProfit, 0)
  const grandTotalCBM = calculatedRows.reduce((sum, item) => sum + item.totalCBM, 0)
  const grandTotalCartons = calculatedRows.reduce((sum, item) => sum + item.cartons, 0)

  return (
    <div className="space-y-8">
      
      {/* 1. CONTROL PANEL (VARIABLES) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calculator size={20} className="text-blue-600"/> Costing Variables
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">USD Rate</label>
            <input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} className="w-full border rounded p-2 text-blue-700 font-bold" step="0.01" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Shipping %</label>
            <input type="number" value={shipPct} onChange={e => setShipPct(parseFloat(e.target.value))} className="w-full border rounded p-2" step="0.1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Agent %</label>
            <input type="number" value={agentPct} onChange={e => setAgentPct(parseFloat(e.target.value))} className="w-full border rounded p-2" step="0.1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Forwarding %</label>
            <input type="number" value={fwdPct} onChange={e => setFwdPct(parseFloat(e.target.value))} className="w-full border rounded p-2" step="0.1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Consumable (RM)</label>
            <input type="number" value={consumable} onChange={e => setConsumable(parseFloat(e.target.value))} className="w-full border rounded p-2" step="0.1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">License (RM)</label>
            <input type="number" value={license} onChange={e => setLicense(parseFloat(e.target.value))} className="w-full border rounded p-2" step="0.01" />
          </div>
        </div>
      </div>

      {/* 2. ITEM SELECTOR */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-md font-bold text-blue-900 mb-4">Add Item to Simulate</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
            <select className="w-full rounded p-2 border" value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setSelectedProduct(""); }}>
              <option value="">-- Brand --</option>
              {brands.map((b: any) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
            <select className="w-full rounded p-2 border" value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); setSelectedVariantId(""); }} disabled={!selectedBrand}>
              <option value="">-- Model --</option>
              {products.map((p: any) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
            <select className="w-full rounded p-2 border" value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)} disabled={!selectedProduct}>
              <option value="">-- Item --</option>
              {filteredVariants.map((v: any) => <option key={v.id} value={v.id}>[{v.item_code}] {v.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
            <input type="number" className="w-full rounded p-2 border" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} min="1" />
          </div>

          <div className="md:col-span-1">
            <button onClick={handleAddItem} disabled={!selectedVariantId} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-500 disabled:opacity-50">
              <Plus size={20} className="mx-auto"/>
            </button>
          </div>
        </div>
      </div>

      {/* 3. RESULTS TABLE */}
      <div className="bg-white shadow-sm overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Item Details</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-right bg-gray-700">Base Cost (RM)</th>
              <th className="px-4 py-3 text-right">Landed Cost</th>
              <th className="px-4 py-3 text-right">Prop. Price</th>
              <th className="px-4 py-3 text-right bg-green-900">Profit / Unit</th>
              <th className="px-4 py-3 text-right">Total Profit</th>
              <th className="px-4 py-3 text-center">Cartons</th>
              <th className="px-4 py-3 text-right">CBM</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {calculatedRows.map((row) => (
              <tr key={row.analysisId} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-bold text-gray-900">{row.item_code}</div>
                  <div className="text-gray-500">{row.products?.name} - {row.name}</div>
                </td>
                <td className="px-4 py-3 text-center">{row.orderQty}</td>
                
                {/* Cost Breakdown Tooltip on Hover */}
                <td className="px-4 py-3 text-right font-mono bg-gray-50 text-gray-600" title={`USD: ${row.cost_usd}`}>
                  {row.baseCostRM.toFixed(2)}
                </td>
                
                <td className="px-4 py-3 text-right font-bold text-red-600" title={`Ship: ${row.shipCost.toFixed(2)} | Agent: ${row.agentCost.toFixed(2)} | Fwd: ${row.fwdCost.toFixed(2)} | Fixed: ${(consumable + license).toFixed(2)}`}>
                  {row.landedCostOne.toFixed(2)}
                </td>
                
                <td className="px-4 py-3 text-right text-blue-600 font-medium">
                  {row.sellPrice.toFixed(2)}
                </td>
                
                <td className={`px-4 py-3 text-right font-bold ${row.grossProfitOne > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {row.grossProfitOne.toFixed(2)}
                  <span className="block text-xs font-normal text-gray-400">({row.margin.toFixed(1)}%)</span>
                </td>

                <td className="px-4 py-3 text-right font-bold text-green-800">
                  {row.totalProfit.toFixed(2)}
                </td>

                <td className="px-4 py-3 text-center text-gray-500">
                  {row.cartons}
                </td>
                <td className="px-4 py-3 text-right text-purple-600 font-medium">
                  {row.totalCBM.toFixed(3)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleRemove(row.analysisId)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {calculatedRows.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">Add items to simulate costs and profit.</td>
              </tr>
            )}
          </tbody>
          {calculatedRows.length > 0 && (
            <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-right uppercase">Grand Totals:</td>
                <td className="px-4 py-3 text-right text-green-700 text-lg">{formatRM(grandTotalProfit)}</td>
                <td className="px-4 py-3 text-center">{grandTotalCartons} Box</td>
                <td className="px-4 py-3 text-right text-purple-700">{grandTotalCBM.toFixed(3)} m³</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="p-4 bg-yellow-50 text-yellow-800 text-xs rounded-md border border-yellow-200">
        <strong>Note:</strong> Landed Cost = Base RM + Shipping ({shipPct}%) + Agent ({agentPct}%) + Fwd ({fwdPct}%) + Consumable ({consumable}) + License ({license}).
      </div>
    </div>
  )
}