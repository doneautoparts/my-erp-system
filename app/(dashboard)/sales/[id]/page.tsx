import Link from 'next/link'
import { ArrowLeft, Trash2, CheckCircle, Plus, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { addItemToSale, removeItemFromSale, completeSale } from '../actions'
import { notFound } from 'next/navigation'

export default async function SaleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  // 1. Fetch Sale Header
  const { data: sale } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single()

  if (!sale) return notFound()

  // 2. Fetch Sale Items
  const { data: items } = await supabase
    .from('sale_items')
    .select(`
      *,
      variants (
        part_number,
        name,
        stock_quantity,
        products (name)
      )
    `)
    .eq('sale_id', id)
    .order('created_at', { ascending: true })

  // 3. Fetch Available Variants
  const { data: allVariants } = await supabase
    .from('variants')
    .select(`
      id,
      part_number,
      name,
      stock_quantity,
      price_myr,
      products (name, brands(name))
    `)
    .gt('stock_quantity', 0) // Only show items with stock!
    .order('part_number')

  const isCompleted = sale.status === 'Completed'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sales" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
                {sale.customer_name ? `${sale.customer_name}` : 'Sales Order'}
            </h1>
            <p className="text-sm text-gray-500">
              {sale.channel} | Ref: {sale.reference_no || '-'} | Date: {sale.sale_date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {sale.status}
            </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Item List */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price (MYR)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              {!isCompleted && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items?.map((item: any) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                   <div className="text-sm font-medium text-gray-900">
                    {/* Safe Access */}
                    {Array.isArray(item.variants?.products) 
                      ? item.variants?.products[0]?.name
                      : item.variants?.products?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.variants?.name} ({item.variants?.part_number})
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{item.unit_price.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{item.subtotal.toFixed(2)}</td>
                {!isCompleted && (
                  <td className="px-6 py-4 text-right">
                    <form action={removeItemFromSale}>
                      <input type="hidden" name="item_id" value={item.id} />
                      <input type="hidden" name="sale_id" value={sale.id} />
                      <button className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td colSpan={3} className="px-6 py-4 text-right">Grand Total:</td>
              <td className="px-6 py-4 text-right text-blue-800">MYR {sale.total_amount?.toFixed(2)}</td>
              {!isCompleted && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions Area */}
      {!isCompleted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add Item Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Plus size={18} /> Sell Item
            </h3>
            <form action={addItemToSale} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <input type="hidden" name="sale_id" value={sale.id} />
              
              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Product (Only In-Stock)</label>
                <select name="variant_id" required className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border">
                  <option value="">Select Product...</option>
                  {allVariants?.map((v: any) => (
                    <option key={v.id} value={v.id}>
                       [{v.part_number}] {' '}
                       {Array.isArray(v.products) ? v.products[0]?.brands?.name : v.products?.brands?.name} {' '}
                       {Array.isArray(v.products) ? v.products[0]?.name : v.products?.name} 
                       {' '} ({v.stock_quantity} left)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                <input name="quantity" type="number" min="1" defaultValue="1" required className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Price (MYR)</label>
                <input 
                  name="unit_price" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  required 
                  className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border" 
                  placeholder="Price"
                />
              </div>

              <div className="md:col-span-2">
                <button className="w-full bg-blue-600 text-white p-2 rounded-md text-sm hover:bg-blue-500">Add</button>
              </div>
            </form>
          </div>

          {/* Completion Box */}
          <div className="bg-green-50 p-6 rounded-lg shadow border border-green-200 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-medium text-green-900 mb-2">Complete Sale</h3>
            <p className="text-sm text-green-700 mb-4">
              Review the total. Stock is already deducted. Click below to lock this order.
            </p>
            <form action={completeSale} className="w-full">
               <input type="hidden" name="sale_id" value={sale.id} />
               <button 
                 disabled={!items || items.length === 0}
                 className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <CheckCircle size={20} />
                 Mark Completed
               </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-gray-50 text-center rounded-lg border border-gray-200">
            <p className="text-gray-500">Sale finalized.</p>
        </div>
      )}
    </div>
  )
}