'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { addItemToPurchase } from '../actions'
import { useFormStatus } from 'react-dom'

// Helper Button
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
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")

  // 1. Extract Unique Brands (Sorted A-Z)
  const brands = useMemo(() => {
    const uniqueBrands = new Set(variants.map(v => 
      Array.isArray(v.products) ? v.products[0]?.brands?.name : v.products?.brands?.name
    ).filter(Boolean))
    return Array.from(uniqueBrands).sort()
  }, [variants])

  // 2. Filter Products based on Selected Brand (Sorted A-Z)
  const products = useMemo(() => {
    if (!selectedBrand) return []
    const filtered = variants.filter(v => {
      const brandName = Array.isArray(v.products) ? v.products[0]?.brands?.name : v.products?.brands?.name
      return brandName === selectedBrand
    })
    
    const uniqueProducts = new Set(filtered.map(v => 
      Array.isArray(v.products) ? v.products[0]?.name : v.products?.name
    ).filter(Boolean))
    
    return Array.from(uniqueProducts).sort()
  }, [variants, selectedBrand])

  // 3. Filter Items based on Selected Product (Sorted by Item Code)
  const filteredVariants = useMemo(() => {
    if (!selectedProduct) return []
    return variants
      .filter(v => {
        const brandName = Array.isArray(v.products) ? v.products[0]?.brands?.name : v.products?.brands?.name
        const productName = Array.isArray(v.products) ? v.products[0]?.name : v.products?.name
        return brandName === selectedBrand && productName === selectedProduct
      })
      .sort((a, b) => (a.item_code || '').localeCompare(b.item_code || ''))
  }, [variants, selectedBrand, selectedProduct])

  // 4. Auto-Select Cost Logic
  const activeCost = useMemo(() => {
    const item = variants.find(v => v.id === selectedVariantId)
    if (!item) return 0
    // If Purchase Currency is USD, use Cost USD. Otherwise Cost RM.
    return currency === 'USD' ? (item.cost_usd || 0) : (item.cost_rm || 0)
  }, [selectedVariantId, variants, currency])

  return (
    <form action={addItemToPurchase} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
      <input type="hidden" name="purchase_id" value={purchaseId} />
      
      {/* FILTER 1: BRAND */}
      <div className="md:col-span-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">1. Filter Brand</label>
        <select 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border"
          value={selectedBrand}
          onChange={(e) => {
            setSelectedBrand(e.target.value)
            setSelectedProduct("") // Reset lower filters
            setSelectedVariantId("")
          }}
        >
          <option value="">-- All Brands --</option>
          {brands.map((b: any) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* FILTER 2: MODEL/PRODUCT */}
      <div className="md:col-span-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">2. Filter Model</label>
        <select 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border"
          value={selectedProduct}
          onChange={(e) => {
            setSelectedProduct(e.target.value)
            setSelectedVariantId("") // Reset Item
          }}
          disabled={!selectedBrand}
        >
          <option value="">-- Select Model --</option>
          {products.map((p: any) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* FILTER 3: SPECIFIC ITEM */}
      <div className="md:col-span-6">
        <label className="block text-xs font-medium text-gray-500 mb-1">3. Select Item</label>
        <select 
          name="variant_id" 
          required 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border bg-blue-50"
          value={selectedVariantId}
          onChange={(e) => setSelectedVariantId(e.target.value)}
          disabled={!selectedProduct}
        >
          <option value="">-- Choose Item --</option>
          {filteredVariants.map((v: any) => (
            <option key={v.id} value={v.id}>
               [{v.item_code}] {v.name}
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
          key={activeCost} 
        />
      </div>

      <div className="md:col-span-2">
        <SubmitButton />
      </div>
    </form>
  )
}