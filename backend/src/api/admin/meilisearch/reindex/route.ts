import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reindexProductsWorkflow } from "../../../../workflows/reindex-products"
import { MEILISEARCH_MODULE } from "../../../../modules/meilisearch"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Verificar si el módulo de Meilisearch está disponible
  try {
    req.scope.resolve(MEILISEARCH_MODULE);
  } catch {
    return res.status(503).json({
      message: "Meilisearch module is not available. Please configure Meilisearch.",
    });
  }

  try {
    const { result } = await reindexProductsWorkflow(req.scope).run({
      input: {},
    });

    res.json({
      message: "Products reindexed successfully",
      indexed: result.indexed,
    });
  } catch (error) {
    console.error("Error reindexing products:", error);
    res.status(500).json({
      message: "Error reindexing products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

