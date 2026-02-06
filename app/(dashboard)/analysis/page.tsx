import { createClient } from '@/utils/supabase/server'
import ShipmentSimulator from './profit-calculator'

export default async function AnalysisPage() {
  const supabase = await createClient()

  // 1. Fetch ALL variants with ALL price details
  const { data: variants } = await supabase
    .from('variants')
    .select(`
      id,
      item_code,
      name,
      part_number,
      cost_usd,
      cost_rm,
      price_myr,       
      price_online,    
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

  // 2. Fetch SAVED SCENARIOS
  const { data: savedScenarios } = await supabase
    .from('analysis_scenarios')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <ShipmentSimulator 
        variants={variants || []} 
        savedScenarios={savedScenarios || []}
      />
    </div>
  )
}