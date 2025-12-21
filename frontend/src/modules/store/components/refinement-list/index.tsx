"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect, useMemo } from "react"
import { ChevronDown } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"

type RefinementListProps = {
  category?: HttpTypes.StoreProductCategory
  categories?: HttpTypes.StoreProductCategory[]
  search?: boolean
  'data-testid'?: string
}

const RefinementList = ({ 
  category,
  categories = [],
  'data-testid': dataTestId 
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams)
      
      Object.entries(updates).forEach(([name, value]) => {
        if (value === null || (Array.isArray(value) && value.length === 0)) {
          params.delete(name)
        } else if (Array.isArray(value)) {
          params.delete(name)
          value.forEach((v) => params.append(name, v))
        } else {
          params.set(name, value)
        }
      })
      
      // Reset a página 1 cuando cambian los filtros
      params.set("page", "1")
      
      return params.toString()
    },
    [searchParams]
  )

  // Estados para secciones colapsables
  const [openSections, setOpenSections] = useState({
    categories: true,
    colors: true,
    sizes: true,
    price: true,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Estados para checkboxes seleccionados
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])

  const handleColorToggle = (colorValue: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorValue)
        ? prev.filter((c) => c !== colorValue)
        : [...prev, colorValue]
    )
  }

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size]
    )
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

  // Filtrar solo categorías principales (sin parent) - igual que en CategoryDropdown
  const mainCategories = useMemo(
    () => categories?.filter((cat) => !cat.parent_category) || [],
    [categories]
  )
  
  // Detectar categoría actual desde el pathname (ej: /categories/camisetas o /co/categories/camisetas)
  const getCurrentCategoryFromPath = useCallback(() => {
    // Buscar /categories/ en el pathname (puede incluir countryCode antes)
    const categoriesIndex = pathname.indexOf("/categories/")
    if (categoriesIndex !== -1) {
      const afterCategories = pathname.substring(categoriesIndex + "/categories/".length)
      const categoryHandle = afterCategories.split("?")[0].split("/")[0]
      const currentCategory = mainCategories.find(
        (cat) => cat.handle === categoryHandle
      )
      return currentCategory?.id || null
    }
    return null
  }, [pathname, mainCategories])

  // Leer categorías seleccionadas: de query params si estamos en /store, o de la ruta si estamos en /categories
  const categoryIdsParam = searchParams.getAll("category_id")
  const currentCategoryId = getCurrentCategoryFromPath()
  const isCategoryPage = pathname.indexOf("/categories/") !== -1
  
  // Función para obtener categorías seleccionadas sin recrearla constantemente
  const getInitialSelectedCategories = () => {
    if (isCategoryPage && currentCategoryId) {
      return [currentCategoryId]
    }
    return categoryIdsParam || []
  }

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    getInitialSelectedCategories()
  )

  // Sincronizar con cambios en la URL y pathname
  useEffect(() => {
    const categoryIds = searchParams.getAll("category_id")
    const isCatPage = pathname.indexOf("/categories/") !== -1
    let catIdFromPath: string | null = null
    
    if (isCatPage) {
      const categoriesIndex = pathname.indexOf("/categories/")
      if (categoriesIndex !== -1) {
        const afterCategories = pathname.substring(categoriesIndex + "/categories/".length)
        const categoryHandle = afterCategories.split("?")[0].split("/")[0]
        const currentCat = mainCategories.find((cat) => cat.handle === categoryHandle)
        catIdFromPath = currentCat?.id || null
      }
    }
    
    const newSelection = isCatPage && catIdFromPath ? [catIdFromPath] : categoryIds
    // Solo actualizar si realmente cambió
    setSelectedCategories((prev) => {
      const prevStr = prev.sort().join(",")
      const newStr = newSelection.sort().join(",")
      if (prevStr !== newStr) {
        return newSelection
      }
      return prev
    })
  }, [pathname, searchParams, mainCategories])

  const handleCategoryToggle = (categoryId: string) => {
    // Calcular nueva selección
    const newSelection = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId]

    setSelectedCategories(newSelection)

    // Extraer countryCode del pathname actual
    const pathParts = pathname.split("/").filter(Boolean)
    const countryCode = pathParts[0] || "co"

    // Si estamos en una página de categoría, navegar a /store con los filtros
    // Si estamos en /store, actualizar los query params en la misma página
    if (isCategoryPage) {
      // Navegar a /store con las categorías seleccionadas
      const query = createQueryString({
        category_id: newSelection.length > 0 ? newSelection : null,
      })
      router.push(`/${countryCode}/store?${query}`)
    } else {
      // Estamos en /store, actualizar query params
      const query = createQueryString({
        category_id: newSelection.length > 0 ? newSelection : null,
      })
      router.push(`${pathname}?${query}`)
    }
  }

  // Función para limpiar todos los filtros
  const handleClearAll = () => {
    setSelectedCategories([])
    setSelectedColors([])
    setSelectedSizes([])
    
    // Extraer countryCode del pathname actual
    const pathParts = pathname.split("/").filter(Boolean)
    const countryCode = pathParts[0] || "co"
    
    // Si estamos en una página de categoría, navegar a /store sin filtros
    // Si estamos en /store, limpiar todos los query params relacionados con filtros
    if (isCategoryPage) {
      router.push(`/${countryCode}/store`)
    } else {
      // Limpiar todos los filtros manteniendo solo sortBy, page, view si existen
      const params = new URLSearchParams(searchParams)
      params.delete("category_id")
      params.delete("color")
      params.delete("size")
      params.delete("price")
      params.set("page", "1")
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  // Verificar si hay filtros activos
  const hasActiveFilters = 
    selectedCategories.length > 0 || 
    selectedColors.length > 0 || 
    selectedSizes.length > 0 ||
    searchParams.get("price")

  return (
    <div className="w-full small:w-64 pr-3" data-testid={dataTestId}>
      {/* Título del filtro - Alineado con el header */}
      <div className="mb-8 flex items-center h-[41px] gap-3 pr-4">
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-900"
          >
            <path
              d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#111827] bg-gray-50 hover:bg-[#111827] hover:text-white border border-gray-200 hover:border-[#111827] rounded-lg transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md ml-auto"
            aria-label="Clear filters"
            title="Clear filters"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[18px] h-[18px]"
            >
              <path
                d="M3.33301 5.49054H4.81449H16.6663"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.14286 5.5V4C7.14286 3.60218 7.29337 3.22064 7.56128 2.93934C7.82919 2.65804 8.19255 2.5 8.57143 2.5H11.4286C11.8075 2.5 12.1708 2.65804 12.4387 2.93934C12.7066 3.22064 12.8571 3.60218 12.8571 4V5.5M15 5.5V16C15 16.3978 14.8495 16.7794 14.5816 17.0607C14.3137 17.342 13.9503 17.5 13.5714 17.5H6.42857C6.04969 17.5 5.68633 17.342 5.41842 17.0607C5.15051 16.7794 5 16.3978 5 16V5.5H15Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.33203 9.23724V13.4039"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.666 9.23724V13.4039"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Clear filters</span>
          </button>
        )}
      </div>

      {/* Sección de Categorías - Siempre primero */}
      <div className="mb-6 border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between w-full mb-4 text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <span>Categories</span>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              openSections.categories ? 'rotate-180' : ''
            }`} 
          />
        </button>
        {openSections.categories && (
          <div className="space-y-3">
            {mainCategories.length > 0 ? (
              mainCategories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-3 cursor-pointer group hover:text-gray-900 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                    className="w-4 h-4 text-[#111827] border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 cursor-pointer accent-[#111827]"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {cat.name}
                  </span>
                </label>
              ))
            ) : category && category.category_children && category.category_children.length > 0 ? (
              category.category_children.map((child) => (
                <label
                  key={child.id}
                  className="flex items-center gap-3 cursor-pointer group hover:text-gray-900 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(child.id)}
                    onChange={() => handleCategoryToggle(child.id)}
                    className="w-4 h-4 text-[#111827] border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 cursor-pointer accent-[#111827]"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {child.name} <span className="text-gray-500">({child.products?.length || 0})</span>
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500">No hay categorías disponibles</p>
            )}
          </div>
        )}
      </div>

      {/* Sección de Colores */}
      <div className="mb-6 border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection("colors")}
          className="flex items-center justify-between w-full mb-4 text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <span>Colours</span>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              openSections.colors ? 'rotate-180' : ''
            }`} 
          />
        </button>
        {openSections.colors && (
          <div className="space-y-3">
            {colors.map((color) => (
              <label
                key={color.value}
                className="flex items-center gap-3 cursor-pointer group hover:text-gray-900 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color.value)}
                  onChange={() => handleColorToggle(color.value)}
                  className="w-4 h-4 text-[#111827] border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 cursor-pointer accent-[#111827]"
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{color.name}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Tallas */}
      <div className="mb-6 border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection("sizes")}
          className="flex items-center justify-between w-full mb-4 text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <span>Sizes</span>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              openSections.sizes ? 'rotate-180' : ''
            }`} 
          />
        </button>
        {openSections.sizes && (
          <div className="space-y-3">
            {sizes.map((size) => (
              <label
                key={size}
                className="flex items-center gap-3 cursor-pointer group hover:text-gray-900 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSizes.includes(size)}
                  onChange={() => handleSizeToggle(size)}
                  className="w-4 h-4 text-[#111827] border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 cursor-pointer accent-[#111827]"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{size}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Precio */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full mb-4 text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <span>Price</span>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              openSections.price ? 'rotate-180' : ''
            }`} 
          />
        </button>
        {openSections.price && (
          <div className="space-y-3">
            {priceRanges.map((range) => (
              <label
                key={range.value}
                className="flex items-center gap-3 cursor-pointer group hover:text-gray-900 transition-colors"
              >
                <input
                  type="radio"
                  name="price-range"
                  value={range.value}
                  className="w-4 h-4 text-[#111827] border-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 cursor-pointer accent-[#111827]"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{range.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RefinementList