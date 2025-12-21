import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-3">
        <span
          className={clx("text-3xl lg:text-4xl font-bold", {
            "text-ui-fg-interactive": selectedPrice.price_type === "sale",
            "text-ui-fg-base": selectedPrice.price_type !== "sale",
          })}
        >
          {!variant && <span className="text-lg font-normal text-ui-fg-subtle">From </span>}
          <span
            data-testid="product-price"
            data-value={selectedPrice.calculated_price_number}
          >
            {selectedPrice.calculated_price}
          </span>
        </span>
        {selectedPrice.price_type === "sale" && (
          <span className="px-2 py-1 text-xs font-semibold text-white bg-ui-fg-interactive rounded">
            -{selectedPrice.percentage_diff}%
          </span>
        )}
      </div>
      {selectedPrice.price_type === "sale" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-ui-fg-subtle">Original: </span>
          <span
            className="text-lg text-ui-fg-subtle line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
        </div>
      )}
    </div>
  )
}
