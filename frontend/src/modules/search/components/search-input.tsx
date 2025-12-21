"use client"

import { MagnifyingGlass } from "@medusajs/icons"
import { useSearchModal } from "./search-wrapper"

export function SearchInput() {
  const { openModal } = useSearchModal()

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Solo abrir el modal cuando el usuario hace clic explícitamente
    openModal()
  }

  // Removemos onFocus para evitar que se abra automáticamente
  // Solo se abre con click explícito

  return (
    <div className="flex-1 relative">
      <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Search your favorite product..."
        onClick={handleClick}
        readOnly
        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all cursor-pointer"
      />
    </div>
  )
}

