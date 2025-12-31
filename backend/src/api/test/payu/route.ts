import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * Endpoint de prueba para PayU
 * GET http://localhost:9000/test/payu
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

  try {
    // Listar proveedores de pago disponibles
    const providers = await paymentModuleService.listPaymentProviders();

    // Verificar si PayU está disponible (Medusa agrega prefijo pp_payu_)
    const payuProvider = providers.find((p) => p.id.includes("payu"));

    if (!payuProvider) {
      return res.json({
        status: "error",
        message: "PayU provider not found. Available providers:",
        providers: providers.map((p) => ({
          id: p.id,
          is_enabled: p.is_enabled,
        })),
        hint: "Make sure PayU is configured in medusa-config.ts and server has restarted",
      });
    }

    return res.json({
      status: "success",
      message: "✅ PayU provider is available and working!",
      provider: {
        id: payuProvider.id,
        is_enabled: payuProvider.is_enabled,
      },
      all_providers: providers.map((p) => p.id),
      credentials: {
        merchantId: process.env.PAYU_MERCHANT_ID,
        accountId: process.env.PAYU_ACCOUNT_ID,
        testMode: process.env.PAYU_TEST_MODE === "true",
      },
      testCards: {
        approved_visa: {
          card: "4111111111111111",
          cvv: "777",
          name: "APPROVED",
          expiry: "12/25",
          description: "Transacción aprobada",
        },
        rejected_visa: {
          card: "4111111111111111",
          cvv: "666",
          name: "REJECTED",
          expiry: "12/25",
          description: "Transacción rechazada",
        },
        approved_mastercard: {
          card: "5500000000000004",
          cvv: "777",
          name: "APPROVED",
          expiry: "12/25",
          description: "Transacción aprobada",
        },
      },
      docs: {
        sandbox_url:
          "https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi",
        documentation: "https://developers.payulatam.com/latam/es/docs.html",
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
      stack: error.stack,
    });
  }
};

/**
 * Endpoint para crear un pago de prueba con PayU
 * POST http://localhost:9000/test/payu
 * Body: { "amount": 50000, "currency": "COP" }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

  try {
    const { amount = 50000, currency = "COP" } = req.body as any;

    // Obtener el ID correcto del provider de PayU
    const providers = await paymentModuleService.listPaymentProviders();
    const payuProvider = providers.find((p) => p.id.includes("payu"));

    if (!payuProvider) {
      return res.status(404).json({
        status: "error",
        message: "PayU provider not found",
        available_providers: providers.map((p) => p.id),
      });
    }

    // Crear una payment collection
    const paymentCollection =
      await paymentModuleService.createPaymentCollections({
        currency_code: currency,
        amount: amount,
      });

    // Crear una sesión de pago con PayU usando el ID correcto
    const paymentSession = await paymentModuleService.createPaymentSession(
      paymentCollection.id,
      {
        provider_id: payuProvider.id, // Usar el ID correcto (pp_payu_payu)
        currency_code: currency,
        amount: amount,
        data: {
          description: "Test payment from Medusa",
          customer_email: "test@example.com",
        },
      }
    );

    return res.json({
      status: "success",
      message: "✅ Payment session created with PayU",
      paymentCollection: paymentCollection,
      paymentSession: paymentSession,
      provider_used: payuProvider.id,
      test_instructions: {
        approved: "Use card 4111111111111111 with CVV 777 and name APPROVED",
        rejected: "Use card 4111111111111111 with CVV 666 and name REJECTED",
      },
      nextSteps: {
        1: "Authorize the payment using the session ID",
        2: "Check PayU sandbox dashboard for transaction details",
        3: "Implement webhook to receive payment confirmations",
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
      stack: error.stack,
    });
  }
};
