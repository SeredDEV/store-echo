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
    value: "popularity",
    label: "Popularity",
  },
  {
    value: "rating",
    label: "Average Rating",
  },
  {
    value: "price_asc",
    label: "Low to High",
  },
  {
    value: "price_desc",
    label: "High to Low",
  },
  {
    value: "created_at",
    label: "Latest Arrivals",
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
      // You can implement these later
      mappedValue = "created_at"
    } else if (value === "price_asc" || value === "price_desc" || value === "created_at") {
      mappedValue = value as SortOptions
    }

    const query = createQueryString("sortBy", mappedValue)
    router.push(`${pathname}?${query}`)
    setIsOpen(false)
  }

  // Find current option, default to first if not found
  const currentOption = sortOptions.find((opt) => {
    if (opt.value === sortBy) return true
    // Map old values to new ones
    if (sortBy === "price_asc" && opt.value === "price_asc") return true
    if (sortBy === "price_desc" && opt.value === "price_desc") return true
    if (sortBy === "created_at" && opt.value === "created_at") return true
    return false
  }) || sortOptions[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span>Default sorting</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="py-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    option.value === currentOption.value
                      ? "bg-gray-50 text-gray-900 font-medium"
                      : "text-gray-700"
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