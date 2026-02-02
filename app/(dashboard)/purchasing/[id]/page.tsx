import Link from 'next/link'
import { ArrowLeft, Trash2, CheckCircle, AlertCircle, Printer, Plus, Truck } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { removeItemFromPurchase, completePurchase } from '../actions'
import { notFound, redirect } from 'next/navigation'
import AddPurchaseItemForm from './add-item-form'
import { createGRNFromPO } from '../../inventory/grn/actions'

export default async function PurchaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  // 1. Fetch Purchase Header
  const { data: purchase } = await supabase
    .from('purchases')
    .select(`*, suppliers(name, currency)`)
    .eq('id', id)
    .single()

  if (!purchase) return notFound()

  // 2. Fetch Items
  const { data: items } = await supabase
    .from('purchase_items')
    .select(`
      *,
      variants (
        part_number,
        name,
        item_code,
        products (name)
      )
    `)
    .eq('purchase_id', id)
    .order('created_at', { ascending: true })

  // 3. Fetch All Variants
  const { data: allVariants } = await supabase
    .from('variants')
    .select(`id, item_code, part_number, name, cost_usd, cost_rm, products (name, brands(name))`)
    .order('item_code')

  const isPending = purchase.status === 'Pending'
  const isOrdered = purchase.status === 'Ordered'

  // Server Action to trigger GRN
  async function generateGRN() {
    'use server'
    const grnId = await createGRNFromPO(id)
    redirect(`/inventory/grn/${grnId}`)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchasing" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{purchase.reference_no}</h1>
            <p className="text-sm text-gray-500">
              Supplier: <span className="font-semibold">{purchase.suppliers?.name}</span> | Date: {purchase.purchase_date}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <Link 
              href={`/print/purchase/${purchase.id}`} 
              target="_blank"
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            >
              <Printer size={14} /> Print PO
            </Link>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isOrdered ? 'bg-blue-100 text-blue-800' : isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {purchase.status}
            </span>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">{error}</div>}

      {/* Item List */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              {isPending && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items?.map((item: any) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {Array.isArray(item.variants?.products) ? item.variants?.products[0]?.name : item.variants?.products?.name}
                  </div>
                  <div className="text-xs text-gray-500">{item.variants?.name}</div>
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">{item.unit_cost.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{item.total_cost.toFixed(2)}</td>
                {isPending && (
                  <td className="px-6 py-4 text-right">
                    <form action={removeItemFromPurchase}>
                      <input type="hidden" name="item_id" value={item.id} />
                      <input type="hidden" name="purchase_id" value={purchase.id} />
                      <button className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td colSpan={3} className="px-6 py-4 text-right">Grand Total:</td>
              <td className="px-6 py-4 text-right text-blue-800">{purchase.currency} {purchase.total_amount?.toFixed(2)}</td>
              {isPending && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      {isPending ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"><Plus size={18} /> Add Item</h3>
            <AddPurchaseItemForm purchaseId={purchase.id} currency={purchase.currency} variants={allVariants || []} />
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow border border-blue-200 text-center">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Confirm Order</h3>
            <p className="text-sm text-blue-700 mb-4">Send to Supplier. No stock added yet.</p>
            <form action={completePurchase}><input type="hidden" name="purchase_id" value={purchase.id} />
               <button disabled={!items || items.length === 0} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-500 disabled:opacity-50">
                 <CheckCircle size={20} /> Confirm Order
               </button>
            </form>
          </div>
        </div>
      ) : isOrdered ? (
        <div className="bg-green-50 p-8 rounded-lg border border-green-200 text-center">
            <h3 className="text-xl font-bold text-green-900 mb-2">Order Sent to Supplier</h3>
            <p className="text-green-700 mb-6">When goods arrive, generate a GRN to add them to stock.</p>
            <form action={generateGRN}>
                <button className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-500 mx-auto font-bold shadow-lg">
                    <Truck size={20} /> Receive Goods (Create GRN)
                </button>
            </form>
        </div>
      ) : (
        <div className="p-6 bg-gray-50 text-center rounded-lg border border-gray-200 text-gray-500">
            This order has been received and closed.
        </div>
      )}
    </div>
  )
}