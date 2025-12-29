import type { ExecArgs } from "@medusajs/framework/types";
import { MEILISEARCH_MODULE } from "../modules/meilisearch";

export default async function reindexMeilisearchSimple({
  container,
}: ExecArgs) {
  try {
    console.log(
      "🔄 Iniciando reindexación simple de productos en Meilisearch..."
    );

    const meilisearchService = container.resolve(MEILISEARCH_MODULE);

    // Crear el índice si no existe
    await meilisearchService.ensureIndexExists("product");

    // Por ahora, solo creamos el índice vacío
    // Los productos se indexarán automáticamente cuando se creen/actualicen
    // o puedes crear productos manualmente para probar

    console.log("✅ Índice 'products' creado en Meilisearch");
    console.log(
      "ℹ️  Los productos se indexarán automáticamente cuando se creen o actualicen"
    );
    console.log(
      "ℹ️  Para indexar productos existentes, créalos o actualízalos desde el admin"
    );
  } catch (error) {
    console.error("❌ Error durante la reindexación:", error);
    throw error;
  }
}
