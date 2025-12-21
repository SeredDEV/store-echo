"use client"

import React, { useEffect, useRef } from "react"
import { Hits, InstantSearch, SearchBox } from "react-instantsearch"
import { searchClient } from "../../../../lib/config"
import Modal from "../../../common/components/modal"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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

type SearchModalProps = {
  isOpen: boolean
  closeModal: () => void
}



export default function SearchModal({ isOpen, closeModal }: SearchModalProps) {
  const indexName = process.env.NEXT_PUBLIC_MEILISEARCH_INDEX_NAME || "products"
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && searchContainerRef.current) {
      // Enfocar el input cuando el modal se abre
      setTimeout(() => {
        const input = searchContainerRef.current?.querySelector('input[type="search"]') as HTMLInputElement
        if (input) {
          input.focus()
          input.select()
        }
      }, 150)
    }
  }, [isOpen])

  if (!searchClient) {
    return (
      <Modal isOpen={isOpen} close={closeModal} search>
        <div className="w-full p-4">
          <p className="text-red-500">Error: Meilisearch no está configurado correctamente</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} close={closeModal} search>
        <InstantSearch
          // @ts-expect-error - searchClient type issue
          searchClient={searchClient}
          indexName={indexName}
        >
          <div className="w-full">
            <div className="mb-4" ref={searchContainerRef}>
              <SearchBox
                className="w-full [&_input]:w-full [&_input]:outline-none [&_input]:px-4 [&_input]:py-3 [&_input]:rounded-lg [&_input]:bg-white [&_input]:border [&_input]:border-gray-300 [&_input]:text-gray-900 [&_input]:placeholder-gray-400 [&_button]:hidden"
                placeholder="Search products..."
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <Hits 
                hitComponent={(props: any) => <Hit key={props.hit.id} hit={props.hit} closeModal={closeModal} />}
                classNames={{
                  list: "space-y-2",
                }}
              />
            </div>
          </div>
        </InstantSearch>
      </Modal>
  )
}


const Hit = ({ hit, closeModal }: { hit: Hit; closeModal: () => void }) => {
  const handleClick = () => {
    // Cerrar el modal cuando se hace clic en un producto
    closeModal()
  }

  return (
    <LocalizedClientLink
      href={`/products/${hit.handle}`}
      onClick={handleClick}
      className="flex flex-row gap-x-4 mt-4 p-4 rounded-lg hover:bg-gray-50 transition-colors relative block"
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

