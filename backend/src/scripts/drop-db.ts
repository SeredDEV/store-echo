import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default async function dropDatabase({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

    logger.info("🗑️  ELIMINANDO BASE DE DATOS COMPLETA...");

    try {
        const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@postgres:5432/store_echo";

        // Extraer el nombre de la base de datos de la URL
        const dbName = dbUrl.split("/").pop()?.split("?")[0] || "store_echo";
        const baseUrl = dbUrl.substring(0, dbUrl.lastIndexOf("/"));

        logger.info(`📦 Base de datos: ${dbName}`);

        // PASO 1: Terminar todas las conexiones activas a la base de datos
        logger.info("🔌 Cerrando todas las conexiones a la base de datos...");
        const terminateCmd = `psql "${baseUrl}/postgres" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`;
        try {
            await execAsync(terminateCmd);
            logger.info("✅ Conexiones cerradas");
        } catch (error) {
            // Ignorar errores si no hay conexiones
            logger.info("⚠️  No había conexiones activas o ya estaban cerradas");
        }

        // PASO 2: Eliminar la base de datos
        logger.info("🗑️  Eliminando base de datos...");
        const dropCmd = `psql "${baseUrl}/postgres" -c "DROP DATABASE IF EXISTS ${dbName};"`;
        await execAsync(dropCmd);
        logger.info(`✅ Base de datos ${dbName} eliminada`);

        // PASO 3: Crear la base de datos de nuevo
        logger.info("🏗️  Creando base de datos nueva...");
        const createCmd = `psql "${baseUrl}/postgres" -c "CREATE DATABASE ${dbName};"`;
        await execAsync(createCmd);
        logger.info(`✅ Base de datos ${dbName} creada de nuevo`);

        logger.info("✅✅✅ BASE DE DATOS RECREADA EXITOSAMENTE ✅✅✅");
        logger.info("🔄 Ahora ejecutando migraciones y seed...");
    } catch (error) {
        logger.error("❌ Error eliminando la base de datos:", error);
        throw error;
    }
}
