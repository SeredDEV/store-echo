"use server"

import { revalidateTag } from "next/cache"
import { getCacheTag } from "./cookies"

/**
 * Revalida el caché de productos para asegurar datos frescos
 */
export async function revalidateProductsCache() {
  const productsCacheTag = await getCacheTag("products")
  if (productsCacheTag) {
    revalidateTag(productsCacheTag)
  }
}

