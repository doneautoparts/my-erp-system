import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { createItem } from '../actions'
import { SubmitButton } from './submit-button'
import { createClient } from '@/utils/supabase/server'

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // FIX: Properly await searchParams
  const { error } = await searchParams
  
  const supabase = await createClient()
  const { data: brands } = await supabase.from('brands').select('name').order('name')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Inventory Item (Detailed)</h1>
      </div>

      {/* ERROR DISPLAY BOX */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-bold text-red-800">Action Failed</p>
              <p className="text-sm text-red-700">{decodeURIComponent(error)}</p>
            </div>
          </div>
        </div>
      )}

      <form action={createItem} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-8">
        
        {/* 1. Identification */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">1. Identity (From PDF)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Code *</label>
              <input name="item_code" required placeholder="e.g. SAFST" className="form-input" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Part No / SKU</label>
              <input name="part_number" placeholder="e.g. 341144" className="form-input" />
            </div>
            
            {/* BRAND: COMBO BOX LOGIC */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Brand *</label>
              <input 
                name="brand" 
                list="brand-list" 
                required 
                placeholder="Type or select..." 
                className="form-input" 
                autoComplete="off"
              />
              <datalist id="brand-list">
                 {brands?.map(b => (
                   <option key={b.name} value={b.name} />
                 ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700">Model Name *</label>
              <input name="product_name" required placeholder="e.g. SAGA/ISWARA" className="form-input" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select name="category" required className="form-input bg-white">
                <option value="Shock Absorber">Shock Absorber</option>
                <option value="Coil Spring">Coil Spring</option>
                <option value="Brake Pad">Brake Pad</option>
                <option value="Engine Oil">Engine Oil</option>
                <option value="Filter">Filter</option>
                <option value="Spare Part">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Variation */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">2. Variation & Position</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <input name="position" placeholder="e.g. FRONT LH" className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Var (Type)</label>
              <input name="type" placeholder="e.g. STD, HDUTY, PERF" className="form-input" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Packing Ratio (Important!)</label>
              <input name="packing_ratio" type="number" defaultValue="1" className="form-input" />
              <p className="text-xs text-gray-500">Enter 6 for Oil Box, 1 for Shocks.</p>
            </div>
          </div>
        </div>

        {/* 3. Pricing */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">3. Pricing Structure</h2>
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md">
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cost (Reference)</label>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-xs">BUY (USD)</label>
                    <input name="cost_usd" type="number" step="0.01" className="form-input" />
                 </div>
                 <div>
                    <label className="text-xs">COST (RM)</label>
                    <input name="cost_rm" type="number" step="0.01" className="form-input" />
                 </div>
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Selling Prices (RM)</label>
               <div className="grid grid-cols-3 gap-2">
                 <div>
                    <label className="text-xs">SELL</label>
                    <input name="price_sell" type="number" step="0.01" required className="form-input" />
                 </div>
                 <div>
                    <label className="text-xs">ONLINE</label>
                    <input name="price_online" type="number" step="0.01" className="form-input" />
                 </div>
                 <div>
                    <label className="text-xs">PROPOSAL</label>
                    <input name="price_proposal" type="number" step="0.01" className="form-input" />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* 4. Stock */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">4. Initial Stock</h2>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700">Current Stock (Base Units)</label>
              <input name="stock" type="number" defaultValue="0" required className="form-input" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Low Stock Alert</label>
              <input name="min_stock" type="number" defaultValue="5" className="form-input" />
            </div>
          </div>
        </div>

        {/* 5. CBM ANALYSIS (NEW SECTION) */}
        <div className="space-y-4 bg-blue-50 p-4 rounded-md border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2">5. Packaging & CBM Analysis (Optional)</h2>
          <div className="grid grid-cols-4 gap-4">
             <div>
              <label className="block text-sm font-medium text-blue-800">Items per Master Carton</label>
              <input name="ctn_qty" type="number" defaultValue="1" className="form-input border-blue-300" />
              <p className="text-xs text-blue-600 mt-1">e.g. 10 Shocks / Ctn</p>
            </div>
             <div>
              <label className="block text-sm font-medium text-blue-800">Length (cm)</label>
              <input name="ctn_len" type="number" step="0.1" className="form-input border-blue-300" />
            </div>
             <div>
              <label className="block text-sm font-medium text-blue-800">Width (cm)</label>
              <input name="ctn_wid" type="number" step="0.1" className="form-input border-blue-300" />
            </div>
             <div>
              <label className="block text-sm font-medium text-blue-800">Height (cm)</label>
              <input name="ctn_height" type="number" step="0.1" className="form-input border-blue-300" />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <SubmitButton />
        </div>

      </form>

      <style>{`
        .form-input {
          display: block;
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .form-input:focus {
          border-color: #2563eb;
          outline: 2px solid transparent;
          outline-offset: 2px;
          box-shadow: 0 0 0 2px #bfdbfe;
        }
      `}</style>
    </div>
  )
}