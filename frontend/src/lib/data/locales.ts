"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type Locale = {
  code: string
  name: string
}

/**
 * Fetches available locales from the backend.
 * Returns null if the endpoint returns 404 (locales not configured).
 */
export const listLocales = async (): Promise<Locale[] | null> => {
  const next = {
    ...(await getCacheOptions("locales")),
  }

  return sdk.client
    .fetch<{ locales: Locale[] }>(`/store/locales`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ locales }) => locales)
    .catch((error) => {
      // Return null on 404 to hide selector (locales not configured)
      if (error?.response?.status === 404 || error?.message?.includes("Not Found")) {
        return null
      }
      // Only log unexpected errors
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch locales:", error)
      }
      return null
    })
}
