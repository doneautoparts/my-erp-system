'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- 1. CREATE NEW ITEM ---
export async function createItem(formData: FormData) {
  const supabase = await createClient()

  // Extract Data
  const brandName = formData.get('brand') as string
  const productName = formData.get('product_name') as string
  const category = formData.get('category') as string
  
  const itemCode = formData.get('item_code') as string // NEW
  const position = formData.get('position') as string
  const type = formData.get('type') as string
  const partNumber = formData.get('part_number') as string
  const sku = formData.get('sku') as string || itemCode || partNumber
  
  // Costs & Prices
  const costRm = parseFloat(formData.get('cost_rm') as string) || 0 // NEW
  const costUsd = parseFloat(formData.get('cost_usd') as string) || 0 // NEW
  const priceSell = parseFloat(formData.get('price_sell') as string) || 0
  const priceOnline = parseFloat(formData.get('price_online') as string) || 0 // NEW
  const priceProposal = parseFloat(formData.get('price_proposal') as string) || 0 // NEW
  
  // Stock Logic
  const stock = parseInt(formData.get('stock') as string) || 0
  const minStock = parseInt(formData.get('min_stock') as string) || 5
  const packingRatio = parseInt(formData.get('packing_ratio') as string) || 1 // NEW

  // Generate Name (e.g., "Front LH - Standard")
  let variantName = [position, type].filter(Boolean).join(' - ')
  if (!variantName) variantName = 'Standard'

  try {
    // Handle Brand
    const { data: existingBrand } = await supabase.from('brands').select('id').ilike('name', brandName.trim()).single()
    let brandId = existingBrand?.id

    if (!brandId) {
      const { data: newBrand, error: brandError } = await supabase.from('brands').insert({ name: brandName.trim() }).select('id').single()
      if (brandError) throw new Error(`Brand Error: ${brandError.message}`)
      brandId = newBrand.id
    }

    // Handle Product
    const { data: existingProduct } = await supabase.from('products').select('id').eq('brand_id', brandId).ilike('name', productName.trim()).single()
    let productId = existingProduct?.id

    if (!productId) {
      const { data: newProduct, error: productError } = await supabase.from('products').insert({ brand_id: brandId, name: productName.trim(), category: category }).select('id').single()
      if (productError) throw new Error(`Product Error: ${productError.message}`)
      productId = newProduct.id
    }

    // Create Variant with NEW fields
    const { error: variantError } = await supabase.from('variants').insert({
        product_id: productId,
        item_code: itemCode,
        name: variantName,
        position: position || null,
        type: type || null,
        part_number: partNumber,
        sku: sku,
        cost_rm: costRm,
        cost_usd: costUsd,
        price_myr: priceSell, // Using this as the "Sell (RM)" column
        price_online: priceOnline,
        price_proposal: priceProposal,
        stock_quantity: stock,
        min_stock_level: minStock,
        packing_ratio: packingRatio
      })

    if (variantError) throw new Error(`Inventory Error: ${variantError.message}`)

  } catch (error: any) {
    return redirect(`/inventory/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/inventory')
  redirect('/inventory')
}

// --- 2. UPDATE EXISTING ITEM ---
export async function updateItem(formData: FormData) {
  const supabase = await createClient()

  const variantId = formData.get('id') as string
  const productId = formData.get('product_id') as string

  // Extract Data
  const productName = formData.get('product_name') as string
  const category = formData.get('category') as string
  const itemCode = formData.get('item_code') as string
  const position = formData.get('position') as string
  const type = formData.get('type') as string
  const partNumber = formData.get('part_number') as string
  const sku = formData.get('sku') as string || itemCode || partNumber
  
  const costRm = parseFloat(formData.get('cost_rm') as string) || 0
  const costUsd = parseFloat(formData.get('cost_usd') as string) || 0
  const priceSell = parseFloat(formData.get('price_sell') as string) || 0
  const priceOnline = parseFloat(formData.get('price_online') as string) || 0
  const priceProposal = parseFloat(formData.get('price_proposal') as string) || 0
  
  const stock = parseInt(formData.get('stock') as string) || 0
  const minStock = parseInt(formData.get('min_stock') as string) || 5
  const packingRatio = parseInt(formData.get('packing_ratio') as string) || 1

  let variantName = [position, type].filter(Boolean).join(' - ')
  if (!variantName) variantName = 'Standard'

  try {
    await supabase.from('products').update({ name: productName.trim(), category: category }).eq('id', productId)

    const { error: variantError } = await supabase.from('variants').update({
        item_code: itemCode,
        name: variantName,
        position: position || null,
        type: type || null,
        part_number: partNumber,
        sku: sku,
        cost_rm: costRm,
        cost_usd: costUsd,
        price_myr: priceSell,
        price_online: priceOnline,
        price_proposal: priceProposal,
        stock_quantity: stock,
        min_stock_level: minStock,
        packing_ratio: packingRatio
      }).eq('id', variantId)

    if (variantError) throw new Error(`Variant Update Error: ${variantError.message}`)

  } catch (error: any) {
    return redirect(`/inventory/${variantId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/inventory')
  redirect('/inventory')
}