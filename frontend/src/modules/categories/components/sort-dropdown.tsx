"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { ChevronDown } from "@medusajs/icons"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type SortDropdownProps = {
  sortBy: SortOptions
}

const sortOptions = [
  {
    value: "created_at",
    label: "Latest Arrivals",
  },
  {
    value: "price_asc",
    label: "Low to High",
  },
  {
    value: "price_desc",
    label: "High to Low",
  },
]

export default function SortDropdown({ sortBy }: SortDropdownProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      // Reset to page 1 when sorting changes
      params.set("page", "1")
      return params.toString()
    },
    [searchParams]
  )

  const handleChange = (value: SortOptions | string) => {
    // Map the new values to existing sort options
    let mappedValue: SortOptions = "created_at"
    
    if (value === "popularity" || value === "rating") {
      // For now, use created_at as default for popularity and rating
      // You can implement these later when backend supports them
      mappedValue = "created_at"
    } else if (value === "price_asc" || value === "price_desc" || value === "created_at") {
      mappedValue = value as SortOptions
    }

    const query = createQueryString("sortBy", mappedValue)
    router.push(`${pathname}?${query}`)
    setIsOpen(false)
  }

  // Find current option, default to "Latest Arrivals" if not found
  const defaultSort: SortOptions = "created_at"
  const currentSortBy = (sortBy || defaultSort) as SortOptions
  
  const currentOption = sortOptions.find((opt) => {
    if (opt.value === currentSortBy) return true
    // Map old values to new ones
    if (currentSortBy === "price_asc" && opt.value === "price_asc") return true
    if (currentSortBy === "price_desc" && opt.value === "price_desc") return true
    if (currentSortBy === "created_at" && opt.value === "created_at") return true
    return false
  }) || sortOptions.find(opt => opt.value === "created_at") || sortOptions[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-all duration-200 min-w-[160px]"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex-1 text-left">{currentOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            <div className="py-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange(option.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                    option.value === currentOption.value
                      ? "bg-gray-100 text-gray-900 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}