# 🧪 Guía de Pruebas - PayU Colombia

## Estado Actual

✅ PayU Colombia está configurado y listo para probar
✅ Credenciales de sandbox configuradas en `.env`
✅ Provider registrado en `medusa-config.ts`
✅ Servicio implementado con todos los métodos

## Configuración Actual

### Credenciales de Sandbox (ya configuradas)

```bash
PAYU_API_LOGIN=pRRXKOl8ikMmt9u
PAYU_API_KEY=4Vj8eK4rloUd272L48hsrarnUA
PAYU_MERCHANT_ID=508029
PAYU_ACCOUNT_ID=512321  # Colombia
PAYU_PUBLIC_KEY=PKaC6H4cEDJD919n8p68l6PN70
PAYU_TEST_MODE=true
```

### URL del API de Sandbox

```
https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi
```

## Tarjetas de Prueba para Colombia

### ✅ Transacciones APROBADAS

#### VISA

```
Número: 4111111111111111
CVV: 777
Vencimiento: 12/25
Nombre: APPROVED
```

#### Mastercard

```
Número: 5500000000000004
CVV: 777
Vencimiento: 12/25
Nombre: APPROVED
```

#### American Express

```
Número: 377813000000001
CVV: 7777
Vencimiento: 12/25
Nombre: APPROVED
```

### ❌ Transacciones RECHAZADAS

```
Número: 4111111111111111
CVV: 666
Vencimiento: 12/25
Nombre: REJECTED
```

## Cómo Probar

### 1. Verificar que el servidor está corriendo

```bash
curl http://localhost:9000/health
```

### 2. Probar endpoint de verificación de PayU

```bash
curl http://localhost:9000/test/payu
```

Deberías ver una respuesta como:

```json
{
  "status": "success",
  "message": "PayU provider is available and working!",
  "provider": {
    "id": "payu",
    "is_enabled": true
  },
  "testCards": { ... }
}
```

### 3. Crear una Payment Collection

```bash
curl -X POST http://localhost:9000/test/payu \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "COP"}'
```

### 4. Probar desde el Admin de Medusa

1. Ve a http://localhost:9000/app
2. Crea un usuario admin si no existe
3. Crea un producto
4. Configura PayU como método de pago en las regiones
5. Simula una compra usando las tarjetas de prueba

## Flujo de Pago Completo

### Paso 1: Crear una orden

El cliente selecciona productos y llega al checkout.

### Paso 2: Inicializar sesión de pago

```typescript
// En tu frontend o workflow
const paymentSession = await paymentModuleService.createPaymentSession(
  paymentCollectionId,
  {
    provider_id: "payu",
    currency_code: "COP",
    amount: 50000, // 500.00 COP en centavos
    data: {
      description: "Compra en Store Echo",
      customer_email: "cliente@example.com",
    },
  }
);
```

### Paso 3: Autorizar el pago

```typescript
const authorizedPayment = await paymentModuleService.authorizePaymentSession(
  paymentSession.id,
  {
    context: {
      // Datos de la tarjeta del cliente
      card_number: "4111111111111111",
      cvv: "777",
      expiry_month: "12",
      expiry_year: "25",
      holder_name: "APPROVED",
    },
  }
);
```

### Paso 4: Capturar el pago (opcional, si usas autorización previa)

```typescript
const capturedPayment = await paymentModuleService.capturePayment({
  payment_id: authorizedPayment.id,
});
```

## Implementar Webhook para Notificaciones

PayU enviará notificaciones a tu servidor cuando el estado del pago cambie.

### Crear endpoint de webhook

Archivo: `src/api/webhooks/payu/route.ts`

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import crypto from "crypto";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

  try {
    const { state_pol, reference_sale, value, currency, transaction_id, sign } =
      req.body;

    // Verificar firma de seguridad
    const apiKey = process.env.PAYU_API_KEY;
    const merchantId = process.env.PAYU_MERCHANT_ID;

    const signature = crypto
      .createHash("md5")
      .update(
        `${apiKey}~${merchantId}~${reference_sale}~${value}~${currency}~${state_pol}`
      )
      .digest("hex");

    if (signature !== sign) {
      return res.status(400).json({
        error: "Invalid signature",
      });
    }

    // Procesar la notificación según el estado
    // state_pol = 4 -> Aprobado
    // state_pol = 6 -> Rechazado
    // state_pol = 7 -> Pendiente

    // Actualizar el pago en Medusa
    // ...

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
```

### Configurar URL del webhook en PayU

1. Ve al panel de PayU: https://merchants.payulatam.com/
2. Configuración > Configuración técnica
3. Agrega tu URL de confirmación:
   ```
   https://tu-dominio.com/webhooks/payu
   ```

## Verificar Transacciones en PayU

### Panel de PayU

https://merchants.payulatam.com/

Login con tus credenciales de sandbox y revisa:

- Reportes > Transacciones
- Aquí verás todas las transacciones de prueba

## Solución de Problemas

### Error: "PayU provider not found"

- Verifica que PayU esté en `medusa-config.ts`
- Reinicia el servidor: `npm run dev`

### Error: "Invalid credentials"

- Verifica las variables de entorno en `.env`
- Asegúrate de usar las credenciales de sandbox

### Transacción rechazada

- Verifica que usas las tarjetas de prueba correctas
- CVV 777 = Aprobada, CVV 666 = Rechazada
- Verifica que el nombre del titular sea "APPROVED"

### No llegan notificaciones al webhook

- Verifica que la URL esté configurada en PayU
- Asegúrate de que la URL sea accesible públicamente
- Usa ngrok o similar para exponer localhost: `ngrok http 9000`

## Próximos Pasos

1. ✅ Implementar webhook para notificaciones
2. ✅ Configurar URL del webhook en PayU
3. ✅ Probar flujo completo de pago
4. ✅ Integrar con el frontend de la tienda
5. ✅ Probar todos los escenarios (aprobado, rechazado, pendiente)
6. ✅ Documentar casos de borde y manejo de errores

## Referencias

- [Documentación oficial PayU](https://developers.payulatam.com/latam/es/docs.html)
- [API de Pagos](https://developers.payulatam.com/latam/es/docs/integrations/api-integration.html)
- [Webhooks/Confirmación](https://developers.payulatam.com/latam/es/docs/integrations/confirmation-page.html)
- [Tarjetas de Prueba](https://developers.payulatam.com/latam/es/docs/getting-started/test-your-solution.html)
