"use client"

import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import ImageGallery from "./index"

type VariantImageGalleryProps = {
  product: HttpTypes.StoreProduct
  initialImages?: HttpTypes.StoreProductImage[]
}

const VariantImageGallery = ({
  product,
  initialImages,
}: VariantImageGalleryProps) => {
  const searchParams = useSearchParams()
  const selectedVariantId = searchParams.get("v_id")

  const images = useMemo(() => {
    if (!selectedVariantId || !product.variants) {
      return initialImages || product.images || []
    }

    const variant = product.variants.find((v) => v.id === selectedVariantId)
    if (!variant || !variant.images || variant.images.length === 0) {
      return initialImages || product.images || []
    }

    // Filter images by color option value (black/white) from variant options
    const variantOptions = variant.options || []
    const colorOption = variantOptions.find((opt: any) => 
      opt.value && (opt.value.toLowerCase().includes('black') || opt.value.toLowerCase().includes('white'))
    )
    
    if (colorOption) {
      const color = colorOption.value.toLowerCase()
      const colorKeyword = color.includes('black') ? 'black' : color.includes('white') ? 'white' : null
      
      if (colorKeyword) {
        const filteredByColor = (product.images || []).filter((img) =>
          img.url?.toLowerCase().includes(colorKeyword)
        )
        
        if (filteredByColor.length > 0) {
          return filteredByColor
        }
      }
    }
    
    // Fallback: use variant.images if fewer than product.images, otherwise all product images
    if (variant.images.length < (product.images?.length || Infinity)) {
      return variant.images
    }
    
    return initialImages || product.images || []
  }, [selectedVariantId, product.variants, product.images, initialImages])

  return <ImageGallery images={images} />
}

export default VariantImageGallery

