import React, { Suspense } from "react"

import VariantImageGallery from "@modules/products/components/image-gallery/variant-image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12 py-8 lg:py-12 relative"
        data-testid="product-container"
      >
        {/* Image Gallery - Left/Full width on mobile */}
        <div className="w-full lg:w-1/2 xl:w-3/5 order-1 lg:order-1">
          <VariantImageGallery product={product} initialImages={images} />
        </div>

        {/* Product Info and Actions - Right side */}
        <div className="w-full lg:w-1/2 xl:w-2/5 order-2 lg:order-2">
          <div className="flex flex-col gap-8 lg:sticky lg:top-24">
            <ProductInfo product={product} />
            
            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>

            <ProductOnboardingCta />
          </div>
        </div>
      </div>

      {/* Product Tabs - Full width below */}
      <div className="content-container mt-12 lg:mt-16">
        <ProductTabs product={product} />
      </div>

      {/* Related Products */}
      <div
        className="content-container my-16 lg:my-24"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
