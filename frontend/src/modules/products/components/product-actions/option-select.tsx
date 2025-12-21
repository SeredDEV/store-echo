import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React, { useMemo } from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (optionId: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = useMemo(() => {
    if (!option.values || !Array.isArray(option.values)) return []
    // Handle both array of strings and array of objects with value property
    return option.values
      .map((v: any) => {
        if (typeof v === "string") return v.trim()
        if (v && typeof v === "object" && "value" in v)
          return String(v.value).trim()
        return null
      })
      .filter((v): v is string => v !== null && v !== undefined)
  }, [option.values])

  const isSelected = (value: string) => {
    if (!current) return false
    // Normalize comparison: trim whitespace
    return value.trim() === current.trim()
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold text-ui-fg-base uppercase tracking-wide">
        {title}
      </span>
      <div className="flex flex-wrap gap-2" data-testid={dataTestId}>
        {filteredOptions.map((v) => {
          const selected = isSelected(v)
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "min-w-[60px] px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300",
                {
                  "bg-gray-900 text-white border-2 border-gray-900 shadow-lg hover:bg-gray-800 hover:shadow-xl transform scale-105":
                    selected,
                  "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50":
                    !selected,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
