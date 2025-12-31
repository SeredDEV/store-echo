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
    this.apiUrl_ =
      options.apiUrl ||
      "https://api.payulatam.com/payments-api/4.0/service.cgi";
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
        `Iniciando sesión de pago con PayU: ${amount} ${currency_code}`
      );

      // TODO: Crear una transacción en PayU
      // Esto depende de la API de PayU específica de tu región
      const payuResponse = await this.createPayUTransaction({
        amount,
        currency: currency_code,
        merchantId: this.options_.merchantId,
        accountId: this.options_.accountId,
        // Puedes pasar información adicional del carrito/cliente
        reference: (context as any)?.resource_id || `medusa-${Date.now()}`,
        description:
          (context as any)?.payment_description || "Payment from Medusa store",
      });

      // Retornar los datos que Medusa guardará en PaymentSession.data
      return {
        id: payuResponse.transactionId,
        data: {
          id: payuResponse.transactionId,
          status: payuResponse.status,
          reference: payuResponse.reference,
          // Cualquier dato adicional que necesites para procesar después
        },
      };
    } catch (error) {
      this.logger_.error("Error iniciando pago con PayU", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to initiate PayU payment: ${error.message}`
      );
    }
  }

  /**
   * Actualiza una sesión de pago existente
   * Se llama cuando cambia el monto del carrito o datos de la sesión
   */
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    try {
      const { amount, currency_code, data } = input;

      this.logger_.info(
        `Actualizando sesión de pago con PayU: ${data?.id} - ${amount}`
      );

      // TODO: Actualizar la transacción en PayU si es necesario
      // Algunas pasarelas permiten actualizar, otras requieren cancelar y crear nueva

      return {
        data: {
          ...data,
          amount,
          currency_code,
          updated_at: new Date().toISOString(),
        },
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

      this.logger_.info(`Autorizando pago con PayU: ${data?.id}`);

      // TODO: Autorizar el pago en PayU
      // Esto puede variar según el método de pago (tarjeta, PSE, etc.)
      const authResponse = await this.authorizePayUTransaction(
        String(data?.id)
      );

      // Verificar si requiere acción adicional (ej: 3D Secure, redirección)
      if (authResponse.requiresAction) {
        return {
          status: "requires_more",
          data: {
            ...data,
            status: authResponse.status,
            actionUrl: authResponse.actionUrl,
          },
        };
      }

      // Autorización exitosa
      return {
        status: "authorized",
        data: {
          ...data,
          status: authResponse.status,
          authorized_at: new Date().toISOString(),
          authorization_code: authResponse.authorizationCode,
        },
      };
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

      this.logger_.info(`Capturando pago con PayU: ${data?.id} - ${amount}`);

      // TODO: Capturar el pago en PayU
      const captureResponse = await this.capturePayUTransaction(
        String(data?.id),
        typeof amount === "string" ? parseFloat(amount) : Number(amount)
      );

      return {
        data: {
          ...data,
          captured_amount: amount,
          captured_at: new Date().toISOString(),
          capture_id: captureResponse.captureId,
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

      this.logger_.info(`Reembolsando pago con PayU: ${data?.id} - ${amount}`);

      // TODO: Crear reembolso en PayU
      const refundResponse = await this.refundPayUTransaction(
        String(data?.id),
        typeof amount === "string" ? parseFloat(amount) : Number(amount)
      );

      return {
        data: {
          ...data,
          refund_id: refundResponse.refundId,
          refunded_amount: amount,
          refunded_at: new Date().toISOString(),
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
      const paymentId = input.data?.id as string;
      const paymentStatus = await this.getPayUTransactionStatus(paymentId);
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
        String(data?.id)
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
  // NOTA: Estos son ejemplos. Debes implementarlos según la API de PayU
  // de tu región específica (Colombia, México, etc.)

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
    transactionId: string,
    amount: number
  ): Promise<any> {
    // TODO: Implementar captura con PayU API
    return {
      captureId: `CAP-${Date.now()}`,
      status: "CAPTURED",
    };
  }

  private async refundPayUTransaction(
    transactionId: string,
    amount: number
  ): Promise<any> {
    // TODO: Implementar reembolso con PayU API
    return {
      refundId: `REF-${Date.now()}`,
      status: "REFUNDED",
    };
  }

  private async cancelPayUTransaction(transactionId: string): Promise<any> {
    // TODO: Implementar cancelación con PayU API
    return {
      status: "CANCELLED",
    };
  }

  private async getPayUTransactionStatus(transactionId: string): Promise<any> {
    // TODO: Implementar consulta de estado con PayU API
    return {
      status: "APPROVED",
    };
  }
}

export default PayUProviderService;
