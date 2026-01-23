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
  
  const position = formData.get('position') as string
  const type = formData.get('type') as string
  const partNumber = formData.get('part_number') as string
  const sku = formData.get('sku') as string || partNumber
  
  const price = parseFloat(formData.get('price') as string) || 0
  const stock = parseInt(formData.get('stock') as string) || 0
  const minStock = parseInt(formData.get('min_stock') as string) || 5

  // Generate Name
  let variantName = [position, type].filter(Boolean).join(' - ')
  if (!variantName) variantName = 'Standard'

  try {
    // Handle Brand
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', brandName.trim())
      .single()

    let brandId = existingBrand?.id

    if (!brandId) {
      const { data: newBrand, error: brandError } = await supabase
        .from('brands')
        .insert({ name: brandName.trim() })
        .select('id')
        .single()
      
      if (brandError) throw new Error(`Brand Error: ${brandError.message}`)
      brandId = newBrand.id
    }

    // Handle Product
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('brand_id', brandId)
      .ilike('name', productName.trim())
      .single()

    let productId = existingProduct?.id

    if (!productId) {
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          brand_id: brandId,
          name: productName.trim(),
          category: category
        })
        .select('id')
        .single()

      if (productError) throw new Error(`Product Error: ${productError.message}`)
      productId = newProduct.id
    }

    // Create Variant
    const { error: variantError } = await supabase
      .from('variants')
      .insert({
        product_id: productId,
        name: variantName,
        position: position || null,
        type: type || null,
        part_number: partNumber,
        sku: sku,
        price_myr: price,
        stock_quantity: stock,
        min_stock_level: minStock
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

  // Get IDs
  const variantId = formData.get('id') as string
  const productId = formData.get('product_id') as string

  // Extract Data
  const productName = formData.get('product_name') as string
  const category = formData.get('category') as string
  
  const position = formData.get('position') as string
  const type = formData.get('type') as string
  const partNumber = formData.get('part_number') as string
  const sku = formData.get('sku') as string || partNumber
  
  const price = parseFloat(formData.get('price') as string) || 0
  const stock = parseInt(formData.get('stock') as string) || 0
  const minStock = parseInt(formData.get('min_stock') as string) || 5

  // Generate new Name
  let variantName = [position, type].filter(Boolean).join(' - ')
  if (!variantName) variantName = 'Standard'

  try {
    // Update Product
    const { error: productError } = await supabase
      .from('products')
      .update({
        name: productName.trim(),
        category: category
      })
      .eq('id', productId)

    if (productError) throw new Error(`Product Update Error: ${productError.message}`)

    // Update Variant
    const { error: variantError } = await supabase
      .from('variants')
      .update({
        name: variantName,
        position: position || null,
        type: type || null,
        part_number: partNumber,
        sku: sku,
        price_myr: price,
        stock_quantity: stock,
        min_stock_level: minStock
      })
      .eq('id', variantId)

    if (variantError) throw new Error(`Variant Update Error: ${variantError.message}`)

  } catch (error: any) {
    return redirect(`/inventory/${variantId}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/inventory')
  redirect('/inventory')
}