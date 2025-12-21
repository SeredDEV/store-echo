"use client"

import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react"
import { ChevronDown } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Fragment, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CategoryDropdownProps = {
  categories: HttpTypes.StoreProductCategory[]
}

export default function CategoryDropdown({ categories }: CategoryDropdownProps) {
  const [selected, setSelected] = useState<HttpTypes.StoreProductCategory | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (category: HttpTypes.StoreProductCategory | null) => {
    setSelected(category)
    if (category) {
      router.push(`/categories/${category.handle}`)
    } else {
      router.push("/store")
    }
  }

  // Filtrar solo categorías principales (sin parent)
  const mainCategories = categories?.filter((cat) => !cat.parent_category) || []

  return (
    <Listbox value={selected} onChange={handleChange}>
      <div className="relative">
        <ListboxButton className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap w-full">
          <span>{selected ? selected.name : "All Categories"}</span>
          <ChevronDown className="w-4 h-4" />
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-auto">
            <ListboxOption
              value={null}
              className={({ active }) =>
                `px-4 py-2 cursor-pointer ${
                  active ? "bg-gray-100" : "bg-white"
                }`
              }
            >
              <LocalizedClientLink
                href="/store"
                className="block text-sm text-gray-700 hover:text-gray-900"
              >
                All Categories
              </LocalizedClientLink>
            </ListboxOption>
            {mainCategories.map((category) => (
              <ListboxOption
                key={category.id}
                value={category}
                className={({ active }) =>
                  `px-4 py-2 cursor-pointer ${
                    active ? "bg-gray-100" : "bg-white"
                  }`
                }
              >
                <LocalizedClientLink
                  href={`/categories/${category.handle}`}
                  className="block text-sm text-gray-700 hover:text-gray-900"
                >
                  {category.name}
                </LocalizedClientLink>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  )
}

