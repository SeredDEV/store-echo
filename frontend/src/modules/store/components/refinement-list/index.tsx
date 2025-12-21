"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { ChevronDown, Plus } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"

type RefinementListProps = {
  category?: HttpTypes.StoreProductCategory
  search?: boolean
  'data-testid'?: string
}

const RefinementList = ({ 
  category,
  'data-testid': dataTestId 
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  // Estados para secciones colapsables
  const [openSections, setOpenSections] = useState({
    categories: true,
    colors: false,
    sizes: false,
    price: false,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Colores disponibles (puedes expandir esto más adelante)
  const colors = [
    { name: "Beige", value: "beige", hex: "#F5F5DC" },
    { name: "Yellow", value: "yellow", hex: "#FFEB3B" },
    { name: "Red", value: "red", hex: "#F44336" },
    { name: "Maroon", value: "maroon", hex: "#800000" },
    { name: "Blue", value: "blue", hex: "#2196F3" },
    { name: "Green", value: "green", hex: "#4CAF50" },
    { name: "Purple", value: "purple", hex: "#9C27B0" },
    { name: "Pink", value: "pink", hex: "#E91E63" },
    { name: "Black", value: "black", hex: "#000000" },
    { name: "White", value: "white", hex: "#FFFFFF" },
  ]

  // Tallas disponibles
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"]

  // Rangos de precio
  const priceRanges = [
    { label: "All", value: "all" },
    { label: "$0.00 - $680.00", value: "0-680" },
    { label: "$680.00 - $1,360.00", value: "680-1360" },
    { label: "$1,360.00 - $2,040.00", value: "1360-2040" },
    { label: "$2,040.00 - $2,720.00", value: "2040-2720" },
    { label: "$2,720.00+", value: "2720+" },
  ]

  return (
    <div className="w-full small:w-64">
      {/* Título del filtro */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Filter</h2>

      {/* Sección de Categorías */}
      {category && (
        <div className="mb-6 border-b border-gray-200 pb-6">
          <button
            onClick={() => toggleSection("categories")}
            className="flex items-center justify-between w-full mb-4 text-sm font-semibold text-gray-900"
          >
            <span>Categories</span>
            {openSections.categories ? (
              <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
            ) : (
              <Plus className="w-4 h-4 rotate-45 transition-transform" />
            )}
          </button>
          {openSections.categories && (
            <div className="space-y-2">
              {category.category_children && category.category_children.length > 0 ? (
                category.category_children.map((child) => (
                  <label
                    key={child.id}
                    className="flex items-center gap-2 cursor-pointer hover:text-gray-900 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-600">
                      {child.name} ({child.products?.length || 0})
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">No hay subcategorías disponibles</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sección de Colores */}
      <div className="mb-6 border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection("colors")}
          className="flex items-center justify-between w-full mb-4 text-sm font-semibold text-gray-900"
        >
          <span>Colours</span>
          {openSections.colors ? (
            <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
          ) : (
            <Plus className="w-4 h-4 rotate-45 transition-transform" />
          )}
        </button>
        {openSections.colors && (
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500 hover:scale-110 transition-all cursor-pointer"
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={`Filter by ${color.name} color`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sección de Tallas */}
      <div className="mb-6 border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection("sizes")}
          className="flex items-center justify-between w-full mb-4 text-sm font-semibold text-gray-900"
        >
          <span>Sizes</span>
          {openSections.sizes ? (
            <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
          ) : (
            <Plus className="w-4 h-4 rotate-45 transition-transform" />
          )}
        </button>
        {openSections.sizes && (
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Precio */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full mb-4 text-sm font-semibold text-gray-900"
        >
          <span>Price</span>
          {openSections.price ? (
            <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
          ) : (
            <Plus className="w-4 h-4 rotate-45 transition-transform" />
          )}
        </button>
        {openSections.price && (
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <label
                key={range.value}
                className="flex items-center gap-2 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <input
                  type="radio"
                  name="price-range"
                  value={range.value}
                  className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-600">{range.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RefinementList