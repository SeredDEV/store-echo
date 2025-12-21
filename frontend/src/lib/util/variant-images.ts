import { HttpTypes } from "@medusajs/types"

/**
 * Obtiene las imágenes correctas de la variante asociada a un item del carrito o de una orden.
 * 
 * Prioridad:
 * 1. Usa directamente las imágenes de item.variant.images si están disponibles
 * 2. Si no, busca la variante en product.variants y usa sus imágenes
 * 3. Si no hay imágenes de la variante, intenta filtrar por color desde el título de la variante
 * 
 * @param item - Item del carrito o de una orden que tiene una variante asociada
 * @returns Array de imágenes de la variante, o array vacío si no se encuentran
 */
export function getVariantImages(
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
): HttpTypes.StoreProductImage[] {
  const variant = item.variant

  if (!variant) {
    return []
  }

  // PRIMERO: Usar directamente las imágenes de la variante del item
  // Cada variante tiene sus propias imágenes cargadas directamente
  if (variant.images && variant.images.length > 0) {
    return variant.images
  }

  // SEGUNDO: Si no tiene imágenes directas, buscar en product.variants
  const product = variant.product
  if (product && product.variants && variant.id) {
    const variantFromProduct = product.variants.find((v) => v.id === variant.id)
    if (variantFromProduct?.images && variantFromProduct.images.length > 0) {
      return variantFromProduct.images
    }
  }

  // TERCERO: Si no hay imágenes de la variante, intentar filtrar por color desde el título
  if (variant.title && product?.images) {
    const title = variant.title.toLowerCase()
    let colorKeyword: string | null = null

    if (title.includes("black") || title.includes("negro")) {
      colorKeyword = "black"
    } else if (title.includes("white") || title.includes("blanco")) {
      colorKeyword = "white"
    }

    if (colorKeyword) {
      const filteredByColor = product.images.filter((img) =>
        img.url?.toLowerCase().includes(colorKeyword!)
      )

      if (filteredByColor.length > 0) {
        return filteredByColor
      }
    }
  }

  // Si no hay nada, devolver array vacío
  return []
}

