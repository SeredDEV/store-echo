"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at",
    label: "Latest Arrivals",
  },
  {
    value: "price_asc",
    label: "Price: Low -> High",
  },
  {
    value: "price_desc",
    label: "Price: High -> Low",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <div className="space-y-2">
      {sortOptions.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer hover:text-gray-900 transition-colors"
        >
          <input
            type="radio"
            name="sort"
            value={option.value}
            checked={option.value === sortBy}
            onChange={() => handleChange(option.value as SortOptions)}
            className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
          />
          <span className="text-sm text-gray-600">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

export default SortProducts
