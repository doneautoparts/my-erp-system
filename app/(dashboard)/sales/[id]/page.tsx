import Link from 'next/link'
import { ArrowLeft, Trash2, CheckCircle, AlertCircle, Printer } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { removeItemFromSale, completeSale } from '../actions'
import { notFound } from 'next/navigation'
import AddItemForm from './add-item-form' // Import the new component

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

  // 3. Fetch Available Variants (WITH ALL PRICES)
  const { data: allVariants } = await supabase
    .from('variants')
    .select(`
      id,
      item_code,
      part_number,
      name,
      stock_quantity,
      price_myr,       
      price_online,    
      price_proposal,  
      products (name, brands(name))
    `)
    .gt('stock_quantity', 0) // Only show items with stock
    .order('item_code', { ascending: true }) // Sort by Item Code (SAFST etc)

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
        
        {/* Actions & Status */}
        <div className="flex items-center gap-2">
            {/* PRINT BUTTON */}
            <Link 
              href={`/print/sales/${sale.id}`} 
              target="_blank"
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            >
              <Printer size={14} /> Print Invoice
            </Link>

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
          
          {/* NEW SMART ADD ITEM FORM */}
          <div className="lg:col-span-2">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Sell Item</h3>
             <AddItemForm saleId={sale.id} variants={allVariants || []} />
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