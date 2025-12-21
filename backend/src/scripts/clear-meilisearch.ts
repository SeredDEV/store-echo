import { ExecArgs } from "@medusajs/framework"
import { MEILISEARCH_MODULE } from "../modules/meilisearch"

export default async function clearMeilisearch({ container }: ExecArgs) {
  try {
    console.log("🗑️  Limpiando todos los productos de Meilisearch...")

    const meilisearchService = container.resolve(MEILISEARCH_MODULE)
    
    // Asegurar que el índice existe
    await meilisearchService.ensureIndexExists("product")
    
    // Limpiar todos los documentos
    const result = await meilisearchService.clearAll("product")
    
    console.log(`✅ ${result.message}`)
  } catch (error: any) {
    console.error("❌ Error durante la limpieza:", error.message || error)
    throw error
  }
}

