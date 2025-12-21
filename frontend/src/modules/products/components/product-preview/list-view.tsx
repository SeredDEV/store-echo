import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import ListActions from "./list-actions"

export default function ProductPreviewListView({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <div 
      className="flex flex-col small:flex-row gap-6 p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 bg-white"
      data-testid="product-wrapper-list"
    >
      {/* Imagen */}
      <LocalizedClientLink href={`/products/${product.handle}`} className="w-full small:w-56 flex-shrink-0 group/image">
        <div className="overflow-hidden rounded-lg transition-transform duration-300 group-hover/image:scale-105">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="square"
            isFeatured={false}
          />
        </div>
      </LocalizedClientLink>

      {/* Información del producto */}
      <div className="flex-1 flex flex-col justify-between py-2">
        {/* Título, precio y descripción */}
        <div className="space-y-2">
          <LocalizedClientLink href={`/products/${product.handle}`} className="group/title block">
            <Text className="text-lg font-semibold text-gray-900 group-hover/title:text-gray-700 transition-colors uppercase" data-testid="product-title-list">
              {product.title}
            </Text>
          </LocalizedClientLink>
          
          {/* Precio */}
          {cheapestPrice && (
            <div className="mb-3 pb-3 border-b border-gray-300">
              <div className="text-base font-medium text-gray-900">
                {cheapestPrice.calculated_price}
              </div>
            </div>
          )}

          {/* Descripción */}
          {product.description && (
            <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">
              {product.description}
            </p>
          )}
        </div>
        
        {/* Botones alineados a la izquierda */}
        <div className="mt-6">
          <ListActions productHandle={product.handle} />
        </div>
      </div>
    </div>
  )
}