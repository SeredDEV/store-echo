import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { Logger, PaymentActions } from "@medusajs/framework/types";
import {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import crypto from "crypto";

type PayUOptions = {
  apiKey: string;
  apiLogin: string;
  merchantId: string;
  accountId: string;
  publicKey?: string;
  apiUrl?: string;
  testMode?: boolean;
};

type InjectedDependencies = {
  logger: Logger;
};

/**
 * PayU Payment Provider para Medusa
 *
 * Este proveedor integra PayU con Medusa para procesar pagos.
 * Implementa todos los métodos requeridos por AbstractPaymentProvider.
 */
class PayUProviderService extends AbstractPaymentProvider<PayUOptions> {
  static identifier = "payu";

  protected logger_: Logger;
  protected options_: PayUOptions;
  protected apiUrl_: string;

  constructor({ logger }: InjectedDependencies, options: PayUOptions) {
    super({ logger }, options);

    this.logger_ = logger;
    this.options_ = options;

    // Usar sandbox si testMode está habilitado
    const defaultUrl = options.testMode
      ? "https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi"
      : "https://api.payulatam.com/payments-api/4.0/service.cgi";

    this.apiUrl_ = options.apiUrl || defaultUrl;

    this.logger_.info(
      `PayU configurado en modo: ${options.testMode ? "SANDBOX" : "PRODUCCIÓN"}`
    );
    this.logger_.info(`PayU API URL: ${this.apiUrl_}`);
  }

  /**
   * Inicializa una sesión de pago con PayU
   * Se llama cuando se crea una PaymentSession en Medusa
   */
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    try {
      const { amount, currency_code, context } = input;

      this.logger_.info(
        `Iniciando sesión de pago con PayU: ${amount} ${currency_code} - context: ${JSON.stringify(
          context
        )}`
      );
      this.logger_.info(`Input completo: ${JSON.stringify(input)}`);

      // Extraer datos de tarjeta del context si existen
      const cardData = (context as any)?.data || (input as any)?.data || {};

      this.logger_.info(
        `Datos de tarjeta extraídos: ${JSON.stringify(cardData)}`
      );

      // Retornar los datos que Medusa guardará en PaymentSession.data
      // Incluir los datos de la tarjeta para usarlos después en authorizePayment
      return {
        id: `payu-${Date.now()}`, // ID temporal de la sesión
        data: {
          amount,
          currency_code,
          // Guardar datos de tarjeta en la sesión para usarlos después
          ...cardData,
        },
      };
    } catch (error) {
      this.logger_.error(
        `Failed to initiate PayU payment: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Actualiza una sesión de pago existente
   * Se llama cuando cambia el monto del carrito o datos de la sesión
   */
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    try {
      const { amount, currency_code, data, context } = input;
      const cardData = context?.extra as any;

      this.logger_.info(
        `Actualizando sesión de pago con PayU: ${data?.id} - ${amount}`
      );

      // Limpiar datos de error previo para permitir reintentos
      const cleanData: any = {
        amount,
        currency_code,
        updated_at: new Date().toISOString(),
      };

      // Si hay nuevos datos de tarjeta, actualizarlos
      if (cardData?.card_number) {
        cleanData.card_number = cardData.card_number;
        cleanData.cvv = cardData.cvv;
        cleanData.expiry_month = cardData.expiry_month;
        cleanData.expiry_year = cardData.expiry_year;
        cleanData.holder_name = cardData.holder_name;

        // Limpiar estado de error para permitir reintento
        this.logger_.info(
          "🔄 Nueva tarjeta ingresada, limpiando estado de error"
        );
      } else {
        // Mantener datos existentes excepto errores
        Object.keys(data || {}).forEach((key) => {
          if (
            !["error", "status", "response_code", "response_message"].includes(
              key
            )
          ) {
            cleanData[key] = data[key];
          }
        });
      }

      return {
        data: cleanData,
      };
    } catch (error) {
      this.logger_.error("Error actualizando pago con PayU", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to update PayU payment: ${error.message}`
      );
    }
  }

  /**
   * Elimina/cancela una sesión de pago antes de ser autorizada
   */
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    try {
      const { data } = input;

      this.logger_.info(`Eliminando sesión de pago con PayU: ${data?.id}`);

      // TODO: Cancelar la transacción en PayU si es necesario

      return {
        data: {},
      };
    } catch (error) {
      this.logger_.error("Error eliminando pago con PayU", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to delete PayU payment: ${error.message}`
      );
    }
  }

  /**
   * Autoriza un pago (reserva los fondos)
   * Se llama cuando el cliente completa el checkout
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const { data, context } = input;

      // Extraer amount y currency_code desde data
      const cardData = data as any;
      const amount = cardData?.amount || (input as any).amount;
      const currency_code =
        cardData?.currency_code || (input as any).currency_code;

      this.logger_.info(
        `Autorizando pago con PayU - data: ${JSON.stringify(data)}`
      );

      // Si hay un error previo y no hay nuevos datos de tarjeta, rechazar
      if (cardData?.error && !cardData?.card_number) {
        this.logger_.warn(
          `⚠️ Intento de autorizar con error previo sin actualizar datos`
        );
        throw new MedusaError(
          MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
          cardData.error
        );
      }

      if (!cardData?.card_number) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Datos de tarjeta requeridos para autorizar el pago"
        );
      }

      this.logger_.info(`💰 Monto a cobrar: ${amount} ${currency_code}`);
      this.logger_.info(`💰 Monto convertido: ${Number(amount)}`);

      // Preparar request a PayU API
      const payuRequest = {
        language: "es",
        command: "SUBMIT_TRANSACTION",
        merchant: {
          apiKey: this.options_.apiKey,
          apiLogin: this.options_.apiLogin,
        },
        transaction: {
          order: {
            accountId: this.options_.accountId,
            referenceCode: `medusa-${data?.id || Date.now()}`,
            description: "Pago Store Echo",
            language: "es",
            signature: "", // Se calcula después
            notifyUrl: `${
              process.env.BACKEND_URL || "http://localhost:9000"
            }/webhooks/payment/pp_payu/payu`,
            additionalValues: {
              TX_VALUE: {
                value: Number(amount),
                currency: "COP",
              },
            },
            buyer: {
              fullName: cardData.holder_name || "Cliente",
              emailAddress: cardData.payer?.emailAddress || "test@example.com",
              contactPhone: cardData.payer?.contactPhone || "3001234567",
              dniNumber: cardData.payer?.dniNumber || "123456789",
              shippingAddress: cardData.billingAddress || {},
            },
          },
          payer: {
            fullName: cardData.holder_name || "Cliente",
            emailAddress: cardData.payer?.emailAddress || "test@example.com",
            contactPhone: cardData.payer?.contactPhone || "3001234567",
            dniNumber: cardData.payer?.dniNumber || "123456789",
            billingAddress: cardData.billingAddress || {},
          },
          creditCard: {
            number: cardData.card_number,
            securityCode: cardData.cvv,
            expirationDate: `${
              cardData.expiry_year
            }/${cardData.expiry_month.padStart(2, "0")}`,
            name: cardData.holder_name,
          },
          type: "AUTHORIZATION_AND_CAPTURE",
          paymentMethod: "VISA", // Detectar automáticamente
          paymentCountry: "CO",
          deviceSessionId: `${Date.now()}`,
          ipAddress: "127.0.0.1",
          cookie: "cookie",
          userAgent: "Mozilla/5.0",
        },
        test: this.options_.testMode,
      };

      // Calcular signature
      const referenceCode = payuRequest.transaction.order.referenceCode;
      const amount2 =
        payuRequest.transaction.order.additionalValues.TX_VALUE.value;
      const currency =
        payuRequest.transaction.order.additionalValues.TX_VALUE.currency;

      this.logger_.info(
        `📝 TX_VALUE antes de signature: ${amount2} ${currency}`
      );

      const signature = this.generateSignature(
        referenceCode,
        amount2,
        currency
      );
      payuRequest.transaction.order.signature = signature;

      this.logger_.info(
        `📤 Request completo a PayU: ${JSON.stringify(
          payuRequest.transaction.order.additionalValues
        )}`
      );
      this.logger_.info(`Enviando request a PayU: ${this.apiUrl_}`);

      // Llamar a PayU API
      const response = await fetch(this.apiUrl_, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payuRequest),
      });

      const authResponse = await response.json();

      this.logger_.info(`📥 Respuesta completa de PayU:`);
      this.logger_.info(`   Code: ${authResponse.code}`);

      if (authResponse.transactionResponse) {
        const tx = authResponse.transactionResponse;
        this.logger_.info(`   Transaction State: ${tx.state}`);
        this.logger_.info(
          `   Transaction Type: ${tx.transactionType || "N/A"}`
        );
        this.logger_.info(`   Response Code: ${tx.responseCode}`);
        this.logger_.info(`   Response Message: ${tx.responseMessage}`);
        this.logger_.info(`   Transaction ID: ${tx.transactionId}`);
        this.logger_.info(`   Order ID: ${tx.orderId}`);
        this.logger_.info(
          `   Authorization Code: ${tx.authorizationCode || "N/A"}`
        );

        // Verificar si es AUTHORIZATION_AND_CAPTURE o solo AUTHORIZATION
        if (tx.additionalInfo?.transactionType) {
          this.logger_.info(
            `   ⚠️  Additional Info Transaction Type: ${tx.additionalInfo.transactionType}`
          );
        }
      }

      // Verificar respuesta
      if (authResponse.code === "SUCCESS") {
        const transaction = authResponse.transactionResponse;

        // Log para entender qué tipo de transacción hizo PayU
        this.logger_.info(
          `🔍 Tipo de transacción procesada: ${
            transaction.additionalInfo?.transactionType ||
            payuRequest.transaction.type
          }`
        );

        // Mapear estado de PayU a Medusa
        if (transaction.state === "APPROVED") {
          // ✅ Captura automática: cuando PayU aprueba, marcamos como capturado
          return {
            status: "authorized",
            data: {
              ...data,
              payu_transaction_id: transaction.transactionId,
              payu_order_id: transaction.orderId,
              authorization_code: transaction.authorizationCode,
              status: "approved",
              response_code: transaction.responseCode,
              response_message: transaction.responseMessage,
              authorized_at: new Date().toISOString(),
              captured_at: new Date().toISOString(), // 🔥 Captura automática
            },
          };
        } else if (transaction.state === "PENDING") {
          // PENDING también se considera autorizado para completar la orden
          return {
            status: "authorized",
            data: {
              ...data,
              payu_transaction_id: transaction.transactionId,
              payu_order_id: transaction.orderId,
              authorization_code: transaction.authorizationCode || "PENDING",
              status: "pending",
              response_code: transaction.responseCode,
              response_message: transaction.responseMessage,
              authorized_at: new Date().toISOString(),
            },
          };
        } else {
          // DECLINED, ERROR, etc. - Retornar requires_more para permitir reintento
          const errorMessage = transaction.responseMessage || "Pago rechazado";

          this.logger_.error(
            `❌ PayU rechazó el pago: ${transaction.state} - ${errorMessage} (Código: ${transaction.responseCode})`
          );

          // Retornar requires_more: esto mantiene la sesión activa para reintentos
          return {
            status: "requires_more",
            data: {
              ...data,
              payu_transaction_id: transaction.transactionId,
              payu_order_id: transaction.orderId,
              status: "declined",
              response_code: transaction.responseCode,
              response_message: errorMessage,
              error: `Tu tarjeta fue rechazada: ${errorMessage}. Por favor intenta con otra tarjeta.`,
            },
          };
        }
      } else {
        throw new MedusaError(
          MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
          `PayU error: ${authResponse.error || "Unknown error"}`
        );
      }
    } catch (error) {
      this.logger_.error("Error autorizando pago con PayU", error);

      return {
        status: "error",
        data: {
          ...input.data,
          error: (error as Error).message,
        },
      };
    }
  }

  /**
   * Captura un pago autorizado (cobra los fondos)
   * Se llama cuando se confirma el pedido o se envía
   */
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      const { data } = input;
      const amount = (input as any).amount;

      this.logger_.info(`💰 Capturando pago con PayU`);
      this.logger_.info(`   Transaction ID: ${data?.payu_transaction_id}`);
      this.logger_.info(`   Order ID: ${data?.payu_order_id}`);
      this.logger_.info(`   Amount: ${amount}`);

      // Si ya fue AUTHORIZATION_AND_CAPTURE, PayU ya procesó el pago
      // Solo actualizamos el estado local
      if (data?.status === "approved") {
        this.logger_.info(
          `✅ Pago ya fue capturado automáticamente por PayU (AUTHORIZATION_AND_CAPTURE)`
        );
        return {
          data: {
            ...data,
            captured_amount: amount,
            captured_at: new Date().toISOString(),
            status: "captured",
          },
        };
      }

      // Si el pago está en PENDING, intentar capturar con PayU
      if (data?.payu_order_id && data?.payu_transaction_id) {
        this.logger_.info(`🔄 Intentando capturar pago pendiente en PayU...`);

        const captureResponse = await this.capturePayUTransaction(
          String(data.payu_order_id),
          String(data.payu_transaction_id),
          Number(amount)
        );

        this.logger_.info(
          `✅ Respuesta de captura: ${JSON.stringify(captureResponse)}`
        );

        return {
          data: {
            ...data,
            captured_amount: amount,
            captured_at: new Date().toISOString(),
            capture_response: captureResponse,
            status: "captured",
          },
        };
      }

      // Si no tenemos IDs de PayU, solo marcar como capturado localmente
      this.logger_.warn(
        `⚠️  No se encontraron IDs de PayU, marcando como capturado localmente`
      );
      return {
        data: {
          ...data,
          captured_amount: amount,
          captured_at: new Date().toISOString(),
          status: "captured",
        },
      };
    } catch (error) {
      this.logger_.error("Error capturando pago con PayU", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to capture PayU payment: ${error.message}`
      );
    }
  }

  /**
   * Reembolsa un pago total o parcialmente
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    try {
      const { data, amount } = input;

      this.logger_.info(`💸 Reembolsando pago con PayU`);
      this.logger_.info(`   Transaction ID: ${data?.payu_transaction_id}`);
      this.logger_.info(`   Order ID: ${data?.payu_order_id}`);
      this.logger_.info(`   Amount: ${amount}`);

      if (!data?.payu_order_id || !data?.payu_transaction_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "No se encontraron IDs de PayU para realizar el reembolso"
        );
      }

      // Llamar a PayU para hacer el reembolso
      const refundResponse = await this.refundPayUTransaction(
        String(data.payu_order_id),
        String(data.payu_transaction_id),
        Number(amount)
      );

      this.logger_.info(
        `✅ Respuesta de reembolso: ${JSON.stringify(refundResponse)}`
      );

      return {
        data: {
          ...data,
          refunded_amount: amount,
          refunded_at: new Date().toISOString(),
          refund_response: refundResponse,
          status: "refunded",
        },
      };
    } catch (error) {
      this.logger_.error("Error reembolsando pago con PayU", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to refund PayU payment: ${error.message}`
      );
    }
  }

  /**
   * Cancela un pago autorizado antes de capturarlo
   */
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      const { data } = input;

      this.logger_.info(`Cancelando pago con PayU: ${data?.id}`);

      // TODO: Cancelar la autorización en PayU
      await this.cancelPayUTransaction(String(data?.id));

      return {
        data: {
          ...data,
          status: "canceled",
          canceled_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger_.error("Error cancelando pago con PayU", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to cancel PayU payment: ${error.message}`
      );
    }
  }

  /**
   * Obtiene el estado de un pago
   */
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    try {
      const paymentData = input.data as any;
      const paymentStatus = await this.getPayUTransactionStatus(
        String(paymentData?.payu_order_id || paymentData?.id),
        String(paymentData?.payu_transaction_id || paymentData?.id)
      );
      return {
        status: paymentStatus.status || "pending",
      };
    } catch (error) {
      this.logger_.error("Error obteniendo estado de pago", error);
      return {
        status: "error",
      };
    }
  }

  /**
   * Procesa webhooks de PayU
   */
  async getWebhookActionAndData(data: {
    data: Record<string, unknown>;
    rawData: string | Buffer;
    headers: Record<string, unknown>;
  }): Promise<WebhookActionResult> {
    // Determinar la acción según los datos del webhook
    // PayU envía diferentes tipos de notificaciones
    const webhookData = data.data;
    const state = webhookData.state_pol || webhookData.status;

    let action: PaymentActions = "not_supported";

    // Mapear estados de PayU a acciones de Medusa
    switch (state) {
      case "APPROVED":
      case "4": // Estado 4 = Aprobada
        action = "authorized";
        break;
      case "DECLINED":
      case "6": // Estado 6 = Rechazada
        action = "failed";
        break;
      case "PENDING":
      case "7": // Estado 7 = Pendiente
        action = "not_supported";
        break;
      default:
        action = "not_supported";
    }

    return {
      action,
      data: {
        session_id: String(
          webhookData.reference_sale || webhookData.transaction_id
        ),
        amount: Number(webhookData.value || 0),
        ...webhookData,
      },
    };
  }

  /**
   * Obtiene el estado actual de un pago desde PayU
   */
  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      const { data } = input;

      this.logger_.info(`Obteniendo estado de pago desde PayU: ${data?.id}`);

      // TODO: Consultar el estado en PayU
      const paymentStatus = await this.getPayUTransactionStatus(
        String(data?.payu_order_id || data?.id),
        String(data?.payu_transaction_id || data?.id)
      );

      return {
        data: {
          ...data,
          status: paymentStatus.status,
          updated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger_.error("Error obteniendo pago desde PayU", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to retrieve PayU payment: ${error.message}`
      );
    }
  }

  // ========== Métodos auxiliares para interactuar con PayU API ==========

  /**
   * Genera la firma MD5 para PayU
   * Formato: ApiKey~merchantId~referenceCode~amount~currency
   */
  private generateSignature(
    referenceCode: string,
    amount: number,
    currency: string
  ): string {
    const signatureString = `${this.options_.apiKey}~${this.options_.merchantId}~${referenceCode}~${amount}~${currency}`;
    return crypto.createHash("md5").update(signatureString).digest("hex");
  }

  private async createPayUTransaction(params: any): Promise<any> {
    // TODO: Implementar llamada a PayU API para crear transacción
    // Ejemplo con fetch:
    // const response = await fetch(this.apiUrl_, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${this.options_.apiKey}`,
    //   },
    //   body: JSON.stringify({
    //     merchant: {
    //       apiKey: this.options_.apiKey,
    //       apiLogin: this.options_.merchantId,
    //     },
    //     transaction: {
    //       ...params,
    //     },
    //   }),
    // });
    // return response.json();

    // Por ahora retornamos mock
    return {
      transactionId: `payu-${Date.now()}`,
      status: "PENDING",
      reference: params.reference,
    };
  }

  private async authorizePayUTransaction(transactionId: string): Promise<any> {
    // TODO: Implementar autorización con PayU API
    return {
      status: "APPROVED",
      authorizationCode: `AUTH-${Date.now()}`,
      requiresAction: false,
    };
  }

  private async capturePayUTransaction(
    orderId: string,
    transactionId: string,
    amount: number
  ): Promise<any> {
    try {
      // PayU requiere hacer una consulta de estado para verificar si se puede capturar
      // En AUTHORIZATION_AND_CAPTURE el pago ya está capturado
      // Solo necesitamos hacer CAPTURE si fue AUTHORIZATION solamente

      this.logger_.info(
        `📞 Consultando estado de transacción en PayU antes de capturar`
      );

      // Primero consultar el estado actual
      const statusResponse = await this.getPayUTransactionStatus(
        orderId,
        transactionId
      );

      this.logger_.info(`📊 Estado actual: ${JSON.stringify(statusResponse)}`);

      // Si ya está capturado, retornar éxito
      if (
        statusResponse.status === "APPROVED" ||
        statusResponse.state === "APPROVED"
      ) {
        return {
          status: "CAPTURED",
          message: "Pago ya estaba capturado en PayU",
          orderId,
          transactionId,
        };
      }

      // Si está PENDING y necesita captura, hacer la captura
      // Nota: PayU no tiene endpoint directo de captura, el pago se captura
      // automáticamente si se usó AUTHORIZATION_AND_CAPTURE
      this.logger_.warn(
        `⚠️  PayU no requiere captura manual para AUTHORIZATION_AND_CAPTURE`
      );

      return {
        status: "CAPTURED",
        message: "Pago marcado como capturado",
        orderId,
        transactionId,
      };
    } catch (error) {
      this.logger_.error("Error en capturePayUTransaction", error);
      throw error;
    }
  }

  private async refundPayUTransaction(
    orderId: string,
    transactionId: string,
    amount: number
  ): Promise<any> {
    try {
      this.logger_.info(`📞 Llamando a PayU API para reembolso`);

      // Generar referencia única para el reembolso
      const refundReference = `refund-${Date.now()}`;

      // Preparar request de reembolso
      const refundRequest = {
        language: "es",
        command: "SUBMIT_TRANSACTION",
        merchant: {
          apiKey: this.options_.apiKey,
          apiLogin: this.options_.apiLogin,
        },
        transaction: {
          order: {
            id: orderId,
          },
          type: "REFUND",
          reason: "Reembolso solicitado por el merchant",
          parentTransactionId: transactionId,
        },
        test: this.options_.testMode,
      };

      this.logger_.info(
        `📤 Request de reembolso: ${JSON.stringify(refundRequest)}`
      );

      const response = await fetch(this.apiUrl_, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(refundRequest),
      });

      const refundResponse = await response.json();

      this.logger_.info(
        `📥 Respuesta de reembolso: ${JSON.stringify(refundResponse)}`
      );

      if (refundResponse.code === "SUCCESS") {
        return {
          status: "REFUNDED",
          refundId: refundResponse.transactionResponse?.transactionId,
          orderId,
          transactionId,
          message: refundResponse.transactionResponse?.responseMessage,
        };
      } else {
        throw new Error(
          `PayU refund failed: ${refundResponse.error || "Unknown error"}`
        );
      }
    } catch (error) {
      this.logger_.error("Error en refundPayUTransaction", error);
      throw error;
    }
  }

  private async cancelPayUTransaction(transactionId: string): Promise<any> {
    // PayU no tiene un endpoint específico de cancelación
    // Las transacciones autorizadas se pueden anular haciendo un VOID
    this.logger_.warn(
      `⚠️  PayU no soporta cancelación directa, usar reembolso en su lugar`
    );
    return {
      status: "CANCELLED",
      message: "Cancelación no implementada en PayU, usar reembolso",
    };
  }

  private async getPayUTransactionStatus(
    orderId: string,
    transactionId: string
  ): Promise<any> {
    try {
      this.logger_.info(`📞 Consultando estado de transacción en PayU`);

      const queryRequest = {
        language: "es",
        command: "ORDER_DETAIL_BY_REFERENCE_CODE",
        merchant: {
          apiKey: this.options_.apiKey,
          apiLogin: this.options_.apiLogin,
        },
        details: {
          orderId: orderId,
        },
        test: this.options_.testMode,
      };

      const response = await fetch(this.apiUrl_, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(queryRequest),
      });

      const statusResponse = await response.json();

      this.logger_.info(
        `📥 Respuesta de estado: ${JSON.stringify(statusResponse)}`
      );

      return statusResponse.result || { status: "UNKNOWN" };
    } catch (error) {
      this.logger_.error("Error en getPayUTransactionStatus", error);
      throw error;
    }
  }
}

export default PayUProviderService;
