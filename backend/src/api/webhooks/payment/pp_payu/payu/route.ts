import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import crypto from "crypto";

/**
 * Webhook endpoint para PayU Colombia
 * POST /webhooks/payment/pp_payu/payu
 *
 * PayU enviará notificaciones POST a esta URL cuando el estado de un pago cambie.
 *
 * Configurar esta URL en:
 * Panel de PayU > Configuración > Configuración técnica > URL de confirmación
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve("logger");

  try {
    logger.info("📥 Webhook de PayU recibido");

    // PayU envía los datos en el body con los siguientes campos principales:
    const body = req.body as any;
    const {
      merchant_id,
      state_pol, // Estado del pago (4=Aprobado, 6=Rechazado, 7=Pendiente)
      risk, // Nivel de riesgo
      response_code_pol, // Código de respuesta
      reference_sale, // Referencia de venta (nuestro reference_code)
      reference_pol, // Referencia de PayU
      sign, // Firma MD5 para validar autenticidad
      extra1, // Campo extra (podemos usar para payment_session_id)
      extra2,
      extra3,
      additional_value,
      transaction_id,
      transaction_date,
      currency,
      value, // Valor de la transacción
      email_buyer,
      cus, // Customer ID
      pse_bank, // Banco PSE (si aplica)
      test, // Indica si es transacción de prueba
      description,
      billing_address,
      shipping_address,
      phone,
      office_phone,
      account_number_ach,
      account_type_ach,
      administrative_fee,
      administrative_fee_base,
      administrative_fee_tax,
      airline_code,
      attempts,
      authorization_code,
      bank_id,
      billing_city,
      billing_country,
      commision_pol,
      commision_pol_currency,
      customer_number,
      date,
      error_code_bank,
      error_message_bank,
      exchange_rate,
      ip,
      installments_number,
      payment_method,
      payment_method_id,
      payment_method_name,
      payment_method_type,
      payment_request_state,
      pse_reference1,
      pse_reference2,
      pse_reference3,
      response_message_pol,
      shipping_city,
      shipping_country,
      transaction_bank_id,
      transaction_type,
      tx_value,
      txn_date,
      nickname_buyer,
      nickname_seller,
      payment_method_token_id,
      franchise,
    } = body;

    logger.info(
      `PayU Webhook - Referencia: ${reference_sale}, Estado: ${state_pol}, Valor: ${value} ${currency}`
    );

    // 1. Verificar la firma de seguridad
    const apiKey = process.env.PAYU_API_KEY;
    const merchantId = process.env.PAYU_MERCHANT_ID;

    // Firma PayU: ApiKey~merchant_id~reference_sale~value~currency~state_pol
    const signatureString = `${apiKey}~${merchantId}~${reference_sale}~${value}~${currency}~${state_pol}`;
    const calculatedSignature = crypto
      .createHash("md5")
      .update(signatureString)
      .digest("hex");

    if (calculatedSignature !== sign) {
      logger.error(
        `❌ Firma de webhook inválida - Recibida: ${sign}, Calculada: ${calculatedSignature}`
      );
      return res.status(400).json({
        error: "Invalid signature",
      });
    }

    logger.info("✅ Firma de webhook verificada correctamente");

    // 2. Mapear estado de PayU a acciones de Medusa
    // Estados de PayU:
    // 4 = Transacción aprobada
    // 5 = Transacción expirada
    // 6 = Transacción rechazada
    // 7 = Transacción pendiente
    // 104 = Error en transacción
    const stateMap: Record<string, string> = {
      "4": "authorized", // Aprobado
      "5": "failed", // Expirado
      "6": "failed", // Rechazado
      "7": "pending", // Pendiente
      "104": "failed", // Error
    };

    const action = stateMap[state_pol] || "not_supported";

    logger.info(`🔄 Acción determinada: ${action} para estado ${state_pol}`);

    // 3. Buscar el payment session usando la referencia
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

    // La referencia de venta contiene el ID de nuestra payment session o collection
    // Formato esperado: "medusa-{timestamp}" o "payses_{id}"
    let paymentSessions;

    try {
      // Intentar buscar todas las payment sessions activas
      // Nota: En producción deberías almacenar la referencia de PayU
      // en el campo 'data' de la payment session al crearla
      paymentSessions = await paymentModuleService.listPaymentSessions({});

      // Filtrar por la referencia en los datos
      paymentSessions = paymentSessions.filter((session: any) => {
        return (
          session.data?.reference === reference_sale ||
          session.data?.transaction_id === transaction_id
        );
      });

      if (!paymentSessions || paymentSessions.length === 0) {
        logger.warn(
          `⚠️  No se encontró payment session para referencia: ${reference_sale}`
        );
        // Responder 200 para que PayU no reintente
        return res.status(200).json({
          status: "received",
          message: "Payment session not found, but acknowledged",
        });
      }
    } catch (error) {
      logger.error("Error buscando payment session:", error);
      return res.status(200).json({
        status: "received",
        message: "Error searching payment session",
      });
    }

    const paymentSession = paymentSessions[0];
    logger.info(`✅ Payment session encontrada: ${paymentSession.id}`);

    // 4. Actualizar el payment session según el estado
    try {
      if (action === "authorized") {
        // Autorizar el pago
        logger.info(`🔐 Autorizando payment session: ${paymentSession.id}`);

        await paymentModuleService.authorizePaymentSession(paymentSession.id, {
          transaction_id: transaction_id,
          reference_pol: reference_pol,
          authorization_code: authorization_code,
          state_pol: state_pol,
          response_code_pol: response_code_pol,
          response_message_pol: response_message_pol,
          payment_method_type: payment_method_type,
          payment_method_name: payment_method_name,
        });

        logger.info(`✅ Pago autorizado exitosamente`);
      } else if (action === "failed") {
        // Marcar el pago como fallido
        logger.info(
          `❌ Pago fallido - Session: ${paymentSession.id}, Estado: ${state_pol}, Error: ${response_message_pol}`
        );
      } else if (action === "pending") {
        // Actualizar con estado pendiente
        logger.info(
          `⏳ Pago pendiente - Session: ${paymentSession.id}, Estado: ${state_pol}`
        );
      }
    } catch (error) {
      logger.error("Error actualizando payment session:", error);
      return res.status(200).json({
        status: "received",
        message: "Error updating payment session",
      });
    }

    // 5. Responder a PayU
    // PayU espera una respuesta 200 OK para confirmar que recibimos el webhook
    return res.status(200).json({
      status: "success",
      message: "Webhook processed successfully",
      action: action,
      reference: reference_sale,
      state: state_pol,
    });
  } catch (error: any) {
    logger.error("❌ Error procesando webhook de PayU:", error);

    // Aún así responder 200 para que PayU no reintente infinitamente
    return res.status(200).json({
      status: "error",
      message: error?.message || "Unknown error",
    });
  }
};
