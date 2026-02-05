'use client'

import { useState } from 'react'
import { Pencil, Save, X, Loader2, FilePenLine, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { quickUpdateVariant, deleteItem } from './actions'
import Link from 'next/link'

export default function InventoryTable({ 
  variants, 
  brands 
}: { 
  variants: any[], 
  brands: string[] 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeBrand = searchParams.get('brand') || 'ALL'
  
  // LOGIC: If tab is 'ALL', editing is disabled
  const isReadOnly = activeBrand === 'ALL'
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Navigate to different tabs
  const handleTabChange = (brand: string) => {
    const params = new URLSearchParams(searchParams)
    if (brand === 'ALL') params.delete('brand')
    else params.set('brand', brand)
    router.push(`/inventory?${params.toString()}`)
  }

  const handleDelete = async (formData: FormData) => {
    if(!confirm("Are you sure you want to delete this item?")) return
    
    try {
      await deleteItem(formData)
    } catch (err) {
      alert("Failed to delete item")
    }
  }

  // --- ROW COMPONENT (Internal) ---
  const EditableRow = ({ item }: { item: any }) => {
    const isEditing = editingId === item.id

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setIsSaving(true)
      const formData = new FormData(e.currentTarget)
      formData.append('id', item.id)
      
      try {
        await quickUpdateVariant(formData)
        setEditingId(null)
      } catch (err) {
        alert("Failed to save")
      } finally {
        setIsSaving(false)
      }
    }

    if (isEditing) {
      return (
        <tr className="bg-blue-50">
          <td colSpan={9} className="p-2">
            <form onSubmit={handleSave} className="flex flex-wrap gap-2 items-end">
              <div className="w-24">
                <label className="text-[10px] text-gray-500 font-bold">Item Code</label>
                <input name="item_code" defaultValue={item.item_code} className="w-full border rounded p-1 text-xs" />
              </div>
              <div className="flex-1 min-w-[200px]">
                 <div className="font-bold text-sm text-gray-700">{item.products?.name}</div>
                 <div className="text-xs text-gray-500">{item.products?.brands?.name} - {item.name}</div>
              </div>
              
              <div className="w-20">
                <label className="text-[10px] text-gray-500 font-bold">USD Cost</label>
                <input name="cost_usd" type="number" step="0.01" defaultValue={item.cost_usd} className="w-full border rounded p-1 text-xs" />
              </div>
              <div className="w-20">
                <label className="text-[10px] text-gray-500 font-bold">RM Cost</label>
                <input name="cost_rm" type="number" step="0.01" defaultValue={item.cost_rm} className="w-full border rounded p-1 text-xs" />
              </div>
              
              <div className="w-20">
                <label className="text-[10px] text-blue-600 font-bold">SELL</label>
                <input name="price_sell" type="number" step="0.01" defaultValue={item.price_myr} className="w-full border border-blue-300 rounded p-1 text-xs font-bold" />
              </div>
              <div className="w-20">
                <label className="text-[10px] text-gray-500 font-bold">ONLINE</label>
                <input name="price_online" type="number" step="0.01" defaultValue={item.price_online} className="w-full border rounded p-1 text-xs" />
              </div>
              <div className="w-20">
                <label className="text-[10px] text-gray-500 font-bold">PROP</label>
                <input name="price_proposal" type="number" step="0.01" defaultValue={item.price_proposal} className="w-full border rounded p-1 text-xs" />
              </div>

              <div className="w-16">
                <label className="text-[10px] text-gray-500 font-bold">Stock</label>
                <input name="stock" type="number" defaultValue={item.stock_quantity} className="w-full border rounded p-1 text-xs" />
              </div>
              <div className="w-12">
                <label className="text-[10px] text-gray-500 font-bold">Ratio</label>
                <input name="packing_ratio" type="number" defaultValue={item.packing_ratio} className="w-full border rounded p-1 text-xs" />
              </div>

              <div className="flex gap-1 pb-0.5">
                <button type="submit" disabled={isSaving} className="bg-green-600 text-white p-1.5 rounded hover:bg-green-500">
                    {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="bg-gray-400 text-white p-1.5 rounded hover:bg-gray-500">
                    <X size={16} />
                </button>
              </div>
            </form>
          </td>
        </tr>
      )
    }

    // --- VIEW MODE ---
    return (
      <tr className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
        <td className="px-4 py-3 whitespace-nowrap">
           <div className="font-bold text-blue-900">{item.item_code || '-'}</div>
           <div className="text-[10px] text-gray-400 font-mono">{item.part_number}</div>
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900 text-sm">{item.products?.name}</div>
          <div className="text-xs text-gray-500">{item.name}</div>
        </td>
        <td className="px-4 py-3 text-right text-xs text-gray-400">{item.cost_usd > 0 ? `$${item.cost_usd}` : '-'}</td>
        <td className="px-4 py-3 text-right text-xs text-gray-400">{item.cost_rm > 0 ? `RM ${item.cost_rm}` : '-'}</td>
        
        <td className="px-4 py-3 text-right text-sm font-bold text-blue-700">{item.price_myr?.toFixed(2)}</td>
        <td className="px-4 py-3 text-right text-xs text-gray-600">{item.price_online?.toFixed(2) || '-'}</td>
        <td className="px-4 py-3 text-right text-xs text-gray-600">{item.price_proposal?.toFixed(2) || '-'}</td>
        
        <td className="px-4 py-3 text-center">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.stock_quantity <= item.min_stock_level ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {item.stock_quantity}
            </span>
            <div className="text-[9px] text-gray-400 mt-0.5">Ratio: {item.packing_ratio}</div>
        </td>
        
        {/* ACTIONS COLUMN (Only visible if not read-only) */}
        {!isReadOnly && (
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                    {/* 1. Quick Edit */}
                    <button onClick={() => setEditingId(item.id)} className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50" title="Quick Edit">
                        <Pencil size={16} />
                    </button>
                    {/* 2. Full Edit */}
                    <Link href={`/inventory/${item.id}`} className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-50" title="Full Details">
                        <FilePenLine size={16} />
                    </Link>
                    {/* 3. Delete */}
                    <form action={handleDelete}>
                        <input type="hidden" name="id" value={item.id} />
                        <button className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50" title="Delete Item">
                            <Trash2 size={16} />
                        </button>
                    </form>
                </div>
            </td>
        )}
      </tr>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* --- TABS --- */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-gray-200">
        <button
            onClick={() => handleTabChange('ALL')}
            className={`px-4 py-2 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors ${activeBrand === 'ALL' ? 'bg-white border-x border-t border-gray-200 text-blue-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
        >
            All Parts
        </button>
        {brands.map(brand => (
            <button
                key={brand}
                onClick={() => handleTabChange(brand)}
                className={`px-4 py-2 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors ${activeBrand === brand ? 'bg-white border-x border-t border-gray-200 text-blue-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
                {brand}
            </button>
        ))}
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Product Description</th>
                        <th className="px-4 py-3 text-right">Cost (USD)</th>
                        <th className="px-4 py-3 text-right">Cost (RM)</th>
                        <th className="px-4 py-3 text-right">Sell</th>
                        <th className="px-4 py-3 text-right">Online</th>
                        <th className="px-4 py-3 text-right">Prop</th>
                        <th className="px-4 py-3 text-center">Stock</th>
                        {/* Only show Edit Column Header if not read-only */}
                        {!isReadOnly && <th className="px-4 py-3 text-center">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {variants.map(item => (
                        <EditableRow key={item.id} item={item} />
                    ))}
                    {variants.length === 0 && (
                        <tr>
                            <td colSpan={isReadOnly ? 8 : 9} className="px-4 py-12 text-center text-gray-500">
                                {isReadOnly ? "No items found." : "No items found for this brand."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}