import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="flex flex-col gap-4">
      {product.collection && (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="text-sm font-medium text-ui-fg-muted hover:text-ui-fg-interactive transition-colors uppercase tracking-wide"
        >
          {product.collection.title}
        </LocalizedClientLink>
      )}
      <Heading
        level="h2"
        className="text-3xl lg:text-4xl font-bold leading-tight text-ui-fg-base"
        data-testid="product-title"
      >
        {product.title}
      </Heading>

      {product.description && (
        <Text
          className="text-base lg:text-lg text-ui-fg-subtle leading-relaxed whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      )}
    </div>
  )
}

export default ProductInfo
