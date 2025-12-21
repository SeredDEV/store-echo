import { ExecArgs } from "@medusajs/framework"
import { MEILISEARCH_MODULE } from "../modules/meilisearch"
import { Modules } from "@medusajs/framework/utils"

export default async function reindexMeilisearchDirect({ container }: ExecArgs) {
  try {
    console.log("🔄 Iniciando reindexación directa de productos...")

    const meilisearchService = container.resolve(MEILISEARCH_MODULE)
    
    // Crear el índice si no existe
    await meilisearchService.ensureIndexExists("product")
    
    const productModuleService = container.resolve(Modules.PRODUCT)
    
    console.log("🔍 Obteniendo productos del módulo...")
    
    // Intentar diferentes métodos para obtener productos
    let allProducts: any[] = []
    
    try {
      // Método 1: Intentar con listProducts (si existe)
      if (typeof (productModuleService as any).listProducts === "function") {
        console.log("📦 Usando método listProducts...")
        allProducts = await (productModuleService as any).listProducts(
          {},
          {
            relations: ["variants", "images", "categories", "tags"],
          }
        ) || []
      }
      // Método 2: Intentar con listAndCount
      else if (typeof (productModuleService as any).listAndCount === "function") {
        console.log("📦 Usando método listAndCount...")
        const [products] = await (productModuleService as any).listAndCount(
          {},
          {
            relations: ["variants", "images", "categories", "tags"],
          }
        )
        allProducts = products || []
      }
      // Método 3: Intentar con query
      else if (typeof (productModuleService as any).query === "function") {
        console.log("📦 Usando método query...")
        allProducts = await (productModuleService as any).query(
          {},
          {
            relations: ["variants", "images", "categories", "tags"],
          }
        ) || []
      }
      else {
        console.log("⚠️  No se encontró método de listado disponible.")
        console.log("💡 Los productos se indexarán automáticamente cuando se creen/actualicen.")
        console.log("💡 Para indexar productos existentes, actualízalos desde el admin de Medusa.")
        return
      }
    } catch (error: any) {
      console.log("⚠️  Error obteniendo productos:", error.message)
      console.log("💡 Los productos se indexarán automáticamente cuando se creen/actualicen.")
      console.log("💡 Para indexar productos existentes, actualízalos desde el admin de Medusa.")
      return
    }
    
    if (allProducts.length === 0) {
      console.log("⚠️  No se encontraron productos para indexar.")
      console.log("✅ Índice creado. Los productos se indexarán cuando se creen.")
      return
    }
    
    console.log(`📦 Obtenidos ${allProducts.length} productos`)
    
    // Transformar productos para Meilisearch
    const searchableProducts = allProducts.map((product: any) => ({
      id: product.id,
      title: product.title,
      description: product.description || "",
      handle: product.handle,
      thumbnail: product.thumbnail || "",
      categories: product.categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        handle: cat.handle,
      })) || [],
      tags: product.tags?.map((tag: any) => ({
        id: tag.id,
        value: tag.value,
      })) || [],
    }))
    
    // Indexar productos
    console.log(`📝 Indexando ${searchableProducts.length} productos en Meilisearch...`)
    await meilisearchService.reindexAll(searchableProducts, "product")
    
    console.log(`✅ Reindexación completada: ${searchableProducts.length} productos indexados`)
  } catch (error: any) {
    console.error("❌ Error durante la reindexación:", error.message || error)
    throw error
  }
}

