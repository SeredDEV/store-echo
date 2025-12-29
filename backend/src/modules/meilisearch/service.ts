import { MedusaError } from "@medusajs/framework/utils";

type MeilisearchOptions = {
  host: string;
  apiKey?: string;
  productIndexName: string;
};

export type MeilisearchIndexType = "product";

export default class MeilisearchModuleService {
  private client: any;
  private options: MeilisearchOptions;

  constructor({}, options: MeilisearchOptions) {
    if (!options.host || !options.productIndexName) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Meilisearch host and productIndexName are required"
      );
    }
    // API key es opcional para desarrollo local
    const clientOptions: { host: string; apiKey?: string } = {
      host: options.host,
    };
    if (options.apiKey) {
      clientOptions.apiKey = options.apiKey;
    }
    // Usar require para MeiliSearch para evitar problemas con ESM/CommonJS
    const { MeiliSearch } = require("meilisearch");
    this.client = new MeiliSearch(clientOptions);
    this.options = options;

    // Crear el índice automáticamente al inicializar (async, no bloquea)
    this.ensureIndexExists("product").catch((error) => {
      console.warn(
        "No se pudo crear el índice de Meilisearch al inicializar:",
        error.message
      );
    });
  }

  async getIndexName(type: MeilisearchIndexType) {
    switch (type) {
      case "product":
        return this.options.productIndexName;
      default:
        throw new Error(`Invalid index type: ${type}`);
    }
  }

  async ensureIndexExists(type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type);
    try {
      // Intentar obtener el índice, si no existe se creará automáticamente
      const index = this.client.index(indexName);
      // Verificar si el índice existe intentando obtener sus settings
      await index.getSettings();
    } catch (error: any) {
      // Si el índice no existe, crearlo explícitamente
      if (
        error.code === "index_not_found" ||
        error.message?.includes("not found")
      ) {
        await this.client.createIndex(indexName, { primaryKey: "id" });
      } else {
        throw error;
      }
    }
  }

  async indexData(
    data: Record<string, unknown>[],
    type: MeilisearchIndexType = "product"
  ) {
    const indexName = await this.getIndexName(type);

    // Asegurar que el índice existe
    await this.ensureIndexExists(type);

    const index = this.client.index(indexName);

    // Transform data to include id as primary key for Meilisearch
    const documents = data.map((item) => ({
      ...item,
      id: item.id,
    }));

    await index.addDocuments(documents);
  }

  async deleteData(ids: string[], type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type);
    const index = this.client.index(indexName);

    await index.deleteDocuments(ids);
  }

  async search(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      filter?: string;
    } = {},
    type: MeilisearchIndexType = "product"
  ) {
    const indexName = await this.getIndexName(type);
    const index = this.client.index(indexName);

    const searchOptions: {
      limit?: number;
      offset?: number;
      filter?: string;
    } = {};

    if (options.limit) {
      searchOptions.limit = options.limit;
    }

    if (options.offset) {
      searchOptions.offset = options.offset;
    }

    if (options.filter) {
      searchOptions.filter = options.filter;
    }

    return await index.search(query, searchOptions);
  }

  async reindexAll(
    data: Record<string, unknown>[],
    type: MeilisearchIndexType = "product"
  ) {
    const indexName = await this.getIndexName(type);

    // Asegurar que el índice existe
    await this.ensureIndexExists(type);

    const index = this.client.index(indexName);

    // Delete all documents first (si existen)
    try {
      await index.deleteAllDocuments();
    } catch (error) {
      // Si no hay documentos, continuar
    }

    // Then add all documents
    const documents = data.map((item) => ({
      ...item,
      id: item.id,
    }));

    if (documents.length > 0) {
      await index.addDocuments(documents);
    }
  }

  async clearAll(type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type);
    const index = this.client.index(indexName);

    try {
      await index.deleteAllDocuments();
      return {
        success: true,
        message: `Todos los documentos del índice '${indexName}' han sido eliminados`,
      };
    } catch (error: any) {
      throw new Error(`Error al limpiar el índice: ${error.message || error}`);
    }
  }
}
