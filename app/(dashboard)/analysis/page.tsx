import { createClient } from '@/utils/supabase/server'
import ProfitCalculator from './profit-calculator'

export default async function AnalysisPage() {
  const supabase = await createClient()

  // Fetch ALL variants with their details for the calculator
  const { data: variants } = await supabase
    .from('variants')
    .select(`
      id,
      item_code,
      name,
      part_number,
      cost_usd,
      cost_rm,
      price_proposal,
      packing_ratio,
      ctn_qty,
      ctn_len,
      ctn_wid,
      ctn_height,
      products (
        name,
        brands (name)
      )
    `)
    .order('item_code')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profit & Logistics Simulator</h1>
        <p className="text-sm text-gray-500">
          Calculate Landed Costs, Gross Margins, and Container Volume (CBM) for overseas orders.
        </p>
      </div>

      {/* The Interactive Calculator */}
      <ProfitCalculator variants={variants || []} />
    </div>
  )
}