'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { addItemToPurchase } from '../actions'
import { useFormStatus } from 'react-dom'

// Helper Button for "Adding..." state
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

export default function AddPurchaseItemForm({ 
  purchaseId, 
  currency, 
  variants 
}: { 
  purchaseId: string, 
  currency: string, 
  variants: any[] 
}) {
  const [selectedVariantId, setSelectedVariantId] = useState("")

  // Auto-Select Cost Logic
  const activeCost = useMemo(() => {
    const item = variants.find(v => v.id === selectedVariantId)
    if (!item) return 0
    
    // If Purchase Currency is USD, use Cost USD. Otherwise Cost RM.
    return currency === 'USD' ? (item.cost_usd || 0) : (item.cost_rm || 0)
  }, [selectedVariantId, variants, currency])

  return (
    <form action={addItemToPurchase} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
      <input type="hidden" name="purchase_id" value={purchaseId} />
      
      <div className="md:col-span-6">
        <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
        <select 
          name="variant_id" 
          required 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border"
          onChange={(e) => setSelectedVariantId(e.target.value)}
          value={selectedVariantId}
        >
          <option value="">Select Product...</option>
          {variants?.map((v: any) => (
            <option key={v.id} value={v.id}>
               [{v.item_code}] {Array.isArray(v.products) ? v.products[0]?.name : v.products?.name} - {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">Qty (Boxes/Pcs)</label>
        <input name="quantity" type="number" min="1" defaultValue="1" required className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border" />
      </div>

      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">Cost ({currency})</label>
        <input 
          name="unit_cost" 
          type="number" 
          step="0.01" 
          min="0" 
          required 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border bg-gray-50 font-bold text-blue-800" 
          defaultValue={activeCost} 
          key={activeCost} // Force update input when cost changess
        />
      </div>

      <div className="md:col-span-2">
        <SubmitButton />
      </div>
    </form>
  )
}
