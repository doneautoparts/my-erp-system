'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createItem(formData: FormData) {
  const supabase = await createClient()

  // 1. Extract Data from Form
  const brandName = formData.get('brand') as string
  const productName = formData.get('product_name') as string
  const category = formData.get('category') as string
  
  const position = formData.get('position') as string
  const type = formData.get('type') as string // e.g., Heavy Duty
  const partNumber = formData.get('part_number') as string
  const sku = formData.get('sku') as string || partNumber // Use PartNumber as SKU if empty
  
  const price = parseFloat(formData.get('price') as string) || 0
  const stock = parseInt(formData.get('stock') as string) || 0
  const minStock = parseInt(formData.get('min_stock') as string) || 5

  // 2. Handle Brand (Find existing or Create new)
  // We trim whitespace and ignore case to prevent "Proton" vs "proton" duplicates
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
    
    if (brandError) throw new Error(brandError.message)
    brandId = newBrand.id
  }

  // 3. Handle Product (Find existing or Create new)
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

    if (productError) throw new Error(productError.message)
    productId = newProduct.id
  }

  // 4. Create the Variant (The specific item)
  const { error: variantError } = await supabase
    .from('variants')
    .insert({
      product_id: productId,
      position: position || null,
      type: type || null,
      part_number: partNumber,
      sku: sku,
      price_myr: price,
      stock_quantity: stock,
      min_stock_level: minStock
    })

  if (variantError) {
    // If SKU exists, it will fail here. User needs to know.
    console.error(variantError)
    return redirect('/inventory/new?error=Item already exists (Check SKU/Part Number)')
  }

  // 5. Finish
  revalidatePath('/inventory')
  redirect('/inventory')
}