import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * GET /debug/payment-providers
 * Debug endpoint para verificar payment providers y regiones
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve("logger");

  try {
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT);
    const regionModuleService = req.scope.resolve(Modules.REGION);

    // Listar todos los providers
    const providers = await paymentModuleService.listPaymentProviders();

    // Listar todas las regiones
    const regions = await regionModuleService.listRegions({});

    const debug = {
      timestamp: new Date().toISOString(),
      providers: providers.map((p: any) => ({
        id: p.id,
        is_enabled: p.is_enabled,
      })),
      regions: regions.map((r: any) => ({
        id: r.id,
        name: r.name,
        currency_code: r.currency_code,
        payment_providers: r.payment_providers,
      })),
    };

    logger.info(
      `🔍 Debug payment providers: ${JSON.stringify(debug, null, 2)}`
    );

    return res.json(debug);
  } catch (error: any) {
    logger.error(`❌ Error en debug: ${error?.message || error}`);
    return res.status(500).json({
      error: error?.message || "Unknown error",
    });
  }
};
