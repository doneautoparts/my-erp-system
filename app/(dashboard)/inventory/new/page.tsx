import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createItem } from '../actions'

export default function NewItemPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/inventory"
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Inventory Item</h1>
      </div>

      {searchParams.error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
          {searchParams.error}
        </div>
      )}

      <form action={createItem} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        
        {/* Section 1: Product Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">1. Product Identity</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Brand</label>
              <input
                name="brand"
                required
                placeholder="e.g. KYB, Proton, Shell"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                required
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
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              name="product_name"
              required
              placeholder="e.g. Wira Shock Absorber"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section 2: Variant Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">2. Specifications</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Position (Optional)</label>
              <input
                name="position"
                placeholder="e.g. Front LH"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type/Variant (Optional)</label>
              <input
                name="type"
                placeholder="e.g. Heavy Duty, 5W-40"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Part Number / SKU</label>
            <input
              name="part_number"
              required
              placeholder="e.g. 341144-KYB"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Section 3: Value & Stock */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">3. Inventory Status</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Selling Price (MYR)</label>
              <input
                name="price"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Stock</label>
              <input
                name="stock"
                type="number"
                defaultValue="0"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Low Stock Alert</label>
              <input
                name="min_stock"
                type="number"
                defaultValue="5"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Save size={18} />
            Save Item
          </button>
        </div>

      </form>
    </div>
  )
}