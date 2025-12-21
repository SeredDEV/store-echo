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
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">Select {title}</span>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const selected = isSelected(v)
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 flex-1 ",
                {
                  "border-ui-border-interactive": selected,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
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
