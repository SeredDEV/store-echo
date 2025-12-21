"use client"

import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react"
import { usePathname } from "next/navigation"
import SearchModal from "./modal"
import { SearchInput } from "./search-input"

// Context para controlar el modal desde fuera
const SearchModalContext = createContext<{
  openModal: () => void
  closeModal: () => void
} | null>(null)

export const useSearchModal = () => {
  const context = useContext(SearchModalContext)
  if (!context) {
    throw new Error("useSearchModal must be used within SearchWrapper")
  }
  return context
}

export default function SearchWrapper() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)
  const isNavigatingRef = useRef(false)

  useEffect(() => {
    // Cerrar el modal cuando cambia la ruta (navegación a otro producto)
    if (prevPathnameRef.current !== pathname) {
      setIsOpen(false)
      prevPathnameRef.current = pathname
      isNavigatingRef.current = true
      // Resetear el flag después de un momento para permitir que se abra manualmente
      setTimeout(() => {
        isNavigatingRef.current = false
      }, 1000)
    }
  }, [pathname])

  const openModal = useCallback(() => {
    // Solo abrir si NO estamos navegando y el usuario hace clic explícitamente
    if (!isNavigatingRef.current) {
      setIsOpen(true)
    }
  }, [])
  
  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <SearchModalContext.Provider value={{ openModal, closeModal }}>
      <SearchInput />
      <SearchModal isOpen={isOpen} closeModal={closeModal} />
    </SearchModalContext.Provider>
  )
}

