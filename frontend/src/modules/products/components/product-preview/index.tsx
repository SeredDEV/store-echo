import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import FavoriteButton from "./favorite-button"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <div className="group" data-testid="product-wrapper">
      <LocalizedClientLink href={`/products/${product.handle}`} className="block mb-3">
        <div className="overflow-hidden rounded-lg">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
        </div>
      </LocalizedClientLink>
      
      <div className="space-y-1">
        <LocalizedClientLink href={`/products/${product.handle}`} className="block">
          <Text className="text-sm font-semibold text-gray-900 uppercase group-hover:text-gray-700 transition-colors leading-tight" data-testid="product-title">
            {product.title}
          </Text>
        </LocalizedClientLink>
        
        <div className="flex items-center justify-between">
          {cheapestPrice && (
            <div className="text-lg font-semibold text-gray-900">
              {cheapestPrice.calculated_price}
            </div>
          )}
          <FavoriteButton />
        </div>
      </div>
    </div>
  )
}
