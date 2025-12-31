import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { Logger } from "@medusajs/framework/types";
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
  BigNumberInput,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

type MercadoPagoOptions = {
  accessToken: string;
  publicKey: string;
  webhookSecret?: string;
  testMode?: boolean;
};

type InjectedDependencies = {
  logger: Logger;
};

/**
 * Mercado Pago Payment Provider para Medusa
 *
 * Este proveedor integra Mercado Pago con Medusa para procesar pagos.
 * Soporta pagos con tarjeta, efectivo, transferencias bancarias, etc.
 */
class MercadoPagoProviderService extends AbstractPaymentProvider<MercadoPagoOptions> {
  static identifier = "mercadopago";

  protected logger_: Logger;
  protected options_: MercadoPagoOptions;
  protected apiUrl_: string;

  constructor({ logger }: InjectedDependencies, options: MercadoPagoOptions) {
    super({ logger }, options);

    this.logger_ = logger;
    this.options_ = options;
    this.apiUrl_ = options.testMode
      ? "https://api.mercadopago.com"
      : "https://api.mercadopago.com";
  }

  /**
   * Inicializa una sesión de pago con Mercado Pago
   * Crea una Preferencia de Pago
   */
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    try {
      const { amount, currency_code, context } = input;

      this.logger_.info(
        `Iniciando sesión de pago con Mercado Pago: ${amount} ${currency_code}`
      );

      const amountNumber =
        typeof amount === "string" ? parseFloat(amount) : Number(amount);

      // TODO: Crear una preferencia de pago en Mercado Pago
      const preference = await this.createPaymentPreference({
        transaction_amount: amountNumber / 100, // Mercado Pago usa decimales (ej: 100.50)
        currency_id: currency_code.toUpperCase(),
        description:
          (context as any)?.payment_description || "Payment from Medusa store",
        external_reference:
          (context as any)?.resource_id || `medusa-${Date.now()}`,
        payer: {
          email: (context as any)?.email || context?.customer?.email,
          // Más datos del cliente si están disponibles
        },
        back_urls: {
          success: `${process.env.STORE_URL}/checkout/success`,
          failure: `${process.env.STORE_URL}/checkout/failure`,
          pending: `${process.env.STORE_URL}/checkout/pending`,
        },
        auto_return: "approved",
      });

      return {
        id: preference.id,
        data: {
          id: preference.id,
          init_point: preference.init_point, // URL para checkout
          sandbox_init_point: preference.sandbox_init_point,
          status: "pending",
        },
      };
    } catch (error) {
      this.logger_.error("Error iniciando pago con Mercado Pago", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to initiate Mercado Pago payment: ${error.message}`
      );
    }
  }

  /**
   * Actualiza una sesión de pago existente
   */
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    try {
      const { amount, currency_code, data } = input;

      this.logger_.info(
        `Actualizando sesión de pago con Mercado Pago: ${data?.id}`
      );

      const amountNumber =
        typeof amount === "string" ? parseFloat(amount) : Number(amount);

      // Mercado Pago no permite actualizar preferencias
      // Se debe crear una nueva preferencia
      const newPreference = await this.createPaymentPreference({
        transaction_amount: amountNumber / 100,
        currency_id: currency_code.toUpperCase(),
        external_reference: (data as any)?.external_reference,
      });

      return {
        data: {
          ...data,
          id: newPreference.id,
          init_point: newPreference.init_point,
          amount,
          updated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger_.error("Error actualizando pago con Mercado Pago", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to update Mercado Pago payment: ${error.message}`
      );
    }
  }

  /**
   * Elimina/cancela una sesión de pago antes de ser autorizada
   */
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    try {
      const { data } = input;

      this.logger_.info(
        `Eliminando sesión de pago con Mercado Pago: ${data?.id}`
      );

      // Las preferencias de Mercado Pago expiran automáticamente
      // No requieren cancelación explícita

      return {
        data: {},
      };
    } catch (error) {
      this.logger_.error("Error eliminando pago con Mercado Pago", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to delete Mercado Pago payment: ${error.message}`
      );
    }
  }

  /**
   * Autoriza un pago
   * En Mercado Pago esto se maneja vía webhooks
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const { data, context } = input;

      this.logger_.info(`Autorizando pago con Mercado Pago: ${data?.id}`);

      // Verificar el estado del pago consultando la API
      // El payment_id vendría del webhook o del redirect
      const paymentId =
        (context as any)?.payment_id || (data as any)?.payment_id;

      if (!paymentId) {
        // El pago aún no ha sido procesado
        return {
          status: "pending",
          data: {
            ...data,
            status: "pending",
          },
        };
      }

      const payment = await this.getPaymentInfo(paymentId);

      // Verificar el estado del pago
      if (payment.status === "approved") {
        return {
          status: "authorized",
          data: {
            ...data,
            payment_id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            authorized_at: new Date().toISOString(),
            payment_method_id: payment.payment_method_id,
            payment_type_id: payment.payment_type_id,
          },
        };
      } else if (
        payment.status === "pending" ||
        payment.status === "in_process"
      ) {
        return {
          status: "pending",
          data: {
            ...data,
            payment_id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
          },
        };
      } else if (payment.status === "rejected") {
        return {
          status: "error",
          data: {
            ...data,
            payment_id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            error: `Payment rejected: ${payment.status_detail}`,
          },
        };
      }

      // Otros estados
      return {
        status: "pending",
        data: {
          ...data,
          payment_id: payment.id,
          status: payment.status,
        },
      };
    } catch (error) {
      this.logger_.error("Error autorizando pago con Mercado Pago", error);

      return {
        status: "error",
        data: {
          ...(input.data || {}),
          error: error.message,
        },
      };
    }
  }

  /**
   * Captura un pago autorizado
   * En Mercado Pago, los pagos aprobados ya están capturados
   */
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      const { data } = input;
      const amount = (data as any)?.amount || 0;

      this.logger_.info(
        `Capturando pago con Mercado Pago: ${(data as any)?.payment_id}`
      );

      // En Mercado Pago, los pagos "approved" ya están capturados
      // Si se requiere captura manual, se debe configurar en la preferencia
      // con "capture": false y luego capturar con un endpoint específico

      const payment = await this.getPaymentInfo(
        String((data as any)?.payment_id)
      );

      if (payment.status === "approved" && payment.captured) {
        return {
          data: {
            ...data,
            captured_amount: amount,
            captured_at: new Date().toISOString(),
            capture_id: payment.id,
          },
        };
      }

      // Si requiere captura manual
      const captureResponse = await this.capturePayment_MP(
        String((data as any)?.payment_id)
      );

      return {
        data: {
          ...data,
          captured_amount: amount,
          captured_at: new Date().toISOString(),
          capture_id: captureResponse.id,
        },
      };
    } catch (error) {
      this.logger_.error("Error capturando pago con Mercado Pago", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to capture Mercado Pago payment: ${error.message}`
      );
    }
  }

  /**
   * Reembolsa un pago total o parcialmente
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    try {
      const { data, amount } = input;

      this.logger_.info(
        `Reembolsando pago con Mercado Pago: ${(data as any)?.payment_id}`
      );

      const amountNumber =
        typeof amount === "string" ? parseFloat(amount) : Number(amount);

      // Crear un reembolso en Mercado Pago
      const refund = await this.createRefund(
        String((data as any)?.payment_id),
        amountNumber / 100
      );

      return {
        data: {
          ...data,
          refund_id: refund.id,
          refunded_amount: amount,
          refunded_at: new Date().toISOString(),
          refund_status: refund.status,
        },
      };
    } catch (error) {
      this.logger_.error("Error reembolsando pago con Mercado Pago", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to refund Mercado Pago payment: ${error.message}`
      );
    }
  }

  /**
   * Cancela un pago autorizado antes de capturarlo
   */
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      const { data } = input;

      this.logger_.info(
        `Cancelando pago con Mercado Pago: ${(data as any)?.payment_id}`
      );

      // Cancelar el pago en Mercado Pago
      await this.cancelPayment_MP(String((data as any)?.payment_id));

      return {
        data: {
          ...data,
          status: "cancelled",
          canceled_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger_.error("Error cancelando pago con Mercado Pago", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to cancel Mercado Pago payment: ${error.message}`
      );
    }
  }

  /**
   * Obtiene el estado actual de un pago desde Mercado Pago
   */
  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      const { data } = input;

      this.logger_.info(
        `Obteniendo estado de pago desde Mercado Pago: ${
          (data as any)?.payment_id
        }`
      );

      const payment = await this.getPaymentInfo(
        String((data as any)?.payment_id)
      );

      return {
        data: {
          ...data,
          status: payment.status,
          status_detail: payment.status_detail,
          updated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger_.error("Error obteniendo pago desde Mercado Pago", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to retrieve Mercado Pago payment: ${error.message}`
      );
    }
  }

  // ========== Métodos auxiliares para interactuar con Mercado Pago API ==========

  private async createPaymentPreference(params: any): Promise<any> {
    // TODO: Implementar con SDK de Mercado Pago o fetch
    // Ejemplo:
    // const response = await fetch(`${this.apiUrl_}/checkout/preferences`, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${this.options_.accessToken}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(params),
    // });
    // return response.json();

    // Mock por ahora
    return {
      id: `mp-pref-${Date.now()}`,
      init_point: `https://www.mercadopago.com/checkout/v1/redirect?pref_id=mp-pref-${Date.now()}`,
      sandbox_init_point: `https://www.mercadopago.com/checkout/v1/redirect?pref_id=mp-pref-${Date.now()}`,
    };
  }

  private async getPaymentInfo(paymentId: string): Promise<any> {
    // TODO: Implementar consulta de pago
    // const response = await fetch(`${this.apiUrl_}/v1/payments/${paymentId}`, {
    //   headers: {
    //     "Authorization": `Bearer ${this.options_.accessToken}`,
    //   },
    // });
    // return response.json();

    return {
      id: paymentId,
      status: "approved",
      status_detail: "accredited",
      payment_method_id: "visa",
      payment_type_id: "credit_card",
      captured: true,
    };
  }

  private async capturePayment_MP(paymentId: string): Promise<any> {
    // TODO: Implementar captura
    // const response = await fetch(`${this.apiUrl_}/v1/payments/${paymentId}/capture`, {
    //   method: "PUT",
    //   headers: {
    //     "Authorization": `Bearer ${this.options_.accessToken}`,
    //   },
    // });
    // return response.json();

    return {
      id: paymentId,
      status: "approved",
      captured: true,
    };
  }

  private async createRefund(paymentId: string, amount?: number): Promise<any> {
    // TODO: Implementar reembolso
    // const body = amount ? { amount } : {};
    // const response = await fetch(`${this.apiUrl_}/v1/payments/${paymentId}/refunds`, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${this.options_.accessToken}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(body),
    // });
    // return response.json();

    return {
      id: `ref-${Date.now()}`,
      status: "approved",
      amount: amount,
    };
  }

  private async cancelPayment_MP(paymentId: string): Promise<any> {
    // TODO: Implementar cancelación
    // const response = await fetch(`${this.apiUrl_}/v1/payments/${paymentId}`, {
    //   method: "PUT",
    //   headers: {
    //     "Authorization": `Bearer ${this.options_.accessToken}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ status: "cancelled" }),
    // });
    // return response.json();

    return {
      id: paymentId,
      status: "cancelled",
    };
  }

  /**
   * Obtiene el estado de un pago desde Mercado Pago
   */
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    try {
      const { data } = input;
      const paymentId = (data as any)?.payment_id;

      if (!paymentId) {
        return { status: "pending" };
      }

      const payment = await this.getPaymentInfo(String(paymentId));

      // Mapear estados de Mercado Pago a estados de Medusa
      const statusMap: Record<string, string> = {
        approved: "authorized",
        pending: "pending",
        in_process: "pending",
        rejected: "canceled",
        cancelled: "canceled",
        refunded: "canceled",
        charged_back: "canceled",
      };

      return {
        status: (statusMap[payment.status] || "pending") as any,
      };
    } catch (error) {
      this.logger_.error(`Error obteniendo estado de pago: ${error.message}`);
      return { status: "pending" };
    }
  }

  /**
   * Procesa webhooks de Mercado Pago y retorna la acción a ejecutar
   */
  async getWebhookActionAndData(webhookData: {
    data: Record<string, unknown>;
    rawData: string | Buffer;
    headers: Record<string, unknown>;
  }): Promise<WebhookActionResult> {
    try {
      const data = webhookData.data;
      const action = data.action as string;
      const paymentId = data.id as string;

      this.logger_.info(
        `Webhook de Mercado Pago recibido: ${action} - Payment: ${paymentId}`
      );

      // Mercado Pago envía diferentes tipos de notificaciones
      // action puede ser: payment.created, payment.updated, etc.
      if (action && action.includes("payment")) {
        const payment = await this.getPaymentInfo(String(paymentId));

        // Mapear estados de Mercado Pago a acciones de Medusa
        if (payment.status === "approved") {
          return {
            action: "authorized" as const,
            data: {
              session_id: payment.id,
              amount: payment.transaction_amount * 100, // Convertir a centavos
            },
          };
        } else if (
          payment.status === "rejected" ||
          payment.status === "cancelled"
        ) {
          return {
            action: "failed" as const,
            data: {
              session_id: payment.id,
              amount: payment.transaction_amount * 100,
            },
          };
        }
      }

      // Para otros tipos de webhooks o estados no reconocidos
      return {
        action: "not_supported" as const,
        data: {
          session_id: String(paymentId),
          amount: 0,
        },
      };
    } catch (error) {
      this.logger_.error(
        `Error procesando webhook de Mercado Pago: ${error.message}`
      );
      return {
        action: "not_supported" as const,
        data: {
          session_id: "unknown",
          amount: 0,
        },
      };
    }
  }
}

export default MercadoPagoProviderService;
