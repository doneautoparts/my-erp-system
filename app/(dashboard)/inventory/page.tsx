import { Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import InventoryTable from './inventory-table'
import NewItemButton from './new-item-button' // Import dynamic button

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string, brand?: string }>
}) {
  const supabase = await createClient()
  const { q, brand } = await searchParams
  const query = q || ''
  const activeBrand = brand || 'ALL'

  // 1. Fetch Unique Brands for Tabs
  const { data: brandsData } = await supabase
    .from('brands')
    .select('name')
    .order('name')
  
  const brands = brandsData?.map(b => b.name) || []

  // 2. Build Inventory Query
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
    .order('item_code', { ascending: true })

  // Apply Search Filter
  if (query) {
    request = request.or(`item_code.ilike.%${query}%,sku.ilike.%${query}%,part_number.ilike.%${query}%`)
  }

  // Apply Brand Filter (Database side filter)
  if (activeBrand !== 'ALL') {
     request = request.ilike('search_text', `%${activeBrand}%`)
  }

  const { data: variants, error } = await request

  // Double check brand filter in memory (Safety net)
  const filteredVariants = activeBrand === 'ALL' 
    ? variants 
    : variants?.filter((v: any) => v.products?.brands?.name === activeBrand)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        
        {/* Dynamic Add Button */}
        <NewItemButton />
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <form>
           {/* Keep current brand when searching */}
           {activeBrand !== 'ALL' && <input type="hidden" name="brand" value={activeBrand} />}
           <input
            name="q"
            defaultValue={query}
            placeholder="Search Code, SKU or Model..."
            className="w-full rounded-md border-0 py-2.5 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
        </form>
      </div>

      {/* The Smart Table Component */}
      <InventoryTable 
        variants={filteredVariants || []} 
        brands={brands} 
      />
    </div>
  )
}