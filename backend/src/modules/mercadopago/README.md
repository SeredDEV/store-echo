# Mercado Pago Payment Provider para Medusa

Este módulo integra Mercado Pago como proveedor de pagos en Medusa.

## Características

- ✅ Pagos con tarjeta de crédito/débito
- ✅ Pagos en efectivo (Oxxo, Boleto, etc.)
- ✅ Transferencias bancarias (PIX en Brasil)
- ✅ Checkout redirect o checkout transparente
- ✅ Reembolsos totales y parciales
- ✅ Webhooks para notificaciones

## Configuración

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef123456
MERCADOPAGO_PUBLIC_KEY=APP_USR-1234567890-123456-abcdef123456
MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret  # Opcional
MERCADOPAGO_TEST_MODE=true  # Opcional
```

### 2. Configuración en medusa-config.ts

Agrega el proveedor a la configuración del Payment Module:

```typescript
{
  resolve: "@medusajs/medusa/payment",
  options: {
    providers: [
      {
        resolve: "./src/modules/mercadopago",
        id: "mercadopago",
        options: {
          accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
          publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
          webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
          testMode: process.env.MERCADOPAGO_TEST_MODE === "true",
        },
      },
    ],
  },
}
```

### 3. Habilitar en una Región

1. Inicia tu aplicación: `npm run dev`
2. Ve al Admin Dashboard
3. Settings → Regions → Selecciona una región
4. Edita la región y agrega "Mercado Pago" como proveedor de pagos

## ID del Proveedor

El proveedor se registrará con el ID: `pp_mercadopago_mercadopago`

## Métodos de Pago Soportados

### Por País

**Argentina:**

- Tarjetas de crédito/débito
- Rapipago
- Pago Fácil

**Brasil:**

- Tarjetas de crédito/débito
- PIX
- Boleto Bancário

**Chile:**

- Tarjetas de crédito/débito
- Transferencia bancaria

**Colombia:**

- Tarjetas de crédito/débito
- PSE
- Efecty

**México:**

- Tarjetas de crédito/débito
- OXXO
- SPEI

**Perú:**

- Tarjetas de crédito/débito
- BCP
- Pago Efectivo

## Instalación del SDK

Es recomendable instalar el SDK oficial de Mercado Pago:

```bash
npm install mercadopago
```

## Implementación

### Estado Actual

El módulo tiene la estructura completa pero los métodos que interactúan con la API de Mercado Pago están pendientes de implementación (marcados con TODO).

### Próximos Pasos

1. **Implementar los métodos con el SDK**:

   ```typescript
   import mercadopago from "mercadopago";

   mercadopago.configure({
     access_token: this.options_.accessToken,
   });
   ```

2. **Configurar webhooks** en `/api/webhooks/mercadopago`:

   ```typescript
   // Recibir notificaciones de Mercado Pago
   // POST /api/webhooks/mercadopago
   ```

3. **Implementar checkout transparente** (opcional):

   - Integrar con el SDK de JavaScript en el frontend
   - Tokenizar tarjetas del lado del cliente
   - Procesar pagos sin redirección

4. **Manejo de diferentes métodos de pago**:
   - Configurar payment_methods en las preferencias
   - Excluir métodos no deseados
   - Configurar cuotas (installments)

## Webhooks

Mercado Pago enviará notificaciones a:

```
POST https://tu-dominio.com/api/webhooks/mercadopago
```

Debes crear un endpoint para procesar estas notificaciones:

```typescript
// backend/src/api/webhooks/mercadopago/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { type, data } = req.body;

  if (type === "payment") {
    // Actualizar el estado del pago en Medusa
    const paymentId = data.id;
    // TODO: Consultar el pago y actualizar en Medusa
  }

  res.sendStatus(200);
}
```

## Documentación de Mercado Pago

- [Documentación Oficial](https://www.mercadopago.com/developers)
- [API Reference](https://www.mercadopago.com/developers/es/reference)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Checkout Pro](https://www.mercadopago.com/developers/es/docs/checkout-pro/landing)
- [Checkout API](https://www.mercadopago.com/developers/es/docs/checkout-api/landing)

## Flujo de Pago

### Checkout Redirect (Checkout Pro)

1. Cliente agrega productos al carrito
2. En checkout, se crea una Preferencia de Pago
3. Cliente es redirigido a Mercado Pago
4. Cliente completa el pago en Mercado Pago
5. Cliente es redirigido de vuelta a la tienda
6. Webhook notifica el resultado del pago
7. Se actualiza el estado en Medusa

### Checkout Transparente (Checkout API)

1. Cliente ingresa datos de pago en tu sitio
2. Se tokeniza la tarjeta con el SDK de JS
3. Se envía el token a tu backend
4. Se procesa el pago directamente sin redirección
5. Se recibe la respuesta inmediatamente

## Testing

Mercado Pago provee tarjetas de prueba:

```
Tarjeta aprobada:
- VISA: 4509 9535 6623 3704
- Mastercard: 5031 7557 3453 0604

Tarjeta rechazada:
- VISA: 4111 1111 1111 1111
```

## Soporte

- [Centro de ayuda Mercado Pago](https://www.mercadopago.com/ayuda)
- [Documentación de Medusa Payment Module](https://docs.medusajs.com/resources/commerce-modules/payment)
