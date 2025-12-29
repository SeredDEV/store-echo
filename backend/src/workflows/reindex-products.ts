import {
  createStep,
  createWorkflow,
  WorkflowResponse,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { MEILISEARCH_MODULE } from "../modules/meilisearch";

const fetchProductsStep = createStep(
  "fetch-products",
  async (_, { container }) => {
    const productModuleService = container.resolve(Modules.PRODUCT);

    // En Medusa v2, usamos el método listProducts() del módulo de productos
    // que devuelve un array de productos
    const products = await productModuleService.listProducts(
      {},
      {
        relations: ["variants", "images", "categories", "tags"],
      }
    );

    return new StepResponse(products || []);
  }
);

const transformProductsStep = createStep(
  "transform-products",
  async (products: any[]) => {
    const searchableProducts = products.map((product) => ({
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
    }));

    return new StepResponse(searchableProducts);
  }
);

const reindexProductsStep = createStep(
  "reindex-products",
  async (searchableProducts: any[], { container }) => {
    const meilisearchService = container.resolve(MEILISEARCH_MODULE);

    await meilisearchService.reindexAll(searchableProducts, "product");

    return new StepResponse({ indexed: searchableProducts.length });
  }
);

export const reindexProductsWorkflow = createWorkflow(
  "reindex-products",
  () => {
    const products = fetchProductsStep();
    const searchableProducts = transformProductsStep(products);
    const result = reindexProductsStep(searchableProducts);

    return new WorkflowResponse(result);
  }
);

export default reindexProductsWorkflow;
