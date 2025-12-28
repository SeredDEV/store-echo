import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

// Hacer la página dinámica para obtener datos frescos
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    view?: "list" | "grid-2" | "grid-3"
    category_id?: string | string[]
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, view, category_id } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      view={view}
      categoryIds={Array.isArray(category_id) ? category_id : category_id ? [category_id] : undefined}
      countryCode={params.countryCode}
    />
  )
}
