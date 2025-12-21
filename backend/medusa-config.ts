import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
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
      key: "eventBusRedis",
      options: {
        redisUrl: process.env.EVENTS_REDIS_URL || process.env.REDIS_URL,
        // Opciones recomendadas para producción
        jobOptions: {
          removeOnComplete: {
            // Mantener trabajos completados por 1 hora o hasta 1000 trabajos
            age: 3600,
            count: 1000,
          },
          removeOnFail: {
            // Mantener trabajos fallidos por 1 hora o hasta 1000 trabajos
            age: 3600,
            count: 1000,
          },
        },
      },
    },
    // Redis Caching Module Provider - Para caché
    // Documentación: https://docs.medusajs.com/resources/infrastructure-modules/caching/providers/redis
    {
      resolve: "@medusajs/medusa/caching",
      key: "caching",
      options: {
        providers: [
          {
            resolve: "@medusajs/caching-redis",
            id: "caching-redis",
            is_default: true,
            options: {
              redisUrl: process.env.CACHE_REDIS_URL || process.env.REDIS_URL,
              ttl: 3600, // TTL por defecto: 1 hora
              prefix: "medusa:cache:", // Prefijo para las claves de caché
            },
          },
        ],
      },
    },
    // Redis Locking Module Provider - Para bloqueos distribuidos
    // Documentación: https://docs.medusajs.com/resources/infrastructure-modules/locking/redis
    {
      resolve: "@medusajs/medusa/locking",
      key: "locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-redis",
            id: "locking-redis",
            is_default: true,
            options: {
              redisUrl: process.env.LOCKING_REDIS_URL || process.env.REDIS_URL,
              namespace: "medusa_lock:",
              waitLockingTimeout: 5, // Timeout por defecto: 5 segundos
            },
          },
        ],
      },
    },
    // Redis Workflow Engine Module - Para workflows
    // Documentación: https://docs.medusajs.com/resources/infrastructure-modules/workflow-engine/redis
    // NOTA: Comentado temporalmente debido a error de resolución de 'sharedContainer'
    // Descomentar cuando se resuelva el problema de dependencias
    // {
    //   resolve: "@medusajs/medusa/workflow-engine-redis",
    //   key: "workflowEngineRedis",
    //   options: {
    //     redis: {
    //       redisUrl: process.env.WE_REDIS_URL || process.env.REDIS_URL,
    //     },
    //   },
    // },
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
  ],
});
