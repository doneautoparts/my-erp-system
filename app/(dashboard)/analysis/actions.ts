'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// SAVE SCENARIO
export async function saveScenario(name: string, variables: any, items: any[]) {
  const supabase = await createClient()

  // 1. Create Header
  const { data: scenario, error: headError } = await supabase
    .from('analysis_scenarios')
    .insert({
      name,
      exchange_rate: variables.exchangeRate,
      ocean_lump_sum: variables.oceanLumpSum,
      trucking_lump_sum: variables.truckingLumpSum,
      is_form_e: variables.isFormE,
      manual_duty_pct: variables.manualDutyPct,
      consumable: variables.consumable,
      license: variables.license
    })
    .select('id')
    .single()

  if (headError) throw new Error(headError.message)

  // 2. Create Items
  if (items.length > 0) {
    const formattedItems = items.map((item: any) => ({
      scenario_id: scenario.id,
      variant_id: item.id, // The variant ID from the database
      qty: item.orderQty,
      target_price: item.targetPrice
    }))

    const { error: itemsError } = await supabase.from('analysis_items').insert(formattedItems)
    if (itemsError) throw new Error(itemsError.message)
  }

  revalidatePath('/analysis')
  return { success: true }
}

// DELETE SCENARIO
export async function deleteScenario(id: string) {
  const supabase = await createClient()
  await supabase.from('analysis_scenarios').delete().eq('id', id)
  revalidatePath('/analysis')
}

// LOAD SCENARIO DETAILS
export async function getScenario(id: string) {
  const supabase = await createClient()
  
  const { data: scenario } = await supabase
    .from('analysis_scenarios')
    .select('*')
    .eq('id', id)
    .single()

  const { data: items } = await supabase
    .from('analysis_items')
    .select('*, variants(*, products(name, brands(name)))')
    .eq('scenario_id', id)

  return { scenario, items }
}