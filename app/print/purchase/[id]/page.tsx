import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PrintAction from '../../print-button'

export default async function PrintPurchaseOrder({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch Purchase + Supplier + Company Details
  const { data: purchase } = await supabase
    .from('purchases')
    .select(`
      *, 
      suppliers(*),
      companies(*)
    `)
    .eq('id', id)
    .single()

  if (!purchase) return notFound()

  // Use the linked company, or fallback if something is wrong (shouldn't happen)
  const myCompany = purchase.companies || {
    name: "Unknown Company",
    address: "Please update company details",
    city: "",
    phone: "",
    email: ""
  }

  // Fetch Items
  const { data: items } = await supabase
    .from('purchase_items')
    .select(`*, variants(products(name, brands(name)), name, part_number)`)
    .eq('purchase_id', id)

  return (
    <div className="max-w-3xl mx-auto border border-gray-200 p-8 print:border-0 print:p-0">
      <PrintAction />

      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide">Purchase Order</h1>
          <div className="mt-2 text-sm text-gray-500">
             <p className="font-bold text-gray-900">{myCompany.name}</p>
             <p className="whitespace-pre-line">{myCompany.address}</p>
             <p>{myCompany.city}</p>
             <p>Tel: {myCompany.phone}</p>
             <p>{myCompany.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-mono font-bold text-gray-700">{purchase.reference_no}</h2>
          <p className="text-sm text-gray-500 mt-1">Date: {purchase.purchase_date}</p>
          <p className="text-sm text-gray-500">Status: <span className="uppercase">{purchase.status}</span></p>
        </div>
      </div>

      {/* Supplier Info */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vendor / Supplier</h3>
        <div className="text-sm text-gray-700">
          <p className="font-bold text-lg text-gray-900">{purchase.suppliers?.name}</p>
          
          {/* ADDRESS SECTION */}
          {purchase.suppliers?.address && (
            <p className="whitespace-pre-line mb-2 text-gray-600">{purchase.suppliers.address}</p>
          )}
          
          <div className="mt-2">
            <p><span className="font-semibold">Attn:</span> {purchase.suppliers?.contact_person}</p>
            <p>{purchase.suppliers?.email}</p>
            <p>{purchase.suppliers?.phone}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2 text-sm font-bold uppercase">Item / Description</th>
            <th className="text-right py-2 text-sm font-bold uppercase">Qty</th>
            <th className="text-right py-2 text-sm font-bold uppercase">Unit Cost</th>
            <th className="text-right py-2 text-sm font-bold uppercase">Total</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-3 text-sm">
                <span className="font-bold block">
                   {Array.isArray(item.variants?.products) ? item.variants.products[0].name : item.variants?.products?.name}
                </span>
                <span className="text-xs text-gray-500">
                  {item.variants?.name} | SKU: {item.variants?.part_number}
                </span>
              </td>
              <td className="text-right py-3 text-sm">{item.quantity}</td>
              <td className="text-right py-3 text-sm">{item.unit_cost.toFixed(2)}</td>
              <td className="text-right py-3 text-sm font-bold">{item.total_cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-1/2">
          <div className="flex justify-between py-2 border-t border-gray-800">
            <span className="font-bold text-lg">Grand Total</span>
            <span className="font-bold text-lg">{purchase.currency} {purchase.total_amount?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-xs text-center text-gray-400">
        <p>This is a computer-generated document. No signature is required.</p>
        <p>{myCompany.name} - ERP System Management</p>
      </div>
    </div>
  )
}