import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import PrintAction from '../../print-button'

export default async function PrintInvoice({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch Sale + Customer + LINKED COMPANY
  const { data: sale } = await supabase
    .from('sales')
    .select(`*, customers(*), companies(*)`)
    .eq('id', id)
    .single()

  if (!sale) return notFound()

  // Use Linked Company
  const myCompany = sale.companies || {
    name: "Unknown Company",
    address: "",
    phone: ""
  }

  const { data: items } = await supabase
    .from('sale_items')
    .select(`*, variants(products(name, brands(name)), name, part_number)`)
    .eq('sale_id', id)

  return (
    <div className="max-w-3xl mx-auto border border-gray-200 p-8 print:border-0 print:p-0">
      <PrintAction />

      {/* FIXED HEADER LAYOUT (Matches PO/GRN) */}
      <div className="flex justify-between items-start mb-8 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide">Sales Invoice</h1>
          <div className="mt-2 text-sm text-gray-500 whitespace-pre-line">
             <p className="font-bold text-gray-900">{myCompany.name}</p>
             {myCompany.address}
             <p>Tel: {myCompany.phone}</p>
             {myCompany.tin_number && <p className="font-mono text-xs mt-1">TIN: {myCompany.tin_number}</p>}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-mono font-bold text-gray-700">{sale.reference_no}</h2>
          <p className="text-sm text-gray-500 mt-1">Date: {sale.sale_date}</p>
          <p className="text-sm text-gray-500">Status: <span className="uppercase">{sale.status}</span></p>
          {sale.customer_po && (
             <p className="text-sm font-bold text-blue-600 mt-2">PO: {sale.customer_po}</p>
          )}
        </div>
      </div>

      {/* Bill To Info */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</h3>
        <div className="text-sm">
           {sale.customers ? (
             <>
                <p className="font-bold text-lg text-gray-900">{sale.customers.name}</p>
                {sale.customers.company_name && <p className="text-gray-700">{sale.customers.company_name}</p>}
                <p className="text-gray-600 whitespace-pre-line">{sale.customers.address}</p>
                {sale.customers.tin_number && <p className="text-xs font-mono mt-1">TIN: {sale.customers.tin_number}</p>}
             </>
           ) : (
             <>
                <p className="font-bold text-lg">{sale.customer_name || 'Walk-in Customer'}</p>
                <p className="text-gray-600">{sale.channel}</p>
             </>
           )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2 text-sm font-bold uppercase">Description</th>
            <th className="text-right py-2 text-sm font-bold uppercase">Qty</th>
            <th className="text-right py-2 text-sm font-bold uppercase">Price</th>
            <th className="text-right py-2 text-sm font-bold uppercase">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-3 text-sm">
                <span className="block font-bold">
                   {Array.isArray(item.variants?.products) ? item.variants.products[0].name : item.variants?.products?.name}
                </span>
                <span className="text-xs text-gray-500">
                   {item.variants?.name}
                </span>
              </td>
              <td className="text-right py-3 text-sm">{item.quantity}</td>
              <td className="text-right py-3 text-sm">{item.unit_price.toFixed(2)}</td>
              <td className="text-right py-3 text-sm font-bold">{item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-1/2">
          <div className="flex justify-between py-2 border-t border-gray-800">
            <span className="font-bold text-lg">Total (MYR)</span>
            <span className="font-bold text-lg">{sale.total_amount?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200 text-xs text-center text-gray-400">
        <p>Thank you for your business!</p>
        <p>Goods sold are not returnable without original receipt.</p>
        <p>{myCompany.name} - Internal ERP System</p>
      </div>
    </div>
  )
}