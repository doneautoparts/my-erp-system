'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Box, Download, Truck, Anchor, Save, FolderOpen, Printer, RotateCcw } from 'lucide-react'
import { saveScenario, deleteScenario, getScenario } from './actions'
import { useRouter } from 'next/navigation'

// Helper for currency formatting
const formatRM = (val: number) => 
  new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(val)

const formatUSD = (val: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

const formatQty = (val: number) => 
  new Intl.NumberFormat('en-US').format(val)

export default function ShipmentSimulator({ 
  variants,
  savedScenarios 
}: { 
  variants: any[],
  savedScenarios: any[]
}) {
  const router = useRouter()

  // --- VARIABLES ---
  const DEFAULT_RATE = 4.75
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_RATE)
  const [oceanLumpSum, setOceanLumpSum] = useState(5000) 
  const [truckingLumpSum, setTruckingLumpSum] = useState(800) 
  const [isFormE, setIsFormE] = useState(true) 
  const [manualDutyPct, setManualDutyPct] = useState(10) 
  const [consumable, setConsumable] = useState(2.00) 
  const [license, setLicense] = useState(0.30) 

  // --- SELECTION ---
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [qty, setQty] = useState(1)

  // --- STATE ---
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [globalTier, setGlobalTier] = useState<"sell" | "online" | "proposal">("proposal")
  const [scenarioName, setScenarioName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // --- FILTERS ---
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
    
    let initialPrice = item.price_proposal || 0
    if (globalTier === 'sell') initialPrice = item.price_myr || 0
    if (globalTier === 'online') initialPrice = item.price_online || 0

    setOrderItems(prev => [...prev, { 
      ...item, 
      uniqueId: Math.random(), 
      orderQty: qty,
      targetPrice: initialPrice,
      selectedTier: globalTier,
      origSell: item.price_myr || 0,
      origOnline: item.price_online || 0,
      origProposal: item.price_proposal || 0
    }])
    setQty(1)
  }

  const handleRemove = (id: number) => {
    setOrderItems(prev => prev.filter(item => item.uniqueId !== id))
  }

  const updateOrderRow = (id: number, field: string, value: any) => {
    setOrderItems(prev => prev.map(item => {
      if (item.uniqueId !== id) return item;
      if (field === 'selectedTier') {
        let newPrice = item.targetPrice;
        if (value === 'sell') newPrice = item.origSell;
        else if (value === 'online') newPrice = item.origOnline;
        else if (value === 'proposal') newPrice = item.origProposal;
        return { ...item, selectedTier: value, targetPrice: newPrice };
      }
      if (field === 'targetPrice') return { ...item, targetPrice: value, selectedTier: 'manual' };
      return { ...item, [field]: value };
    }))
  }

  const handleGlobalTierChange = (newTier: "sell" | "online" | "proposal") => {
    setGlobalTier(newTier)
    setOrderItems(prev => prev.map(item => {
        let newPrice = 0
        if (newTier === 'sell') newPrice = item.origSell
        else if (newTier === 'online') newPrice = item.origOnline
        else if (newTier === 'proposal') newPrice = item.origProposal
        return { ...item, targetPrice: newPrice, selectedTier: newTier }
    }))
  }

  const handleReset = () => {
    if (orderItems.length > 0 && !confirm("Clear all data?")) return
    setOrderItems([]); setScenarioName(""); setExchangeRate(DEFAULT_RATE); setOceanLumpSum(5000); setTruckingLumpSum(800); setIsFormE(true); setManualDutyPct(10); setConsumable(2.00); setLicense(0.30);
    setSelectedBrand(""); setSelectedProduct(""); setSelectedVariantId(""); setQty(1);
  }

  const handleSave = async () => {
    if (!scenarioName) return alert("Enter draft name")
    setIsLoading(true)
    const variables = { exchangeRate, oceanLumpSum, truckingLumpSum, isFormE, manualDutyPct, consumable, license }
    await saveScenario(scenarioName, variables, orderItems)
    setIsLoading(false); alert("Saved!"); router.refresh()
  }

  const handleLoad = async (id: string) => {
    if(!confirm("Load draft?")) return
    setIsLoading(true)
    const { scenario, items } = await getScenario(id)
    if (scenario) {
      setExchangeRate(scenario.exchange_rate ?? DEFAULT_RATE); setOceanLumpSum(scenario.ocean_lump_sum ?? 5000); setTruckingLumpSum(scenario.trucking_lump_sum ?? 800); setIsFormE(scenario.is_form_e ?? true); setManualDutyPct(scenario.manual_duty_pct ?? 10); setConsumable(scenario.consumable ?? 2.00); setLicense(scenario.license ?? 0.30); setScenarioName(scenario.name)
    }
    const loadedItems = (items || []).map((i: any) => ({
        ...i.variants, uniqueId: Math.random(), orderQty: i.qty, targetPrice: i.target_price,
        selectedTier: 'manual', origSell: i.variants.price_myr||0, origOnline: i.variants.price_online||0, origProposal: i.variants.price_proposal||0
    }))
    setOrderItems(loadedItems)
    setIsLoading(false)
  }

  // --- CALCULATIONS ---
  const calculation = useMemo(() => {
    let totalCBM = 0, totalFOB_RM = 0, totalFOB_USD = 0, totalExactCartons = 0, totalQty = 0

    const rowsWithVolume = orderItems.map(item => {
      const unitCBM = (item.ctn_len * item.ctn_wid * item.ctn_height > 0) ? ((item.ctn_len * item.ctn_wid * item.ctn_height) / 1000000) / (item.ctn_qty || 1) : 0
      const totalItemCBM = unitCBM * item.orderQty
      const unitFobUSD = item.cost_usd || 0
      const unitFobRM = unitFobUSD > 0 ? unitFobUSD * exchangeRate : (item.cost_rm || 0)
      
      totalCBM += totalItemCBM
      totalFOB_RM += unitFobRM * item.orderQty
      totalFOB_USD += unitFobUSD * item.orderQty
      totalExactCartons += item.orderQty / (item.ctn_qty || 1)
      totalQty += item.orderQty

      return { ...item, unitCBM, totalItemCBM, unitFobRM, unitFobUSD }
    })

    const totalLogisticsLumpSum = oceanLumpSum + truckingLumpSum
    const taxBase = totalFOB_RM + oceanLumpSum
    const totalSST = taxBase * 0.10 
    const dutyRate = isFormE ? 0 : (manualDutyPct / 100)

    const finalRows = rowsWithVolume.map(item => {
      const cbmShare = totalCBM > 0 ? (item.totalItemCBM / totalCBM) : 0
      const allocatedLogistics = (item.orderQty > 0) ? (cbmShare * totalLogisticsLumpSum) / item.orderQty : 0
      const valueShare = totalFOB_RM > 0 ? (item.unitFobRM * item.orderQty / totalFOB_RM) : 0
      const allocatedSST = (item.orderQty > 0) ? (valueShare * totalSST) / item.orderQty : 0
      const unitDuty = item.unitFobRM * dutyRate
      const landedCost = item.unitFobRM + allocatedLogistics + unitDuty + allocatedSST + consumable + license
      const grossProfit = item.targetPrice - landedCost
      const margin = item.targetPrice > 0 ? (grossProfit / item.targetPrice) * 100 : 0

      return { ...item, landedCost, grossProfit, margin, isLowMargin: margin < 20 }
    })

    return {
      rows: finalRows,
      totals: { qty: totalQty, cbm: totalCBM, cartons: totalExactCartons, fobRM: totalFOB_RM, fobUSD: totalFOB_USD, logistics: totalLogisticsLumpSum, sst: totalSST, cashOutlay: totalFOB_RM + totalLogisticsLumpSum + totalSST + (totalFOB_RM * dutyRate) }
    }
  }, [orderItems, exchangeRate, oceanLumpSum, truckingLumpSum, isFormE, manualDutyPct, consumable, license])

  const exportToCSV = () => {
    const headers = ["Brand", "Model", "Item Code", "Description", "Qty", "Cartons", "Total CBM", "Cost (USD)", "FOB(RM)", "Landed Cost", "Sell Price", "Profit", "Margin %"]
    const csvRows = [
      headers.join(','),
      ...calculation.rows.map(r => [
        `"${r.products?.brands?.name}"`, `"${r.products?.name}"`, r.item_code, `"${r.name}"`, 
        r.orderQty, (r.orderQty / (r.ctn_qty||1)).toFixed(2), r.totalItemCBM.toFixed(4),
        r.unitFobUSD.toFixed(2), r.unitFobRM.toFixed(2), r.landedCost.toFixed(2), r.targetPrice.toFixed(2), r.grossProfit.toFixed(2), r.margin.toFixed(2)
      ].join(','))
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `analysis.csv`; a.click()
  }

  const handlePrint = () => window.print()

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-screen">
      
      <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 5mm; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { 
            position: fixed; 
            left: 0; 
            top: 0; 
            width: 100vw; 
            height: 100vh; 
            background: white; 
            z-index: 9999; 
            padding: 10px;
          }
          .print-hidden { display: none !important; }
          .print-visible { display: block !important; }
        }
      `}</style>

      {/* --- LEFT: MAIN WORKSPACE --- */}
      <div id="print-area" className="flex-1 space-y-6">
        
        {/* TOP BAR */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-3 print-hidden">
            <div className="flex items-center gap-2">
                <FolderOpen className="text-gray-500" size={20} />
                <select className="border rounded text-sm p-1 max-w-[200px]" onChange={(e) => { if(e.target.value) handleLoad(e.target.value) }} defaultValue="">
                    <option value="" disabled>-- Load Draft --</option>
                    {savedScenarios.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({new Date(s.created_at).toLocaleDateString()})</option>)}
                </select>
                <button onClick={handleReset} className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:text-red-600 border border-gray-300"><RotateCcw size={14} /> Reset</button>
            </div>
            <div className="flex items-center gap-2">
                <input placeholder="Draft Name..." className="border rounded text-sm p-1 w-40" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
                <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1 bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-black"><Save size={14} /> Save</button>
            </div>
        </div>

        {/* --- NEW HEADER: TITLE ONLY --- */}
        <div className="mb-2">
            <h1 className="text-2xl font-bold uppercase border-b-2 border-black pb-2 text-gray-800">NEW ORDER ANALYSIS</h1>
        </div>

        {/* --- 10-CELL SUMMARY TABLE (5 Cols x 2 Rows) --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:border-2 print:border-black mb-6">
          <table className="min-w-full text-sm">
             <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs border-b border-gray-300 print:bg-gray-200 print:text-black">
                <tr>
                   <th className="px-2 py-2 border-r text-center w-[12%]">Rate / Duty</th>
                   <th className="px-2 py-2 border-r text-center w-[12%]">Qty</th>
                   <th className="px-2 py-2 border-r text-center w-[15%]">Volume</th>
                   <th className="px-2 py-2 border-r text-right w-[30%]">FOB Value</th>
                   <th className="px-2 py-2 text-right w-[31%]">Total Costing</th>
                </tr>
             </thead>
             <tbody className="text-gray-800">
                <tr className="border-b border-gray-100 print:border-gray-300">
                   <td className="px-2 py-2 border-r text-center font-mono">
                      <div className="font-bold">USD {exchangeRate.toFixed(2)}</div>
                   </td>
                   <td className="px-2 py-2 border-r text-center font-bold text-lg">
                      {formatQty(calculation.totals.qty)}
                   </td>
                   <td className="px-2 py-2 border-r text-center">
                      <div className="font-bold text-lg text-indigo-700 print:text-black">{calculation.totals.cbm.toFixed(2)} m³</div>
                   </td>
                   <td className="px-2 py-2 border-r text-right">
                      <div className="font-bold text-blue-700 print:text-black">{formatUSD(calculation.totals.fobUSD)}</div>
                   </td>
                   <td className="px-2 py-2 text-right font-bold text-orange-600 print:text-black">
                      LOGS: {formatRM(calculation.totals.logistics)}
                   </td>
                </tr>
                <tr>
                   <td className="px-2 py-2 border-r text-center text-xs text-gray-500">
                      {isFormE ? '0% (Form E)' : `${manualDutyPct}% Duty`}
                   </td>
                   <td className="px-2 py-2 border-r text-center text-xs text-gray-500">Units</td>
                   <td className="px-2 py-2 border-r text-center text-xs text-gray-500">
                      {calculation.totals.cartons.toFixed(1)} Ctns
                   </td>
                   <td className="px-2 py-2 border-r text-right font-semibold text-gray-700">
                      {formatRM(calculation.totals.fobRM)}
                   </td>
                   <td className="px-2 py-2 text-right">
                      <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-gray-500">SST: {formatRM(calculation.totals.sst)}</span>
                          <span className="font-bold text-xl text-black bg-yellow-100 px-2 rounded print:bg-transparent">
                             {formatRM(calculation.totals.cashOutlay)}
                          </span>
                      </div>
                   </td>
                </tr>
             </tbody>
          </table>
        </div>

        {/* --- ITEM SELECTOR (Hidden Print) --- */}
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

        {/* --- MAIN TABLE --- */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:border-2 print:border-black">
          <div className="flex justify-between items-center p-3 border-b bg-gray-50 print:bg-white print:border-black">
            <h3 className="font-bold text-gray-700">Shipment Manifest</h3>
            <div className="flex gap-2 items-center print-hidden bg-gray-100 p-1 rounded-md">
                <span className="text-xs font-bold text-gray-500 px-2">Global Price:</span>
                <button onClick={() => handleGlobalTierChange('sell')} className={`px-2 py-1 text-xs rounded ${globalTier === 'sell' ? 'bg-white shadow text-blue-700 font-bold' : 'text-gray-500'}`}>SELL</button>
                <button onClick={() => handleGlobalTierChange('online')} className={`px-2 py-1 text-xs rounded ${globalTier === 'online' ? 'bg-white shadow text-blue-700 font-bold' : 'text-gray-500'}`}>ONLINE</button>
                <button onClick={() => handleGlobalTierChange('proposal')} className={`px-2 py-1 text-xs rounded ${globalTier === 'proposal' ? 'bg-white shadow text-blue-700 font-bold' : 'text-gray-500'}`}>PROP</button>
            </div>
            <div className="flex gap-2 print-hidden">
                <button onClick={exportToCSV} className="flex items-center gap-1 text-xs font-semibold text-green-700 border border-green-200 px-2 py-1 rounded"><Download size={14} /> Excel</button>
                <button onClick={handlePrint} className="flex items-center gap-1 text-xs font-semibold text-blue-700 border border-blue-200 px-2 py-1 rounded"><Printer size={14} /> Print PDF</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100 text-gray-600 uppercase font-bold print:bg-gray-200 print:text-black print:border-b print:border-black">
                <tr>
                  <th className="px-2 py-2 text-left w-[20%]">Item Details</th>
                  <th className="px-2 py-2 text-center bg-yellow-50 print:bg-white">Qty</th>
                  <th className="px-2 py-2 text-center bg-purple-50 print:bg-white">Ctn</th>
                  <th className="px-2 py-2 text-right bg-purple-50 print:bg-white">CBM</th>
                  <th className="px-2 py-2 text-right">Cost(USD)</th>
                  <th className="px-2 py-2 text-right">FOB(RM)</th>
                  <th className="px-2 py-2 text-right bg-blue-50 print:bg-white">Landed</th>
                  <th className="px-2 py-2 text-center bg-green-50 print:bg-white w-[15%]">Target Price</th>
                  <th className="px-2 py-2 text-right bg-green-50 print:bg-white">Profit</th>
                  <th className="px-2 py-2 text-right bg-green-50 print:bg-white">Margin</th>
                  <th className="px-2 py-2 text-center print-hidden">Act</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                {calculation.rows.map((row) => (
                  <tr key={row.uniqueId} className={`hover:bg-gray-50 ${row.isLowMargin ? 'bg-red-50' : ''} print:bg-white`}>
                    <td className="px-2 py-2">
                      <div className="font-bold text-gray-900">{row.item_code}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{row.products?.name}</div>
                      <div className="text-[9px] text-gray-400">{row.name}</div>
                    </td>
                    <td className="px-2 py-2 text-center bg-yellow-50 print:bg-white">
                      <input type="number" value={row.orderQty} onChange={(e) => updateOrderRow(row.uniqueId, 'orderQty', parseInt(e.target.value))} className="w-12 text-center border rounded p-1 bg-white print-hidden" />
                      <span className="hidden print:inline">{row.orderQty}</span>
                    </td>
                    <td className="px-2 py-2 text-center bg-purple-50 print:bg-white">{row.exactCartons.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right bg-purple-50 print:bg-white">{row.totalItemCBM.toFixed(3)}</td>
                    <td className="px-2 py-2 text-right text-gray-500">{row.unitFobUSD > 0 ? row.unitFobUSD.toFixed(2) : '-'}</td>
                    <td className="px-2 py-2 text-right text-gray-500">{row.unitFobRM.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-bold text-blue-700 bg-blue-50 print:bg-white print:text-black">{row.landedCost.toFixed(2)}</td>
                    
                    <td className="px-2 py-2 bg-green-50 print:bg-white">
                       <div className="flex justify-between gap-1 print-hidden text-[9px] mb-1">
                          <label className="cursor-pointer text-gray-500"><input type="radio" name={`t-${row.uniqueId}`} checked={row.selectedTier==='sell'} onChange={()=>updateOrderRow(row.uniqueId,'selectedTier','sell')}/> S</label>
                          <label className="cursor-pointer text-gray-500"><input type="radio" name={`t-${row.uniqueId}`} checked={row.selectedTier==='online'} onChange={()=>updateOrderRow(row.uniqueId,'selectedTier','online')}/> O</label>
                          <label className="cursor-pointer text-gray-500"><input type="radio" name={`t-${row.uniqueId}`} checked={row.selectedTier==='proposal'} onChange={()=>updateOrderRow(row.uniqueId,'selectedTier','proposal')}/> P</label>
                       </div>
                       <input type="number" value={row.targetPrice} onChange={(e) => updateOrderRow(row.uniqueId, 'targetPrice', parseFloat(e.target.value))} className="w-full text-right border rounded p-1 bg-white print-hidden font-bold" step="0.01" />
                       <span className="hidden print:block text-right font-bold">{row.targetPrice.toFixed(2)}</span>
                    </td>

                    <td className={`px-2 py-2 text-right font-bold bg-green-50 print:bg-white ${row.grossProfit > 0 ? 'text-green-700' : 'text-red-700'}`}>{row.grossProfit.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-bold bg-green-50 print:bg-white">{row.margin.toFixed(1)}%</td>
                    <td className="px-2 py-2 text-center print-hidden"><button onClick={() => handleRemove(row.uniqueId)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- RIGHT: SIDEBAR (Hidden on Print) --- */}
      <div className="w-full lg:w-72 bg-white border-l border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto print-hidden">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Truck size={20} /> Logistics & Tax</h2>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-blue-800">Exchange Rate</label><input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} className="w-full border p-2 rounded" step="0.01" /></div>
          <div><label className="text-xs font-bold text-gray-500">Ocean & Port</label><input type="number" value={oceanLumpSum} onChange={e => setOceanLumpSum(parseFloat(e.target.value))} className="w-full border p-2 rounded" /></div>
          <div><label className="text-xs font-bold text-gray-500">Trucking</label><input type="number" value={truckingLumpSum} onChange={e => setTruckingLumpSum(parseFloat(e.target.value))} className="w-full border p-2 rounded" /></div>
          <div className="flex items-center gap-2 border-t pt-4"><input type="checkbox" checked={isFormE} onChange={e => setIsFormE(e.target.checked)} /><label className="text-xs font-bold">Form E (0% Duty)</label></div>
          {!isFormE && <div><label className="text-xs text-gray-400">MFN Duty %</label><input type="number" value={manualDutyPct} onChange={e => setManualDutyPct(parseFloat(e.target.value))} className="w-full border p-1" /></div>}
          <div className="grid grid-cols-2 gap-2 border-t pt-4">
             <div><label className="text-[10px] font-bold">Consumable</label><input type="number" value={consumable} onChange={e => setConsumable(parseFloat(e.target.value))} className="w-full border p-1" /></div>
             <div><label className="text-[10px] font-bold">License</label><input type="number" value={license} onChange={e => setLicense(parseFloat(e.target.value))} className="w-full border p-1" /></div>
          </div>
        </div>
      </div>
    </div>
  )
}