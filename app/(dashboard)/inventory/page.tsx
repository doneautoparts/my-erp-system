import Link from 'next/link'
import { Plus, Search, Pencil } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const { q } = await searchParams
  const query = q || ''

  // Fetch variants joined with products and brands
  let request = supabase
    .from('variants')
    .select(`
      *,
      products (
        name,
        category,
        brands (name)
      )
    `)
    .order('created_at', { ascending: false })

  // NEW: Search the "search_text" column which contains Brand + Model + Code
  if (query) {
    request = request.ilike('search_text', `%${query}%`)
  }

  const { data: variants, error } = await request

  if (error) {
    console.error('Error fetching inventory:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <Link
          href="/inventory/new"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus size={16} />
          Add New Item
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <form>
           <input
            name="q"
            defaultValue={query}
            placeholder="Search Model (Wira), Brand (Proride), Code..."
            className="w-full rounded-md border-0 py-2.5 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600"
          />
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos / Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sell (RM)</th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {variants?.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="font-bold text-blue-900">{item.item_code || '-'}</div>
                   <div className="text-xs text-gray-500 font-mono">{item.part_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{item.products?.name}</div>
                  <div className="text-xs text-gray-500">{item.products?.brands?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{item.position || '-'}</div>
                  <div className="text-xs text-gray-400">{item.type || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    item.stock_quantity <= item.min_stock_level 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.stock_quantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {item.price_myr?.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/inventory/${item.id}`} className="text-gray-400 hover:text-blue-600">
                    <Pencil size={18} />
                  </Link>
                </td>
              </tr>
            ))}
            {variants?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {query ? `No items matching "${query}"` : 'No items found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}