import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PrintAction from '../../print-button'

export default async function PrintGRN({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch GRN + PO + Supplier + COMPANY (Deep Fetch)
  const { data: grn } = await supabase
    .from('grn')
    .select(`
      *, 
      purchases (
        reference_no, 
        suppliers (name, address, contact_person, phone),
        companies (*) 
      )
    `)
    .eq('id', id)
    .single()

  if (!grn) return notFound()

  // 2. Fetch Items
  const { data: items } = await supabase
    .from('grn_items')
    .select(`*, variants(name, item_code, part_number)`)
    .eq('grn_id', id)
    .order('variant_id')

  // Use the Company that issued the PO
  const myCompany = grn.purchases?.companies || {
    name: "Warehouse",
    address: "",
    phone: ""
  }

  return (
    <div className="max-w-3xl mx-auto border border-gray-200 p-8 print:border-0 print:p-0">
      <PrintAction />

      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide">Goods Received Note</h1>
          <div className="mt-2 text-sm text-gray-500 whitespace-pre-line">
             <p className="font-bold text-gray-900">{myCompany.name}</p>
             {myCompany.address}
             <p>Tel: {myCompany.phone}</p>
             {myCompany.tin_number && <p>TIN: {myCompany.tin_number}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-mono font-bold text-gray-700">{grn.grn_no}</h2>
          <p className="text-sm text-gray-500 mt-1">Received Date: {grn.received_date}</p>
          <p className="text-sm text-gray-500">PO Ref: <span className="font-bold">{grn.purchases?.reference_no}</span></p>
        </div>
      </div>

      {/* Rest of the file remains the same... (Supplier Info, Table, Footer) */}
      {/* ... */}
      
      {/* Supplier Info */}
      <div className="mb-8 p-4 bg-gray-50 rounded-md border border-gray-100 print:bg-white print:border-gray-300">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Supplier Details</h3>
        <p className="font-bold text-lg">{grn.purchases?.suppliers?.name}</p>
        <p className="text-sm text-gray-600 whitespace-pre-line">{grn.purchases?.suppliers?.address}</p>
        <div className="mt-2 text-sm text-gray-500">
            <span>Contact: {grn.purchases?.suppliers?.contact_person}</span>
            <span className="mx-2">|</span>
            <span>{grn.purchases?.suppliers?.phone}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-12">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 text-sm font-bold uppercase">Item Code</th>
            <th className="text-left py-2 text-sm font-bold uppercase">Description</th>
            <th className="text-center py-2 text-sm font-bold uppercase">Ordered</th>
            <th className="text-center py-2 text-sm font-bold uppercase">Received</th>
            <th className="text-center py-2 text-sm font-bold uppercase">Variance</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item: any) => {
            const variance = item.received_qty - item.order_qty
            return (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 text-sm font-mono">{item.variants?.item_code}</td>
                <td className="py-3 text-sm">
                  <span className="block font-bold">{item.variants?.name}</span>
                  <span className="text-xs text-gray-500">{item.variants?.part_number}</span>
                </td>
                <td className="text-center py-3 text-sm">{item.order_qty}</td>
                <td className="text-center py-3 text-sm font-bold">{item.received_qty}</td>
                <td className={`text-center py-3 text-sm font-bold ${variance < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {variance === 0 ? '-' : variance}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-gray-200 break-inside-avoid">
        <div>
            <p className="text-xs uppercase font-bold text-gray-400 mb-12">Received & Verified By:</p>
            <div className="border-t border-black w-3/4"></div>
            <p className="text-sm mt-1">Storekeeper</p>
        </div>
        <div>
            <p className="text-xs uppercase font-bold text-gray-400 mb-12">Authorized By:</p>
            <div className="border-t border-black w-3/4"></div>
            <p className="text-sm mt-1">Manager</p>
        </div>
      </div>
    </div>
  )
}