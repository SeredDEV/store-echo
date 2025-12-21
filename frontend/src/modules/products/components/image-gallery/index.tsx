"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (!images || images.length === 0) {
    return null
  }

  const selectedImage = images[selectedImageIndex]

  return (
    <div className="w-full relative rounded-xl overflow-hidden bg-ui-bg-subtle">
      {/* Main Image Container */}
      <div className="relative w-full aspect-square lg:aspect-[4/5] overflow-hidden group">
        {selectedImage?.url && (
          <Image
            key={selectedImage.id}
            src={selectedImage.url}
            priority={selectedImageIndex === 0}
            className="object-cover transition-all duration-700 ease-in-out group-hover:scale-105 animate-fadeIn"
            alt={`Product image ${selectedImageIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
          />
        )}
      </div>

      {/* Thumbnail Gallery - Inside same container at the bottom */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex gap-2 lg:gap-3 justify-center flex-wrap">
            {images.map((image, index) => {
              const isSelected = index === selectedImageIndex
              return (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`
                    relative flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer bg-white
                    ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2 scale-110 shadow-lg"
                        : "border-white/50 hover:border-white opacity-80 hover:opacity-100 hover:scale-105"
                    }
                  `}
                  aria-label={`View image ${index + 1}`}
                >
                  {image.url && (
                    <Image
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGallery
