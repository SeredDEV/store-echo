import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * POST /test/payu-authorize
 * Prueba la autorización de un payment session de PayU
 *
 * Body:
 * {
 *   "payment_session_id": "payses_...",
 *   "test_card": "approved" | "rejected" | "pending"
 * }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve("logger");

  try {
    const body = req.body as any;
    const { payment_session_id, test_card = "approved" } = body;

    if (!payment_session_id) {
      return res.status(400).json({
        error: "payment_session_id es requerido",
      });
    }

    logger.info(`🧪 Probando autorización para session: ${payment_session_id}`);

    const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

    // Datos de tarjetas de prueba según PayU
    const testCards: Record<string, any> = {
      approved: {
        card_number: "4111111111111111",
        cvv: "777",
        expiry_month: "12",
        expiry_year: "2025",
        holder_name: "APPROVED",
        card_type: "VISA",
        expected_state: "4", // Aprobado
      },
      rejected: {
        card_number: "4111111111111111",
        cvv: "666",
        expiry_month: "12",
        expiry_year: "2025",
        holder_name: "REJECTED",
        card_type: "VISA",
        expected_state: "6", // Rechazado
      },
      pending: {
        card_number: "4111111111111111",
        cvv: "333",
        expiry_month: "12",
        expiry_year: "2025",
        holder_name: "PENDING",
        card_type: "VISA",
        expected_state: "7", // Pendiente
      },
    };

    const cardData = testCards[test_card];
    if (!cardData) {
      return res.status(400).json({
        error: `test_card debe ser: approved, rejected o pending`,
        available: Object.keys(testCards),
      });
    }

    logger.info(
      `💳 Usando tarjeta de prueba: ${test_card} - CVV: ${cardData.cvv}`
    );

    // Obtener la payment session
    const paymentSession = await paymentModuleService.retrievePaymentSession(
      payment_session_id
    );

    if (!paymentSession) {
      return res.status(404).json({
        error: "Payment session no encontrada",
      });
    }

    logger.info(`✅ Payment session encontrada: ${paymentSession.id}`);
    logger.info(`📊 Estado actual: ${paymentSession.status}`);

    // Intentar autorizar el pago
    try {
      logger.info(`🔐 Intentando autorizar pago con PayU...`);

      const authorized = await paymentModuleService.authorizePaymentSession(
        payment_session_id,
        {
          // Datos de la tarjeta de prueba
          ...cardData,
          // Información del comprador (opcional pero recomendado)
          payer: {
            fullName: cardData.holder_name,
            emailAddress: "test@example.com",
            contactPhone: "5555555555",
            dniNumber: "1234567890",
          },
          // Información de billing
          billingAddress: {
            street: "Calle 100",
            city: "Bogotá",
            state: "Cundinamarca",
            country: "CO",
            postalCode: "110111",
            phone: "5555555555",
          },
        }
      );

      logger.info(`✅ Autorización procesada`);

      return res.json({
        success: true,
        message: `Pago ${
          test_card === "approved" ? "autorizado" : "procesado"
        } exitosamente`,
        test_card: test_card,
        expected_result:
          cardData.expected_state === "4"
            ? "approved"
            : cardData.expected_state === "6"
            ? "rejected"
            : "pending",
        payment: {
          id: authorized.id,
          amount: authorized.amount,
          currency_code: authorized.currency_code,
          provider_id: authorized.provider_id,
          raw_amount: authorized.raw_amount,
        },
        note:
          test_card === "approved"
            ? "El pago fue autorizado correctamente ✅"
            : test_card === "rejected"
            ? "El pago fue rechazado como se esperaba ❌"
            : "El pago quedó pendiente ⏳",
      });
    } catch (error: any) {
      logger.error("❌ Error al autorizar pago:", error);

      return res.status(500).json({
        success: false,
        error: error?.message || "Unknown error",
        test_card: test_card,
        note: "Si el error es esperado (ej: pago rechazado), esto es normal para tarjetas de prueba rechazadas",
      });
    }
  } catch (error: any) {
    logger.error("❌ Error en test de autorización:", error);
    return res.status(500).json({
      error: error?.message || "Unknown error",
    });
  }
};

/**
 * GET /test/payu-authorize
 * Obtiene información sobre las tarjetas de prueba disponibles
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  return res.json({
    message: "Endpoint de prueba para autorización de pagos PayU",
    usage: {
      method: "POST",
      url: "/test/payu-authorize",
      body: {
        payment_session_id: "payses_...",
        test_card: "approved | rejected | pending",
      },
    },
    test_cards: {
      approved: {
        card_number: "4111111111111111",
        cvv: "777",
        expiry: "12/2025",
        holder: "APPROVED",
        expected_result: "Pago autorizado exitosamente",
      },
      rejected: {
        card_number: "4111111111111111",
        cvv: "666",
        expiry: "12/2025",
        holder: "REJECTED",
        expected_result: "Pago rechazado",
      },
      pending: {
        card_number: "4111111111111111",
        cvv: "333",
        expiry: "12/2025",
        holder: "PENDING",
        expected_result: "Pago pendiente",
      },
    },
    workflow: [
      "1. Crear payment session (POST /test/payu)",
      "2. Autorizar con tarjeta de prueba (POST /test/payu-authorize)",
      "3. Verificar estado del pago",
      "4. Completar el carrito/orden",
    ],
    notes: [
      "Las tarjetas de prueba solo funcionan en modo sandbox",
      "CVV 777 = Aprobado",
      "CVV 666 = Rechazado",
      "CVV 333 = Pendiente",
      "Mismo número de tarjeta para todos los casos: 4111111111111111",
    ],
  });
};
