'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createItem(formData: FormData) {
  const supabase = await createClient()

  console.log("1. Starting Create Item...")

  // 1. Extract Data
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

  // GENERATE VARIANT NAME AUTOMATICALLY
  // If position is "Front LH" and type is "Heavy Duty", name becomes "Front LH - Heavy Duty"
  // If both are empty, it defaults to "Standard"
  let variantName = [position, type].filter(Boolean).join(' - ')
  if (!variantName) variantName = 'Standard'

  try {
    // 2. Handle Brand
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

    // 3. Handle Product
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

    // 4. Create Variant
    const { error: variantError } = await supabase
      .from('variants')
      .insert({
        product_id: productId,
        name: variantName, // <--- THIS WAS MISSING BEFORE
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
    console.error("CRITICAL ERROR:", error)
    return redirect(`/inventory/new?error=${encodeURIComponent(error.message)}`)
  }

  // 5. Success
  revalidatePath('/inventory')
  redirect('/inventory')
}