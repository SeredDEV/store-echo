"use client"

import { useState, useEffect, useRef } from "react"
import { MagnifyingGlass } from "@medusajs/icons"
import { InstantSearch, Hits, useSearchBox, useHits } from "react-instantsearch"
import { searchClient } from "../../../lib/config"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname } from "next/navigation"

type Hit = {
  id: string
  title: string
  description: string
  handle: string
  thumbnail: string
  categories: {
    id: string
    name: string
    handle: string
  }[]
  tags: {
    id: string
    value: string
  }[]
}

// Componente interno que maneja la búsqueda
function SearchContent({ onShowResultsChange }: { onShowResultsChange: (show: boolean) => void }) {
  const { query, refine } = useSearchBox()
  const { hits } = useHits<Hit>()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    // Mostrar resultados si hay query y está enfocado
    onShowResultsChange(isFocused && query.length > 0 && hits.length > 0)
  }, [query, hits, isFocused, onShowResultsChange])

  return (
    <>
      <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => refine(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Delay para permitir clicks en los resultados
          setTimeout(() => setIsFocused(false), 200)
        }}
        placeholder="Search your favorite product..."
        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
      />
    </>
  )
}

// Componente para cada resultado
const Hit = ({ hit }: { hit: Hit }) => {
  return (
    <LocalizedClientLink
      href={`/products/${hit.handle}`}
      className="flex flex-row gap-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors relative block"
    >
      {hit.thumbnail && (
        <div className="relative w-20 h-20 flex-shrink-0">
          <Image
            src={hit.thumbnail}
            alt={hit.title}
            fill
            className="object-cover rounded-lg"
          />
        </div>
      )}
      <div className="flex flex-col gap-y-1 flex-1">
        <h3 className="text-base font-medium text-gray-900">{hit.title}</h3>
        {hit.description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {hit.description}
          </p>
        )}
        {hit.categories && hit.categories.length > 0 && (
          <div className="flex gap-2 mt-1">
            {hit.categories.slice(0, 2).map((cat) => (
              <span
                key={cat.id}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </LocalizedClientLink>
  )
}

// Componente para mostrar los resultados
function SearchResults({ showResults }: { showResults: boolean }) {
  const { hits } = useHits<Hit>()

  if (!showResults || hits.length === 0) {
    return null
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="p-2 space-y-2">
        {hits.map((hit) => (
          <Hit key={hit.id} hit={hit} />
        ))}
      </div>
    </div>
  )
}

export default function SearchBar() {
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const indexName = process.env.NEXT_PUBLIC_MEILISEARCH_INDEX_NAME || "products"

  // Cerrar resultados cuando cambia la ruta
  useEffect(() => {
    setShowResults(false)
  }, [pathname])

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if (!searchClient) {
    return (
      <div className="flex-1 relative">
        <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search your favorite product..."
          disabled
          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 placeholder-gray-400 opacity-50"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 relative" ref={containerRef}>
      <InstantSearch
        // @ts-expect-error - searchClient type issue
        searchClient={searchClient}
        indexName={indexName}
      >
        <div className="relative">
          <div className="relative">
            <SearchContent onShowResultsChange={setShowResults} />
          </div>

          <SearchResults showResults={showResults} />
        </div>
      </InstantSearch>
    </div>
  )
}

