# PayU Colombia Payment Provider para Medusa

Este módulo integra PayU Colombia como proveedor de pagos en Medusa.

## 🇨🇴 Configuración Específica para Colombia

### Métodos de Pago Soportados

- ✅ **Tarjetas de crédito/débito**: Visa, Mastercard, American Express, Diners
- ✅ **PSE** (Pagos Seguros en Línea): Transferencias bancarias online
- ✅ **Efectivo**: Efecty, Baloto, Gana, etc.

### URLs y Endpoints

- **API Producción**: `https://api.payulatam.com/payments-api/4.0/service.cgi`
- **API Sandbox**: `https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi`
- **Queries**: `https://api.payulatam.com/reports-api/4.0/service.cgi`

## Configuración

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```bash
# Credenciales de Prueba (Sandbox)
PAYU_API_KEY=4Vj8eK4rloUd272L48hsrarnUA
PAYU_API_LOGIN=pRRXKOl8ikMmt9u
PAYU_MERCHANT_ID=508029
PAYU_ACCOUNT_ID=512321  # Colombia (ver tabla por país)
PAYU_PUBLIC_KEY=PKaC6H4cEDJD919n705L544kSU
PAYU_TEST_MODE=true

# Credenciales de Producción (cuando estés listo)
# PAYU_API_KEY=tu-api-key-produccion
# PAYU_API_LOGIN=tu-api-login-produccion
# PAYU_MERCHANT_ID=tu-merchant-id
# PAYU_ACCOUNT_ID=tu-account-id
# PAYU_PUBLIC_KEY=tu-public-key
# PAYU_TEST_MODE=false
```

### 2. Configuración en medusa-config.ts

Agrega el proveedor a la configuración del Payment Module:

```typescript
{
  resolve: "@medusajs/medusa/payment",
  options: {
    providers: [
      {
        resolve: "./src/modules/payu",
        id: "payu",
        options: {
          apiKey: process.env.PAYU_API_KEY,
          merchantId: process.env.PAYU_MERCHANT_ID,
          accountId: process.env.PAYU_ACCOUNT_ID,
          apiUrl: process.env.PAYU_API_URL,
          testMode: process.env.PAYU_TEST_MODE === "true",
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
4. Edita la región y agrega "PayU" como proveedor de pagos

## ID del Proveedor

El proveedor se registrará con el ID: `pp_payu_payu`

## Métodos de Pago Soportados

- Tarjetas de crédito/débito
- PSE (Pagos Seguros en Línea - Colombia)
- Efectivo (según país)
- Otros métodos según tu configuración en PayU

## Implementación

### Estado Actual

El módulo tiene la estructura completa pero los métodos que interactúan con la API de PayU están pendientes de implementación (marcados con TODO).

### Próximos Pasos

1. **Instalar SDK de PayU** (si existe para Node.js):

   ```bash
   npm install @payu/sdk
   ```

2. **Implementar los métodos privados** en `service.ts`:

   - `createPayUTransaction()`
   - `authorizePayUTransaction()`
   - `capturePayUTransaction()`
   - `refundPayUTransaction()`
   - `cancelPayUTransaction()`
   - `getPayUTransactionStatus()`

3. **Configurar webhooks** para recibir notificaciones de PayU sobre cambios en el estado de los pagos.

4. **Implementar manejo de diferentes métodos de pago** según tu región (PSE, efectivo, etc.).

## Documentación de PayU

- [PayU Latam - Documentación API](https://developers.payulatam.com/)
- [Guía de Integración](https://developers.payulatam.com/latam/es/docs/integrations.html)
- [API Reference](https://developers.payulatam.com/latam/es/payu-module-documentation/payu-operations/payments.html)

## Flujo de Pago

1. Cliente agrega productos al carrito
2. En checkout, se crea una PaymentCollection
3. Se llama `initiatePayment()` → Crea transacción en PayU
4. Cliente ingresa datos de pago
5. Se llama `authorizePayment()` → Autoriza en PayU
6. Si es exitoso, se crea la orden
7. Se llama `capturePayment()` → Captura fondos en PayU
8. Opcionalmente: `refundPayment()` para reembolsos

## Soporte

Para soporte con la integración de PayU, consulta:

- [Centro de ayuda PayU](https://payulatam.zendesk.com/)
- [Documentación de Medusa Payment Module](https://docs.medusajs.com/resources/commerce-modules/payment)
