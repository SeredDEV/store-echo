import { listProductsWithSort } from "@lib/data/products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import SortDropdown from "@modules/categories/components/sort-dropdown"
import ViewToggle, { ViewMode } from "@modules/categories/components/view-toggle"

type StoreHeaderProps = {
  sortBy: SortOptions
  page: number
  view?: ViewMode
  countryCode: string
}

export default async function StoreHeader({
  sortBy,
  page,
  view,
  countryCode,
}: StoreHeaderProps) {
  const queryParams = {
    limit: 12,
  }

  const {
    response: { count },
  } = await listProductsWithSort({
    page: 1,
    queryParams,
    sortBy,
    countryCode,
  })

  const itemsPerPage = 12
  const from = count === 0 ? 0 : itemsPerPage * (page - 1) + 1
  const showing = Math.min(from + itemsPerPage - 1, count)

  return (
    <div className="flex flex-col small:flex-row small:items-center small:justify-between mb-8 gap-4">
      {/* Contador de resultados */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{from}</span>-
        <span className="font-semibold text-gray-900">{showing}</span> of{" "}
        <span className="font-semibold text-gray-900">{count}</span> results
      </div>

      {/* Dropdown de ordenamiento y vista */}
      <div className="flex items-center gap-3">
        <SortDropdown sortBy={sortBy} />
        <ViewToggle currentView={view || "grid-3"} />
      </div>
    </div>
  )
}
