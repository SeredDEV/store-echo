"use client"

import Image from "next/image"
import { useState } from "react"
import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ImageGalleryProps = {
  thumbnail?: string | null
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
}

const ImageGallery = ({ thumbnail, images, size }: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Obtener todas las imágenes disponibles
  const allImages: string[] = []
  if (thumbnail) allImages.push(thumbnail)
  if (images && images.length > 0) {
    images.forEach((img) => {
      if (img.url && !allImages.includes(img.url)) {
        allImages.push(img.url)
      }
    })
  }

  // Si solo hay una imagen, solo mostrarla
  if (allImages.length <= 1) {
    const image = allImages[0]
    return image ? (
      <Image
        src={image}
        alt="Thumbnail"
        className="absolute inset-0 object-cover object-center transition-opacity duration-300"
        draggable={false}
        quality={50}
        sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
        fill
      />
    ) : (
      <div className="w-full h-full absolute inset-0 flex items-center justify-center">
        <PlaceholderImage size={size === "small" ? 16 : 24} />
      </div>
    )
  }

  const handleMouseEnter = () => {
    if (allImages.length > 1 && currentIndex === 0) {
      // Solo cambia automáticamente si está en la primera imagen
      setCurrentIndex(1)
    }
  }

  const handleMouseLeave = () => {
    setCurrentIndex(0)
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % allImages.length)
  }

  return (
    <div 
      className="absolute inset-0 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {allImages.map((image, index) => (
        <Image
          key={image}
          src={image}
          alt={`Product image ${index + 1}`}
          className={`absolute inset-0 object-cover object-center transition-opacity duration-500 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
          quality={50}
          sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
          fill
        />
      ))}
      
      {/* Botón anterior */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        aria-label="Previous image"
      >
        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Botón siguiente */}
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        aria-label="Next image"
      >
        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

export default ImageGallery
