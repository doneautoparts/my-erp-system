import Link from 'next/link'
import { ArrowLeft, CheckCircle, PackageCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { updateGrnItem, confirmGRN } from '../actions'
import { notFound } from 'next/navigation'

export default async function GRNDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: grn } = await supabase
    .from('grn')
    .select(`*, purchases(reference_no, suppliers(name))`)
    .eq('id', id)
    .single()

  if (!grn) return notFound()

  const { data: items } = await supabase
    .from('grn_items')
    .select(`*, variants(name, item_code, part_number)`)
    .eq('grn_id', id)
    .order('variant_id')

  const isCompleted = grn.status === 'Completed'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory" className="p-2 rounded-full hover:bg-gray-200">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{grn.grn_no}</h1>
            <p className="text-sm text-gray-500">
              PO Ref: {grn.purchases?.reference_no} | Supplier: {grn.purchases?.suppliers?.name}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {grn.status}
        </span>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ordered</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Received (Editable)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items?.map((item: any) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{item.variants?.item_code}</div>
                  <div className="text-sm text-gray-500">{item.variants?.name}</div>
                </td>
                <td className="px-6 py-4 text-center text-gray-500">{item.order_qty}</td>
                <td className="px-6 py-4 text-center">
                  {isCompleted ? (
                    <span className="font-bold text-green-700">{item.received_qty}</span>
                  ) : (
                    <form action={updateGrnItem} className="flex justify-center">
                        <input type="hidden" name="item_id" value={item.id} />
                        <input type="hidden" name="grn_id" value={grn.id} />
                        <input 
                            name="received_qty" 
                            type="number" 
                            defaultValue={item.received_qty} 
                            className="w-20 text-center border-gray-300 rounded-md p-1"
                        />
                        <button className="ml-2 text-xs text-blue-600 hover:underline">Save</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isCompleted && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
            <h3 className="text-lg font-bold text-green-900 mb-2">Verify & Receive Stock</h3>
            <p className="text-sm text-green-700 mb-4">
                This will update your inventory levels based on the "Received" quantity.
            </p>
            <form action={confirmGRN}>
               <input type="hidden" name="grn_id" value={grn.id} />
               <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-500 mx-auto">
                 <PackageCheck size={20} /> Confirm Receipt
               </button>
            </form>
        </div>
      )}
    </div>
  )
}