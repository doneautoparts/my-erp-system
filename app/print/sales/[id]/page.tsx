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

  // Fetch Sale + Customer
  const { data: sale } = await supabase
    .from('sales')
    .select(`*, customers(*)`)
    .eq('id', id)
    .single()

  if (!sale) return notFound()

  const { data: items } = await supabase
    .from('sale_items')
    .select(`*, variants(products(name, brands(name)), name, part_number)`)
    .eq('sale_id', id)

  // Fetch My Company (Default to first one for now)
  const { data: myCompany } = await supabase
    .from('companies')
    .select('*')
    .limit(1)
    .single()

  return (
    <div className="max-w-3xl mx-auto border border-gray-200 p-8 print:border-0 print:p-0">
      <PrintAction />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">{myCompany?.name || 'My Company'}</h1>
        <p className="text-sm whitespace-pre-line">{myCompany?.address}</p>
        <p className="text-sm">Tel: {myCompany?.phone}</p>
        {myCompany?.tin_number && <p className="text-xs font-mono mt-1">TIN: {myCompany.tin_number}</p>}
      </div>

      <div className="flex justify-between items-center mb-6 border-y border-gray-300 py-4">
        <div>
           <p className="text-xs font-bold uppercase text-gray-500">Bill To</p>
           {sale.customers ? (
             <>
                <p className="font-bold text-lg">{sale.customers.name}</p>
                {sale.customers.company_name && <p className="text-sm text-gray-700">{sale.customers.company_name}</p>}
                <p className="text-sm text-gray-600 whitespace-pre-line">{sale.customers.address}</p>
                {sale.customers.tin_number && <p className="text-xs font-mono mt-1">TIN: {sale.customers.tin_number}</p>}
             </>
           ) : (
             <>
                <p className="font-bold text-lg">{sale.customer_name || 'Walk-in Customer'}</p>
                <p className="text-sm text-gray-600">{sale.channel}</p>
             </>
           )}
        </div>
        <div className="text-right">
           <h2 className="text-xl font-bold uppercase text-gray-800">INVOICE</h2>
           <p className="font-mono text-gray-600">#{sale.reference_no || sale.id.slice(0,8).toUpperCase()}</p>
           <p className="text-sm mt-1">{sale.sale_date}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-2 text-sm font-bold uppercase">Description</th>
            <th className="text-right py-2 text-sm font-bold uppercase">Qty</th>
            <th className="text-right py-2 text-sm font-bold uppercase">Price</th>
            <th className="text-right py-2 text-sm font-bold uppercase">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item: any) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2 text-sm">
                <span className="block">
                   {Array.isArray(item.variants?.products) ? item.variants.products[0].name : item.variants?.products?.name}
                   {' '} ({item.variants?.name})
                </span>
              </td>
              <td className="text-right py-2 text-sm">{item.quantity}</td>
              <td className="text-right py-2 text-sm">{item.unit_price.toFixed(2)}</td>
              <td className="text-right py-2 text-sm font-bold">{item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-1/2">
          <div className="flex justify-between py-2 border-t-2 border-black">
            <span className="font-bold text-lg">Total (MYR)</span>
            <span className="font-bold text-lg">{sale.total_amount?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-gray-500">
        <p>Thank you for your business!</p>
        <p>Goods sold are not returnable without original receipt.</p>
      </div>
    </div>
  )
}