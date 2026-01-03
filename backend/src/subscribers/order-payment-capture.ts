import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { capturePaymentWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Subscriber que captura automáticamente los pagos de PayU cuando se crea una orden
 *
 * Esto convierte el flujo de autorización + captura manual en un flujo totalmente automático:
 * 1. Cliente realiza checkout
 * 2. Se autoriza el pago con PayU (AUTHORIZATION_AND_CAPTURE)
 * 3. Se crea la orden
 * 4. Este subscriber captura el pago automáticamente
 *
 * Para desactivar la captura automática, simplemente renombra o elimina este archivo.
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  const query = container.resolve("query");

  try {
    logger.info(
      `🔍 [PayU Auto-Capture] Orden ${data.id} creada, verificando pagos...`
    );

    // Obtener la orden con sus payment collections y payments
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "payment_status", "payment_collections.payments.*"],
      filters: { id: data.id },
    });

    const order = orders[0];

    if (!order || !order.payment_collections?.length) {
      logger.info(
        `⏭️  [PayU Auto-Capture] Orden ${data.id} no tiene pagos, omitiendo`
      );
      return;
    }

    // Procesar cada payment collection
    for (const collection of order.payment_collections) {
      if (!collection || !collection.payments?.length) continue;

      // Procesar cada payment
      for (const payment of collection.payments) {
        if (!payment) continue;

        // Solo capturar pagos de PayU que no estén capturados
        if (payment.provider_id === "pp_payu_payu" && !payment.captured_at) {
          logger.info(
            `💳 [PayU Auto-Capture] Capturando pago ${payment.id}...`
          );

          try {
            // Llamar al workflow de captura
            await capturePaymentWorkflow(container).run({
              input: {
                payment_id: payment.id,
              },
            });

            logger.info(
              `✅ [PayU Auto-Capture] Pago ${payment.id} capturado exitosamente`
            );
          } catch (captureError: any) {
            logger.error(
              `❌ [PayU Auto-Capture] Error capturando pago ${payment.id}:`,
              captureError.message
            );
            // No lanzamos el error para no bloquear la creación de la orden
          }
        } else if (payment.provider_id === "pp_payu_payu") {
          logger.info(
            `⏭️  [PayU Auto-Capture] Pago ${payment.id} ya está capturado`
          );
        }
      }
    }
  } catch (error: any) {
    logger.error(
      `❌ [PayU Auto-Capture] Error en handler de orden ${data.id}:`,
      error.message
    );
    // No lanzamos el error para no afectar la creación de la orden
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
