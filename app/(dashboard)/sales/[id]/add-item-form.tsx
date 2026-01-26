'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { addItemToSale } from '../actions' // We reuse the existing action
import { useFormStatus } from 'react-dom'

// Helper button to show "Adding..." status
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full bg-blue-600 text-white p-2 rounded-md text-sm hover:bg-blue-500 flex items-center justify-center gap-2 ${
        pending ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {pending ? 'Adding...' : <><Plus size={18} /> Add Item</>}
    </button>
  )
}

// The Main Smart Form
export default function AddItemForm({ 
  saleId, 
  variants 
}: { 
  saleId: string, 
  variants: any[] 
}) {
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [priceTier, setPriceTier] = useState<"standard" | "online" | "proposal">("standard")

  // Find the full details of the selected item
  const selectedItem = useMemo(() => 
    variants.find(v => v.id === selectedVariantId), 
  [selectedVariantId, variants])

  // Calculate the price based on the selected tier
  const activePrice = useMemo(() => {
    if (!selectedItem) return 0
    if (priceTier === 'online') return selectedItem.price_online || selectedItem.price_myr
    if (priceTier === 'proposal') return selectedItem.price_proposal || selectedItem.price_myr
    return selectedItem.price_myr // Default/Standard
  }, [selectedItem, priceTier])

  return (
    <form action={addItemToSale} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-6 rounded-lg shadow border border-gray-200">
      <input type="hidden" name="sale_id" value={saleId} />
      
      {/* 1. PRODUCT SELECT */}
      <div className="md:col-span-5">
        <label className="block text-xs font-medium text-gray-500 mb-1">Select Product</label>
        <select 
          name="variant_id" 
          required 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border"
          onChange={(e) => setSelectedVariantId(e.target.value)}
          value={selectedVariantId}
        >
          <option value="">-- Choose Item --</option>
          {variants?.map((v: any) => (
            <option key={v.id} value={v.id}>
               [{v.item_code}] {v.products?.name} - {v.name} (Stock: {v.stock_quantity})
            </option>
          ))}
        </select>
      </div>

      {/* 2. PRICE TIER SELECT (The New Feature) */}
      <div className="md:col-span-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">Price Level</label>
        <select 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border bg-gray-50"
          value={priceTier}
          onChange={(e) => setPriceTier(e.target.value as any)}
          disabled={!selectedItem} // Disable if no product picked
        >
          <option value="standard">Walk-in / Standard</option>
          <option value="online">Online (Shopee/Lazada)</option>
          <option value="proposal">Workshop / Proposal</option>
        </select>
      </div>

      {/* 3. QUANTITY */}
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
        <input 
          name="quantity" 
          type="number" 
          min="1" 
          defaultValue="1" 
          required 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border" 
        />
      </div>

      {/* 4. FINAL PRICE (Auto-Filled) */}
      <div className="md:col-span-2 relative">
        <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price (RM)</label>
        <input 
          name="unit_price" 
          type="number" 
          step="0.01" 
          min="0" 
          required 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border bg-gray-100 font-bold text-blue-700" 
          value={activePrice}
          readOnly // User cannot type manually (Safety)
        />
      </div>

      {/* 5. SUBMIT */}
      <div className="md:col-span-12 mt-2">
        <SubmitButton />
      </div>
    </form>
  )
}