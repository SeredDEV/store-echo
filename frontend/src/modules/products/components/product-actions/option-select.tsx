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
      .map((v) => {
        if (typeof v === 'string') return v.trim()
        if (v && typeof v === 'object' && 'value' in v) return String(v.value).trim()
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
      <div
        className="flex flex-wrap gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const selected = isSelected(v)
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "min-w-[60px] px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all duration-200",
                {
                  "border-ui-border-interactive bg-ui-bg-interactive text-ui-fg-on-interactive shadow-sm": selected,
                  "border-ui-border-base bg-ui-bg-base text-ui-fg-base hover:border-ui-border-interactive hover:bg-ui-bg-subtle": !selected,
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
