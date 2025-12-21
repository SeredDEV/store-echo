import { Suspense } from "react"
import { MagnifyingGlass, ChevronDown, ArrowRightMini } from "@medusajs/icons"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listCategories } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import User from "@modules/common/icons/user"
import CategoryDropdown from "@modules/layout/components/category-dropdown"
import SearchBar from "@modules/search/components/search-bar"

export default async function Nav() {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    listCategories().catch(() => []),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-20 mx-auto border-b duration-200 bg-white border-gray-200">
        <nav className="content-container flex items-center justify-between w-full h-full gap-2 px-4">
          {/* Menu */}
          <div className="flex-shrink-0">
            <SideMenu
              regions={regions}
              locales={locales}
              currentLocale={currentLocale}
            />
          </div>

          {/* Search Bar and Categories */}
          <div className="flex-1 flex items-center gap-2 max-w-3xl mx-4">
            <SearchBar />
            <CategoryDropdown categories={categories || []} />
            <LocalizedClientLink
              href="/store"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#0a0a0a] hover:bg-gray-200 hover:text-gray-900 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group bg-gray-50"
              data-testid="nav-store-link"
            >
              <svg
                className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition-colors duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="text-base font-medium">Store</span>
            </LocalizedClientLink>
          </div>

          {/* User Icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LocalizedClientLink
              className="hover:text-ui-fg-base transition-colors p-2 flex items-center justify-center"
              href="/account"
              data-testid="nav-account-link"
            >
              <User className="w-6 h-6" />
            </LocalizedClientLink>

            <button className="relative hover:text-ui-fg-base transition-colors p-2 flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                0
              </span>
            </button>

            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base transition-colors p-2 relative flex items-center justify-center"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 bg-gray-900 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-medium">
                    0
                  </span>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
