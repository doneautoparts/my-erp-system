'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Box, Download, Truck, Anchor, Save, FolderOpen, Printer } from 'lucide-react'
import { saveScenario, deleteScenario, getScenario } from './actions'
import { useRouter } from 'next/navigation'

// Helper for currency formatting
const formatRM = (val: number) => 
  new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(val)

export default function ShipmentSimulator({ 
  variants,
  savedScenarios 
}: { 
  variants: any[],
  savedScenarios: any[]
}) {
  const router = useRouter()

  // --- LOGISTICS & TAX SCENARIO INPUTS ---
  const [exchangeRate, setExchangeRate] = useState(4.75)
  const [oceanLumpSum, setOceanLumpSum] = useState(5000) 
  const [truckingLumpSum, setTruckingLumpSum] = useState(800) 
  const [isFormE, setIsFormE] = useState(true) 
  const [manualDutyPct, setManualDutyPct] = useState(10) 
  const [consumable, setConsumable] = useState(2.00) 
  const [license, setLicense] = useState(0.30) 

  // --- SELECTION STATE ---
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [qty, setQty] = useState(1)

  // --- ORDER DRAFT STATE ---
  const [orderItems, setOrderItems] = useState<any[]>([])

  // --- SAVE/LOAD STATE ---
  const [scenarioName, setScenarioName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // --- FILTERING LOGIC ---
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

  // --- HANDLERS ---
  const handleAddItem = () => {
    const item = variants.find(v => v.id === selectedVariantId)
    if (!item) return
    setOrderItems(prev => [...prev, { 
      ...item, 
      uniqueId: Math.random(), 
      orderQty: qty,
      targetPrice: item.price_proposal || 0 
    }])
    setQty(1)
  }

  const handleRemove = (id: number) => {
    setOrderItems(prev => prev.filter(item => item.uniqueId !== id))
  }

  const updateOrderRow = (id: number, field: string, value: number) => {
    setOrderItems(prev => prev.map(item => 
      item.uniqueId === id ? { ...item, [field]: value } : item
    ))
  }

  // --- SAVE / LOAD ACTIONS ---
  const handleSave = async () => {
    if (!scenarioName) return alert("Please enter a name for this draft")
    setIsLoading(true)
    const variables = { exchangeRate, oceanLumpSum, truckingLumpSum, isFormE, manualDutyPct, consumable, license }
    
    await saveScenario(scenarioName, variables, orderItems)
    setIsLoading(false)
    setScenarioName("")
    alert("Draft Saved Successfully!")
    router.refresh()
  }

  const handleLoad = async (id: string) => {
    if(!confirm("Loading a draft will replace your current work. Continue?")) return
    setIsLoading(true)
    const { scenario, items } = await getScenario(id)
    
    if (scenario) {
      setExchangeRate(scenario.exchange_rate ?? 4.75)
      setOceanLumpSum(scenario.ocean_lump_sum ?? 5000)
      setTruckingLumpSum(scenario.trucking_lump_sum ?? 800)
      setIsFormE(scenario.is_form_e ?? true)
      setManualDutyPct(scenario.manual_duty_pct ?? 10)
      setConsumable(scenario.consumable ?? 2.00)
      setLicense(scenario.license ?? 0.30)
    }

    const loadedItems = (items || []).map((i: any) => ({
        ...i.variants, 
        uniqueId: Math.random(),
        orderQty: i.qty,
        targetPrice: i.target_price
    }))
    setOrderItems(loadedItems)
    setIsLoading(false)
  }

  // --- ENGINE: CALCULATIONS ---
  const calculation = useMemo(() => {
    let totalCBM = 0
    let totalFOB_RM = 0
    let totalExactCartons = 0

    const rowsWithVolume = orderItems.map(item => {
      const length = item.ctn_len || 0
      const width = item.ctn_wid || 0
      const height = item.ctn_height || 0
      const pcsPerCtn = item.ctn_qty || 1
      const exactCartons = item.orderQty / pcsPerCtn
      const unitCBM = (length * width * height > 0) ? ((length * width * height) / 1000000) / pcsPerCtn : 0
      const totalItemCBM = unitCBM * item.orderQty
      const unitFobUSD = item.cost_usd || 0
      const unitFobRM = unitFobUSD > 0 ? unitFobUSD * exchangeRate : (item.cost_rm || 0)
      const totalItemFobRM = unitFobRM * item.orderQty

      totalCBM += totalItemCBM
      totalFOB_RM += totalItemFobRM
      totalExactCartons += exactCartons

      return { ...item, unitCBM, totalItemCBM, unitFobRM, totalItemFobRM, exactCartons }
    })

    const totalLogisticsLumpSum = oceanLumpSum + truckingLumpSum
    const taxBase = totalFOB_RM + oceanLumpSum
    const totalSST = taxBase * 0.10 
    const dutyRate = isFormE ? 0 : (manualDutyPct / 100)

    const finalRows = rowsWithVolume.map(item => {
      const cbmShare = totalCBM > 0 ? (item.totalItemCBM / totalCBM) : 0
      const allocatedLogisticsTotal = cbmShare * totalLogisticsLumpSum
      const allocatedLogisticsPerUnit = item.orderQty > 0 ? (allocatedLogisticsTotal / item.orderQty) : 0
      const valueShare = totalFOB_RM > 0 ? (item.totalItemFobRM / totalFOB_RM) : 0
      const allocatedSSTPerUnit = item.orderQty > 0 ? (valueShare * totalSST) / item.orderQty : 0
      const unitDuty = item.unitFobRM * dutyRate
      const landedCost = item.unitFobRM + allocatedLogisticsPerUnit + unitDuty + allocatedSSTPerUnit + consumable + license
      const grossProfit = item.targetPrice - landedCost
      const margin = item.targetPrice > 0 ? (grossProfit / item.targetPrice) * 100 : 0

      return {
        ...item, allocatedLogisticsPerUnit, allocatedSSTPerUnit, landedCost, grossProfit, margin, isLowMargin: margin < 20
      }
    })

    return {
      rows: finalRows,
      totals: { cbm: totalCBM, cartons: totalExactCartons, fobRM: totalFOB_RM, logistics: totalLogisticsLumpSum, sst: totalSST, cashOutlay: totalFOB_RM + totalLogisticsLumpSum + totalSST + (totalFOB_RM * dutyRate) }
    }
  }, [orderItems, exchangeRate, oceanLumpSum, truckingLumpSum, isFormE, manualDutyPct, consumable, license])

  const exportToCSV = () => {
    const headers = ["Item Code", "Product", "Qty", "Cartons", "Total CBM", "FOB(RM)", "Landed Cost", "Sell Price", "Profit", "Margin %"]
    const csvRows = [
      headers.join(','),
      ...calculation.rows.map(r => [
        r.item_code, `"${r.name}"`, r.orderQty, r.exactCartons.toFixed(2), r.totalItemCBM.toFixed(4),
        r.unitFobRM.toFixed(2), r.landedCost.toFixed(2), r.targetPrice.toFixed(2), r.grossProfit.toFixed(2), r.margin.toFixed(2)
      ].join(','))
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `shipment_analysis_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  // --- PRINT HANDLER ---
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-screen">
      
      {/* --- INJECT PRINT STYLES --- */}
      <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          .print-hidden { display: none !important; }
          .print-full-width { width: 100% !important; }
          .print-visible { display: block !important; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* --- LEFT: MAIN WORKSPACE --- */}
      <div className="flex-1 space-y-6 print-full-width">
        
        {/* TOP BAR: LOAD / SAVE */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between print-hidden">
            <div className="flex items-center gap-2">
                <FolderOpen className="text-gray-500" size={20} />
                <span className="text-sm font-bold text-gray-700">Saved Drafts:</span>
                <select 
                    className="border rounded text-sm p-1 max-w-[200px]"
                    onChange={(e) => { if(e.target.value) handleLoad(e.target.value) }}
                    defaultValue=""
                >
                    <option value="" disabled>-- Load a Draft --</option>
                    {savedScenarios.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({new Date(s.created_at).toLocaleDateString()})</option>
                    ))}
                </select>
            </div>
            
            <div className="flex items-center gap-2">
                <input 
                    placeholder="Enter Draft Name..." 
                    className="border rounded text-sm p-1"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                />
                <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1 bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-black">
                    <Save size={14} /> Save Draft
                </button>
            </div>
        </div>

        {/* PRINT ONLY HEADER (Settings Summary) */}
        <div className="hidden print-visible mb-4 border-b border-black pb-2">
            <h1 className="text-xl font-bold uppercase">Shipment Profit Analysis</h1>
            <div className="flex gap-6 text-xs text-gray-600 mt-1">
                <span><strong>Rate:</strong> {exchangeRate}</span>
                <span><strong>Ocean:</strong> RM {oceanLumpSum}</span>
                <span><strong>Trucking:</strong> RM {truckingLumpSum}</span>
                <span><strong>Duty:</strong> {isFormE ? '0% (Form E)' : `${manualDutyPct}%`}</span>
                <span><strong>Overheads:</strong> RM {consumable} + {license}</span>
            </div>
        </div>

        {/* KPI Header */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 print:border-black">
            <p className="text-xs font-bold text-gray-500 uppercase">Total Volume</p>
            <h3 className="text-2xl font-bold text-indigo-600 print:text-black">{calculation.totals.cbm.toFixed(3)} m³</h3>
            <div className="text-xs text-gray-400 mt-1 print:text-black">
              {calculation.totals.cartons.toFixed(1)} Total Cartons
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 print:border-black">
            <p className="text-xs font-bold text-gray-500 uppercase">Total FOB Value</p>
            <h3 className="text-2xl font-bold text-blue-600 print:text-black">{formatRM(calculation.totals.fobRM)}</h3>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 print:border-black">
            <p className="text-xs font-bold text-gray-500 uppercase">Tax Payable (SST)</p>
            <h3 className="text-2xl font-bold text-red-600 print:text-black">{formatRM(calculation.totals.sst)}</h3>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-900 text-white print:bg-white print:text-black print:border-black">
            <p className="text-xs font-bold text-gray-400 uppercase print:text-gray-600">Total Cash Outlay</p>
            <h3 className="text-xl font-bold">{formatRM(calculation.totals.cashOutlay)}</h3>
          </div>
        </div>

        {/* Item Selector (Hidden on Print) */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-2 items-end print-hidden">
           <div className="flex-1 grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Brand</label>
                <select className="w-full text-sm border rounded p-2" value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setSelectedProduct(""); }}>
                  <option value="">-- Brand --</option>
                  {brands.map((b: any) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Model</label>
                <select className="w-full text-sm border rounded p-2" value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); setSelectedVariantId(""); }} disabled={!selectedBrand}>
                  <option value="">-- Model --</option>
                  {products.map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Item</label>
                <select className="w-full text-sm border rounded p-2" value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)} disabled={!selectedProduct}>
                  <option value="">-- Item --</option>
                  {filteredVariants.map((v: any) => <option key={v.id} value={v.id}>[{v.item_code}] {v.name}</option>)}
                </select>
              </div>
           </div>
           <div className="w-24">
              <label className="text-xs text-gray-500 block mb-1">Qty</label>
              <input type="number" className="w-full text-sm border rounded p-2" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} />
           </div>
           <button onClick={handleAddItem} disabled={!selectedVariantId} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-500">
             <Plus size={20} />
           </button>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:border-black">
          <div className="flex justify-between items-center p-3 border-b bg-gray-50 print:bg-white print:border-black">
            <h3 className="font-bold text-gray-700">Shipment Manifest</h3>
            <div className="flex gap-2 print-hidden">
                <button onClick={exportToCSV} className="flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-900 border border-green-200 px-2 py-1 rounded">
                <Download size={14} /> Excel
                </button>
                <button onClick={handlePrint} className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-blue-200 px-2 py-1 rounded">
                <Printer size={14} /> Print PDF
                </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100 text-gray-600 uppercase font-bold print:bg-white print:text-black print:border-b-2 print:border-black">
                <tr>
                  <th className="px-3 py-2 text-left">Item Details</th>
                  <th className="px-3 py-2 text-center bg-yellow-50 print:bg-white">Qty</th>
                  <th className="px-3 py-2 text-center bg-purple-50 print:bg-white">Ctn</th>
                  <th className="px-3 py-2 text-right bg-purple-50 print:bg-white">CBM</th>
                  <th className="px-3 py-2 text-right">FOB (RM)</th>
                  <th className="px-3 py-2 text-right bg-blue-50 print:bg-white">Landed</th>
                  <th className="px-3 py-2 text-center bg-green-50 print:bg-white">Target</th>
                  <th className="px-3 py-2 text-right bg-green-50 print:bg-white">Profit</th>
                  <th className="px-3 py-2 text-right bg-green-50 print:bg-white">Margin</th>
                  <th className="px-3 py-2 text-center print-hidden">Act</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                {calculation.rows.map((row) => (
                  <tr key={row.uniqueId} className={`hover:bg-gray-50 ${row.isLowMargin ? 'bg-red-50' : ''} print:bg-white`}>
                    <td className="px-3 py-2">
                      <div className="font-bold text-gray-900">{row.item_code}</div>
                      <div className="text-gray-500 truncate max-w-[200px]">{row.name}</div>
                    </td>
                    <td className="px-3 py-2 text-center bg-yellow-50 print:bg-white">
                      <input 
                        type="number" 
                        value={row.orderQty} 
                        onChange={(e) => updateOrderRow(row.uniqueId, 'orderQty', parseInt(e.target.value))}
                        className="w-16 text-center border rounded p-1 bg-white print-hidden"
                      />
                      <span className="hidden print:inline">{row.orderQty}</span>
                    </td>
                    <td className="px-3 py-2 text-center bg-purple-50 print:bg-white font-medium">
                      {row.exactCartons.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right bg-purple-50 print:bg-white font-medium">
                      {row.totalItemCBM.toFixed(3)}
                    </td>

                    <td className="px-3 py-2 text-right font-mono text-gray-600">
                      {row.unitFobRM.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-blue-700 bg-blue-50 print:bg-white print:text-black">
                      {row.landedCost.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center bg-green-50 print:bg-white">
                      <input 
                        type="number" 
                        value={row.targetPrice} 
                        onChange={(e) => updateOrderRow(row.uniqueId, 'targetPrice', parseFloat(e.target.value))}
                        className="w-20 text-right border rounded p-1 bg-white print-hidden"
                        step="0.01"
                      />
                      <span className="hidden print:inline">{row.targetPrice.toFixed(2)}</span>
                    </td>
                    <td className={`px-3 py-2 text-right font-bold bg-green-50 print:bg-white ${row.grossProfit > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {row.grossProfit.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold bg-green-50 print:bg-white">
                      <span className={row.isLowMargin ? 'text-red-600' : 'text-green-600'}>
                        {row.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center print-hidden">
                      <button onClick={() => handleRemove(row.uniqueId)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- RIGHT: LOGISTICS SIDEBAR --- */}
      <div className="w-full lg:w-80 bg-white border-l border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto print-hidden">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Truck size={20} /> Logistics & Tax
        </h2>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
            <label className="text-xs font-bold text-blue-800 uppercase block mb-1">Exchange Rate (USD)</label>
            <input 
              type="number" 
              value={exchangeRate} 
              onChange={e => setExchangeRate(parseFloat(e.target.value))} 
              className="w-full text-right font-mono font-bold border-blue-300 rounded p-2 text-lg" 
              step="0.01" 
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ocean & Port (RM)</label>
            <div className="relative">
              <Anchor size={16} className="absolute left-3 top-3 text-gray-400" />
              <input 
                type="number" 
                value={oceanLumpSum} 
                onChange={e => setOceanLumpSum(parseFloat(e.target.value))} 
                className="w-full pl-9 border rounded p-2" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fwd & Trucking (RM)</label>
            <div className="relative">
              <Truck size={16} className="absolute left-3 top-3 text-gray-400" />
              <input 
                type="number" 
                value={truckingLumpSum} 
                onChange={e => setTruckingLumpSum(parseFloat(e.target.value))} 
                className="w-full pl-9 border rounded p-2" 
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Form E (0% Duty)</label>
              <input 
                type="checkbox" 
                checked={isFormE} 
                onChange={e => setIsFormE(e.target.checked)} 
                className="h-5 w-5 text-blue-600 rounded" 
              />
            </div>
            {!isFormE && (
              <div className="mb-2">
                <label className="text-xs text-gray-400">MFN Duty %</label>
                <input 
                  type="number" 
                  value={manualDutyPct} 
                  onChange={e => setManualDutyPct(parseFloat(e.target.value))} 
                  className="w-full border rounded p-1 text-sm" 
                />
              </div>
            )}
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-2">
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase">Consumable</label>
               <input type="number" value={consumable} onChange={e => setConsumable(parseFloat(e.target.value))} className="w-full border rounded p-1 text-sm" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase">License</label>
               <input type="number" value={license} onChange={e => setLicense(parseFloat(e.target.value))} className="w-full border rounded p-1 text-sm" />
             </div>
          </div>
        </div>
      </div>

    </div>
  )
}