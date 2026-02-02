'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { addItemToSale } from '../actions'
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

export default function AddItemForm({ 
  saleId, 
  variants 
}: { 
  saleId: string, 
  variants: any[] 
}) {
  // Filter States
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  
  // Pricing State
  const [priceTier, setPriceTier] = useState<"standard" | "online" | "proposal">("standard")

  // 1. Extract Unique Brands (Sorted A-Z)
  const brands = useMemo(() => {
    const uniqueBrands = new Set(variants.map(v => 
      Array.isArray(v.products) ? v.products[0]?.brands?.name : v.products?.brands?.name
    ).filter(Boolean))
    return Array.from(uniqueBrands).sort()
  }, [variants])

  // 2. Filter Products based on Selected Brand
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

  // 4. Find Selected Item Details
  const selectedItem = useMemo(() => 
    variants.find(v => v.id === selectedVariantId), 
  [selectedVariantId, variants])

  // 5. Calculate Price based on Tier
  const activePrice = useMemo(() => {
    if (!selectedItem) return 0
    if (priceTier === 'online') return selectedItem.price_online || selectedItem.price_myr
    if (priceTier === 'proposal') return selectedItem.price_proposal || selectedItem.price_myr
    return selectedItem.price_myr // Default
  }, [selectedItem, priceTier])

  return (
    <form action={addItemToSale} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-6 rounded-lg shadow border border-gray-200">
      <input type="hidden" name="sale_id" value={saleId} />
      
      {/* ROW 1: FILTERS & PRICE TIER */}
      
      {/* Filter 1: Brand */}
      <div className="md:col-span-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">1. Filter Brand</label>
        <select 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border"
          value={selectedBrand}
          onChange={(e) => {
            setSelectedBrand(e.target.value)
            setSelectedProduct("")
            setSelectedVariantId("")
          }}
        >
          <option value="">-- All Brands --</option>
          {brands.map((b: any) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Filter 2: Model */}
      <div className="md:col-span-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">2. Filter Model</label>
        <select 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border"
          value={selectedProduct}
          onChange={(e) => {
            setSelectedProduct(e.target.value)
            setSelectedVariantId("")
          }}
          disabled={!selectedBrand}
        >
          <option value="">-- Select Model --</option>
          {products.map((p: any) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Price Tier */}
      <div className="md:col-span-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">Price Level</label>
        <select 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border bg-yellow-50"
          value={priceTier}
          onChange={(e) => setPriceTier(e.target.value as any)}
        >
          <option value="standard">Walk-in / Standard</option>
          <option value="online">Online (Shopee/Lazada)</option>
          <option value="proposal">Workshop / Proposal</option>
        </select>
      </div>

      {/* ROW 2: ITEM SELECTION & VALUES */}

      {/* Item Selection */}
      <div className="md:col-span-6">
        <label className="block text-xs font-medium text-gray-500 mb-1">3. Select Specific Item</label>
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
               [{v.item_code}] {v.name} (Qty: {v.stock_quantity})
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}
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

      {/* Price Display */}
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price (RM)</label>
        <input 
          name="unit_price" 
          type="number" 
          step="0.01" 
          min="0" 
          required 
          className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border bg-gray-100 font-bold text-blue-700" 
          value={activePrice}
          readOnly 
        />
      </div>

      {/* Submit */}
      <div className="md:col-span-2">
        <SubmitButton />
      </div>
    </form>
  )
}