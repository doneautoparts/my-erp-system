'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- PERMISSION CHECKER ---
async function checkPermissions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()
    
    const role = profile?.role || 'user'
    
    if (role !== 'admin' && role !== 'manager') {
        throw new Error("Unauthorized: View Only Access. Contact Manager.")
    }
    return supabase
}

// --- 1. CREATE NEW ITEM ---
export async function createItem(formData: FormData) {
  let errorMsg = null
  try {
      const supabase = await checkPermissions()
      
      const brandName = formData.get('brand') as string
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
      const ctnQty = parseInt(formData.get('ctn_qty') as string) || 1
      const ctnLen = parseFloat(formData.get('ctn_len') as string) || 0
      const ctnWid = parseFloat(formData.get('ctn_wid') as string) || 0
      const ctnHeight = parseFloat(formData.get('ctn_height') as string) || 0

      let variantName = [position, type].filter(Boolean).join(' - ')
      if (!variantName) variantName = 'Standard'

      // Handle Brand
      const { data: existingBrand } = await supabase.from('brands').select('id').ilike('name', brandName.trim()).single()
      let brandId = existingBrand?.id

      if (!brandId) {
        const { data: newBrand, error: brandError } = await supabase.from('brands').insert({ name: brandName.trim() }).select('id').single()
        if (brandError) throw new Error(`Brand Error: ${brandError.message}`)
        if (!newBrand) throw new Error("Failed to create brand") // FIX: Null check
        brandId = newBrand.id
      }

      // Handle Product
      const { data: existingProduct } = await supabase.from('products').select('id').eq('brand_id', brandId).ilike('name', productName.trim()).single()
      let productId = existingProduct?.id

      if (!productId) {
        const { data: newProduct, error: productError } = await supabase.from('products').insert({ brand_id: brandId, name: productName.trim(), category: category }).select('id').single()
        if (productError) throw new Error(`Product Error: ${productError.message}`)
        if (!newProduct) throw new Error("Failed to create product") // FIX: Null check
        productId = newProduct.id
      }

      const { error: variantError } = await supabase.from('variants').insert({
          product_id: productId, item_code: itemCode, name: variantName, position, type, part_number, sku,
          cost_rm: costRm, cost_usd: costUsd, price_myr: priceSell, price_online: priceOnline, price_proposal: priceProposal,
          stock_quantity: stock, min_stock_level: minStock, packing_ratio: packingRatio,
          ctn_qty: ctnQty, ctn_len: ctnLen, ctn_wid: ctnWid, ctn_height: ctnHeight
      })
      if (variantError) throw new Error(variantError.message)

  } catch (err: any) {
      errorMsg = err.message
  }

  if (errorMsg) return redirect(`/inventory/new?error=${encodeURIComponent(errorMsg)}`)
  revalidatePath('/inventory'); redirect('/inventory')
}

// --- 2. UPDATE ITEM ---
export async function updateItem(formData: FormData) {
  let errorMsg = null
  const id = formData.get('id') as string

  try {
      const supabase = await checkPermissions()
      
      const oldProductId = formData.get('product_id') as string
      const productName = (formData.get('product_name') as string).trim()
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
      const ctnQty = parseInt(formData.get('ctn_qty') as string) || 1
      const ctnLen = parseFloat(formData.get('ctn_len') as string) || 0
      const ctnWid = parseFloat(formData.get('ctn_wid') as string) || 0
      const ctnHeight = parseFloat(formData.get('ctn_height') as string) || 0

      let variantName = [position, type].filter(Boolean).join(' - ')
      if (!variantName) variantName = 'Standard'

      // Product Name Change Logic
      const { data: currentProduct } = await supabase.from('products').select('name, brand_id').eq('id', oldProductId).single();
      let targetProductId = oldProductId;

      if (currentProduct && currentProduct.name !== productName) {
          const { data: existingTargetProduct } = await supabase.from('products').select('id').eq('brand_id', currentProduct.brand_id).ilike('name', productName).single();
          if (existingTargetProduct) {
              targetProductId = existingTargetProduct.id;
          } else {
              const { data: newProduct, error: createError } = await supabase.from('products').insert({ brand_id: currentProduct.brand_id, name: productName, category: category }).select('id').single();
              if (createError) throw new Error(createError.message);
              if (!newProduct) throw new Error("Failed to create new product group"); // FIX
              targetProductId = newProduct.id;
          }
      } else {
          await supabase.from('products').update({ category }).eq('id', targetProductId);
      }

      const { error } = await supabase.from('variants').update({
          product_id: targetProductId, item_code: itemCode, name: variantName, position, type, part_number, sku,
          cost_rm: costRm, cost_usd: costUsd, price_myr: priceSell, price_online: priceOnline, price_proposal: priceProposal,
          stock_quantity: stock, min_stock_level: minStock, packing_ratio: packingRatio,
          ctn_qty: ctnQty, ctn_len: ctnLen, ctn_wid: ctnWid, ctn_height: ctnHeight
      }).eq('id', id)
      
      if (error) throw new Error(error.message)

  } catch (err: any) {
      errorMsg = err.message
  }
  
  if (errorMsg) return redirect(`/inventory/${id}?error=${encodeURIComponent(errorMsg)}`)
  revalidatePath('/inventory'); redirect('/inventory')
}

// --- 3. QUICK INLINE UPDATE ---
export async function quickUpdateVariant(formData: FormData) {
  try {
    const supabase = await checkPermissions()
    
    const id = formData.get('id') as string
    const updates = {
      cost_usd: parseFloat(formData.get('cost_usd') as string) || 0,
      cost_rm: parseFloat(formData.get('cost_rm') as string) || 0,
      price_myr: parseFloat(formData.get('price_sell') as string) || 0,
      price_online: parseFloat(formData.get('price_online') as string) || 0,
      price_proposal: parseFloat(formData.get('price_proposal') as string) || 0,
      stock_quantity: parseInt(formData.get('stock') as string) || 0,
      packing_ratio: parseInt(formData.get('packing_ratio') as string) || 1,
      item_code: formData.get('item_code') as string
    }

    const { error } = await supabase.from('variants').update(updates).eq('id', id)
    if (error) throw new Error(error.message)

    revalidatePath('/inventory')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}

// --- 4. DELETE ITEM ---
export async function deleteItem(formData: FormData) {
  try {
    const supabase = await checkPermissions()
    const id = formData.get('id') as string

    const { error } = await supabase.from('variants').delete().eq('id', id)
    if (error) throw new Error(error.message)

    revalidatePath('/inventory')
    return { success: true }
  } catch (err: any) {
    throw new Error(err.message)
  }
}