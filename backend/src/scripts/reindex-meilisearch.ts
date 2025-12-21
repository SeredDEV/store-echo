import { ExecArgs } from "@medusajs/framework"
import { reindexProductsWorkflow } from "../workflows/reindex-products"

export default async function reindexMeilisearch({ container }: ExecArgs) {
  try {
    console.log("🔄 Iniciando reindexación de productos en Meilisearch...")

    const { result } = await reindexProductsWorkflow(container).run({
      input: {},
    })

    console.log(`✅ Reindexación completada: ${result.indexed} productos indexados`)
  } catch (error) {
    console.error("❌ Error durante la reindexación:", error)
    throw error
  }
}

