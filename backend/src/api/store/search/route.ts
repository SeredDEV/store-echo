import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEILISEARCH_MODULE } from "../../../modules/meilisearch"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Verificar si el módulo de Meilisearch está disponible
  let meilisearchService;
  try {
    meilisearchService = req.scope.resolve(MEILISEARCH_MODULE);
  } catch {
    return res.status(503).json({
      message: "Search service is not available. Please configure Meilisearch.",
    });
  }

  const query = req.query.q as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  if (!query) {
    return res.json({
      hits: [],
      query: "",
      processingTimeMs: 0,
      limit,
      offset,
      estimatedTotalHits: 0,
    });
  }

  try {
    const searchResults = await meilisearchService.search(
      query,
      {
        limit,
        offset,
      },
      "product"
    );

    res.json(searchResults);
  } catch (error) {
    console.error("Error searching in Meilisearch:", error);
    res.status(500).json({
      message: "Error performing search",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

