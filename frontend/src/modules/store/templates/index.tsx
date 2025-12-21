import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { ViewMode } from "@modules/categories/components/view-toggle"
import StoreHeader from "@modules/store/components/store-header"
import { listCategories } from "@lib/data/categories"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  view,
  categoryIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  view?: ViewMode
  categoryIds?: string[]
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  
  // Obtener todas las categorías para el filtro
  const categories = await listCategories().catch(() => [])

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      {/* Sidebar de Filtros - Izquierda */}
      <aside className="w-full small:w-64 small:min-w-[250px] small:pr-24 mb-8 small:mb-0">
        <RefinementList categories={categories} />
      </aside>

      {/* Contenido Principal - Derecha */}
      <div className="flex-1 w-full pl-2">
        {/* Header con resultados, ordenamiento y vista */}
        <Suspense
          fallback={
            <div className="mb-8">
              <div className="h-12 bg-gray-100 rounded animate-pulse" />
            </div>
          }
        >
          <StoreHeader 
            sortBy={sort}
            page={pageNumber}
            view={view || "grid-3"}
            countryCode={countryCode}
          />
        </Suspense>

        {/* Grid de productos */}
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            view={view || "grid-3"}
            categoryIds={categoryIds}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate