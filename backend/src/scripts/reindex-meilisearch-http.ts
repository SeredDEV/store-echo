import { ExecArgs } from "@medusajs/framework"
import { MEILISEARCH_MODULE } from "../modules/meilisearch"

export default async function reindexMeilisearchHttp({ container }: ExecArgs) {
  try {
    console.log("🔄 Iniciando reindexación de productos usando API HTTP...")

    const meilisearchService = container.resolve(MEILISEARCH_MODULE)
    
    // Crear el índice si no existe
    await meilisearchService.ensureIndexExists("product")
    
    // Obtener productos usando la API HTTP de Medusa
    const baseUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    
    // Obtener todas las regiones primero
    const regionsResponse = await fetch(`${baseUrl}/store/regions`, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    
    if (!regionsResponse.ok) {
      throw new Error(`Error obteniendo regiones: ${regionsResponse.statusText}`)
    }
    
    const regionsData = await regionsResponse.json()
    const regions = regionsData.regions || []
    
    if (regions.length === 0) {
      console.log("⚠️  No se encontraron regiones. Creando productos vacíos...")
      console.log("✅ Índice creado. Los productos se indexarán cuando se creen.")
      return
    }
    
    // Usar la primera región disponible
    const region = regions[0]
    console.log(`📍 Usando región: ${region.name} (${region.id})`)
    
    // Obtener todos los productos (usar un límite alto)
    let allProducts: any[] = []
    let offset = 0
    const limit = 100
    let hasMore = true
    
    while (hasMore) {
      const productsResponse = await fetch(
        `${baseUrl}/store/products?region_id=${region.id}&limit=${limit}&offset=${offset}&fields=*variants,*images,*categories,*tags`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      
      if (!productsResponse.ok) {
        throw new Error(`Error obteniendo productos: ${productsResponse.statusText}`)
      }
      
      const productsData = await productsResponse.json()
      const products = productsData.products || []
      const count = productsData.count || 0
      
      allProducts = [...allProducts, ...products]
      
      console.log(`📦 Obtenidos ${products.length} productos (total: ${allProducts.length}/${count})`)
      
      offset += limit
      hasMore = allProducts.length < count
    }
    
    if (allProducts.length === 0) {
      console.log("⚠️  No se encontraron productos para indexar.")
      console.log("✅ Índice creado. Los productos se indexarán cuando se creen.")
      return
    }
    
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

