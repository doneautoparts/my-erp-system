import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { updateItem } from '../actions'
import { SubmitButton } from '../new/submit-button'
import { notFound } from 'next/navigation'

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  // Fetch the existing item
  const { data: item } = await supabase
    .from('variants')
    .select(`
      *,
      products (
        id,
        name,
        category,
        brands (name)
      )
    `)
    .eq('id', id)
    .single()

  if (!item) {
    return notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/inventory"
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
            <p className="text-sm text-gray-500">Brand: {item.products?.brands?.name}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form action={updateItem} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        {/* HIDDEN IDs */}
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="product_id" value={item.products?.id} />

        {/* Section 1: Product Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">1. Product Identity</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Brand</label>
              <input
                disabled
                defaultValue={item.products?.brands?.name}
                className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-100 p-2 text-gray-500 cursor-not-allowed"
                title="To change brand, delete and recreate item"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                name="category"
                required
                defaultValue={item.products?.category}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="Shock Absorber">Shock Absorber</option>
                <option value="Coil Spring">Coil Spring</option>
                <option value="Brake Pad">Brake Pad</option>
                <option value="Engine Oil">Engine Oil</option>
                <option value="Filter">Filter</option>
                <option value="Spare Part">Other Spare Part</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name *</label>
            <input
              name="product_name"
              required
              defaultValue={item.products?.name}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section 2: Variant Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">2. Specifications</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <input
                name="position"
                defaultValue={item.position || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type/Variant</label>
              <input
                name="type"
                defaultValue={item.type || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Part Number / SKU *</label>
            <input
              name="part_number"
              required
              defaultValue={item.part_number}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Section 3: Value & Stock */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">3. Inventory Status</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Selling Price (MYR) *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                required
                defaultValue={item.price_myr}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Stock *</label>
              <input
                name="stock"
                type="number"
                required
                defaultValue={item.stock_quantity}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Low Stock Alert *</label>
              <input
                name="min_stock"
                type="number"
                required
                defaultValue={item.min_stock_level}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <SubmitButton />
        </div>

      </form>
    </div>
  )
}