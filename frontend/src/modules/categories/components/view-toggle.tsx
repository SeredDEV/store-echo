"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export type ViewMode = "list" | "grid-2" | "grid-3"

type ViewToggleProps = {
  currentView?: ViewMode
}

export default function ViewToggle({ currentView = "grid-3" }: ViewToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const view = (searchParams.get("view") as ViewMode) || currentView

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleViewChange = (newView: ViewMode) => {
    const query = createQueryString("view", newView)
    router.push(`${pathname}?${query}`)
  }

  return (
    <div className="inline-flex items-center gap-0 border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* List View */}
      <button
        onClick={() => handleViewChange("list")}
        className={`flex items-center justify-center w-10 h-10 transition-all duration-200 ${
          view === "list"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
        aria-label="List view"
        title="List view"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Grid 3 Columns */}
      <button
        onClick={() => handleViewChange("grid-2")}
        className={`flex items-center justify-center w-10 h-10 transition-all duration-200 border-l border-r border-gray-300 ${
          view === "grid-2"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
        aria-label="3 column grid view"
        title="3 column grid view"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          {/* 3 líneas verticales */}
          <line x1="6" y1="4" x2="6" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="18" y1="4" x2="18" y2="20" />
        </svg>
      </button>

      {/* Grid 4 Columns */}
      <button
        onClick={() => handleViewChange("grid-3")}
        className={`flex items-center justify-center w-10 h-10 transition-all duration-200 ${
          view === "grid-3"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
        aria-label="4 column grid view"
        title="4 column grid view"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          {/* 4 líneas verticales */}
          <line x1="5" y1="4" x2="5" y2="20" />
          <line x1="10" y1="4" x2="10" y2="20" />
          <line x1="15" y1="4" x2="15" y2="20" />
          <line x1="20" y1="4" x2="20" y2="20" />
        </svg>
      </button>
    </div>
  )
}