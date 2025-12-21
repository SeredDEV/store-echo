import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import CategoryHeader from "@modules/categories/components/category-header"
import { listCategories } from "@lib/data/categories"

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  view,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  view?: "list" | "grid-2" | "grid-3"
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  // Obtener todas las categorías para el filtro
  const categories = await listCategories().catch(() => [])

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      {/* Sidebar de Filtros - Izquierda */}
      <aside className="w-full small:w-64 small:min-w-[250px] small:pr-24 mb-8 small:mb-0">
        <RefinementList 
          category={category}
          categories={categories}
          data-testid="sort-by-container" 
        />
      </aside>

      {/* Contenido Principal - Derecha */}
      <div className="flex-1 w-full pl-2">
        {/* Breadcrumbs */}
        <div className="flex flex-row mb-6 text-sm gap-2 text-gray-600">
          {parents &&
            parents.map((parent) => (
              <span key={parent.id} className="flex items-center gap-2">
                <LocalizedClientLink
                  className="hover:text-black transition-colors"
                  href={`/categories/${parent.handle}`}
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
                <span>/</span>
              </span>
            ))}
          <span className="text-gray-900 font-medium">{category.name}</span>
        </div>

        {/* Título de la categoría */}
        <h1 
          className="mb-6 text-3xl font-bold text-gray-900"
          data-testid="category-page-title"
        >
          {category.name}
        </h1>

        {/* Descripción */}
        {category.description && (
          <div className="mb-8 text-base text-gray-600">
            <p>{category.description}</p>
          </div>
        )}

        {/* Subcategorías */}
        {category.category_children && category.category_children.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Subcategorías</h2>
            <ul className="flex flex-wrap gap-3">
              {category.category_children?.map((c) => (
                <li key={c.id}>
                  <InteractiveLink 
                    href={`/categories/${c.handle}`}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {c.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Header con resultados, ordenamiento y vista */}
        <Suspense
          fallback={
            <div className="mb-8">
              <div className="h-12 bg-gray-100 rounded animate-pulse" />
            </div>
          }
        >
          <CategoryHeader 
            categoryId={category.id}
            sortBy={sort}
            page={pageNumber}
            view={view || "grid-3"}
            countryCode={countryCode}
          />
        </Suspense>

        {/* Grid de productos */}
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={category.products?.length ?? 8}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            view={view || "grid-3"}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}