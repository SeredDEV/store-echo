import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { MEILISEARCH_MODULE } from "../modules/meilisearch";

export default async function productDeletedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    // Verificar si el módulo de Meilisearch está disponible
    let meilisearchService;
    try {
      meilisearchService = container.resolve(MEILISEARCH_MODULE);
    } catch {
      // Módulo no disponible, salir silenciosamente
      return;
    }

    await meilisearchService.deleteData([data.id], "product");
  } catch (error) {
    console.error("Error deleting product from Meilisearch:", error);
  }
}

export const config: SubscriberConfig = {
  event: "product.deleted",
};
