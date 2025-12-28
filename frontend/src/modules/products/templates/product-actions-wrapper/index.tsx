import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 * Uses no-cache to ensure fresh pricing data when variant changes.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  // Usar no-cache para obtener precios frescos (la página ya es dinámica)
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
    useCache: false, // No usar caché para obtener datos frescos
  }).then(({ response }) => response.products[0])

  if (!product) {
    return null
  }

  return <ProductActions product={product} region={region} />
}
