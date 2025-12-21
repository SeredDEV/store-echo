import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { MEILISEARCH_MODULE } from "../modules/meilisearch";

export default async function productCreatedHandler({
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

    const productModuleService = container.resolve("product");

    const product = await productModuleService.retrieveProduct(data.id, {
      relations: ["variants", "images", "categories", "tags"],
    });

    // Transform product data for Meilisearch
    const searchableProduct = {
      id: product.id,
      title: product.title,
      description: product.description || "",
      handle: product.handle,
      thumbnail: product.thumbnail || "",
      categories:
        product.categories?.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          handle: cat.handle,
        })) || [],
      tags:
        product.tags?.map((tag: any) => ({
          id: tag.id,
          value: tag.value,
        })) || [],
    };

    await meilisearchService.indexData([searchableProduct], "product");
  } catch (error) {
    console.error("Error indexing product in Meilisearch:", error);
  }
}

export const config: SubscriberConfig = {
  event: "product.created",
};
