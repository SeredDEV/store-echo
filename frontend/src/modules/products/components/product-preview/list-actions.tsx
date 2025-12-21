"use client"

import { useRouter } from "next/navigation"

type ListActionsProps = {
  productHandle?: string
}

export default function ListActions({ productHandle }: ListActionsProps) {
  const router = useRouter()

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (productHandle) {
      router.push(`/products/${productHandle}`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleView}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-[#1F2937] hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>View</span>
      </button>
      <button 
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          // Lógica para favoritos
        }}
        className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
        aria-label="Add to favorites"
        title="Add to favorites"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>
  )
}
