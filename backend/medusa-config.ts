import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  admin: {
    // Configuración de Vite para el Admin (devcontainer compatible)
    vite: (config) => {
      return {
        ...config,
        server: {
          ...config.server,
          hmr: false, // Desactivar HMR para evitar errores en devcontainer
        },
      };
    },
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      ssl: false,
    },
    redisUrl: process.env.REDIS_URL, // Configuración de Redis
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    // Redis Event Module - Para el sistema de eventos pub/sub
    // Documentación: https://docs.medusajs.com/resources/infrastructure-modules/event/redis
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.EVENTS_REDIS_URL,
      },
    },
    // Redis Caching Module Provider - Para caché
    // Documentación: https://docs.medusajs.com/resources/infrastructure-modules/caching/providers/redis
    {
      resolve: "@medusajs/medusa/caching",
      options: {
        providers: [
          {
            resolve: "@medusajs/caching-redis",
            id: "caching-redis",
            is_default: true,
            options: {
              redisUrl: process.env.CACHE_REDIS_URL,
            },
          },
        ],
      },
    },
    // Redis Locking Module Provider - Para bloqueos distribuidos
    // Documentación: https://docs.medusajs.com/resources/infrastructure-modules/locking/redis
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-redis",
            id: "locking-redis",
            is_default: true,
            options: {
              redisUrl: process.env.LOCKING_REDIS_URL,
            },
          },
        ],
      },
    },
    // Redis Workflow Engine Module - Para workflows
    // Documentación: https://docs.medusajs.com/resources/infrastructure-modules/workflow-engine/redis
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          redisUrl: process.env.WE_REDIS_URL,
        },
      },
    },
    // Fulfillment Module - Para gestión de envíos
    // Documentación: https://docs.medusajs.com/resources/commerce-modules/fulfillment
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
        ],
      },
    },
    // Meilisearch Module - Para búsqueda avanzada
    // Solo se carga si MEILISEARCH_HOST está configurado
    ...(process.env.MEILISEARCH_HOST
      ? [
          {
            resolve: "./src/modules/meilisearch",
            options: {
              host: process.env.MEILISEARCH_HOST,
              apiKey: process.env.MEILISEARCH_API_KEY || undefined,
              productIndexName:
                process.env.MEILISEARCH_PRODUCT_INDEX_NAME || "products",
            },
          },
        ]
      : []),
    // Brand Module - Módulo personalizado para gestión de marcas
    {
      resolve: "./src/modules/brand",
    },
    // Strapi Module - Para gestión de contenido con CMS
    // Solo se carga si STRAPI_API_URL y STRAPI_API_TOKEN están configurados
    ...(process.env.STRAPI_API_URL && process.env.STRAPI_API_TOKEN
      ? [
          {
            resolve: "./src/modules/strapi",
            options: {
              apiUrl: process.env.STRAPI_API_URL || "http://localhost:1337/api",
              apiToken: process.env.STRAPI_API_TOKEN || "",
              defaultLocale: process.env.STRAPI_DEFAULT_LOCALE || "en",
            },
          },
        ]
      : []),
  ],
});
