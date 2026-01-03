# ✅ PayU Configurado en Checkout

## Lo que se hizo

### 1. ✅ Provider configurado en backend

- Archivo: `medusa-config.ts`
- Provider ID: `pp_payu_payu`
- Credenciales: Sandbox de PayU Colombia

### 2. ✅ Provider agregado a la región

- Script ejecutado: `npm run add-payu`
- Región: Colombia (reg_01KD0RQS7KE3X4WGKKWMGTJA58)
- Providers en región: `["pp_payu_payu", "pp_system_default"]`

### 3. ✅ Frontend actualizado

- Archivo: `frontend/src/lib/constants.tsx`
- Agregado `pp_payu_payu` al `paymentInfoMap`
- Título: "PayU Colombia"
- Icono: CreditCard

## Cómo probar

### 1. Ir al checkout

```
http://localhost:8000/co/checkout
```

### 2. Verificar que aparezcan 2 opciones de pago:

- ✅ Manual Payment (para testing)
- ✅ PayU Colombia

### 3. Seleccionar PayU Colombia

### 4. Continuar al review

### 5. Hacer clic en "Place Order"

## Flujo de pago con PayU

```
1. Usuario selecciona productos → Carrito
2. Checkout → Shipping → Payment
3. Selecciona "PayU Colombia"
4. Click "Continue to review"
5. Click "Place Order"
6. Se llama a authorizePaymentSession() en el backend
7. PayU procesa el pago con los datos de tarjeta
8. Backend recibe respuesta de PayU
9. Si aprobado → Orden creada
10. Si rechazado → Mostrar error
```

## Datos de tarjetas de prueba

Para probar en el checkout, PayU usará las credenciales sandbox:

### Tarjeta APROBADA ✅

```
Número: 4111111111111111
CVV: 777
Vencimiento: 05/2029 (mes < 6 para aprobación)
Nombre: APPROVED
```

### Tarjeta RECHAZADA ❌

```
Número: 4111111111111111
CVV: 666
Vencimiento: 07/2029 (mes > 6 para rechazo)
Nombre: REJECTED
```

**Nota importante:** Según la documentación de PayU:

- Para transacciones APROBADAS: usar mes **menor que 6** (ej: 01, 02, 03, 04, 05)
- Para transacciones RECHAZADAS: usar mes **mayor que 6** (ej: 07, 08, 09, 10, 11, 12)

## Próximos pasos

### Inmediato

1. Probar el flujo completo de checkout con PayU
2. Verificar que la orden se cree correctamente
3. Probar con ambas tarjetas (aprobada y rechazada)

### Implementación completa

1. **Formulario de tarjeta en el frontend**

   - Actualmente el checkout espera que ingreses datos de tarjeta
   - Necesitas crear un componente de formulario de tarjeta
   - Ver: `frontend/src/modules/checkout/components/payment-container/`

2. **Captura de datos de tarjeta**

   - El frontend debe capturar: card_number, cvv, expiry_month, expiry_year, holder_name
   - Enviar estos datos en `initiatePaymentSession()`

3. **Webhook de PayU**

   - URL: `https://tu-dominio.com/webhooks/payment/pp_payu/payu`
   - Configurar en panel de PayU
   - Para pruebas locales: usar ngrok

4. **Implementar API calls reales a PayU**
   - Actualmente el service tiene TODOs
   - Ver: `backend/src/modules/payu/service.ts`
   - Métodos a implementar:
     - `createPayUTransaction()`
     - `getPaymentStatus()`
     - `createRefund()`

## Verificar estado actual

### Backend

```bash
cd backend
npm run test:payu  # Endpoint de prueba GET /test/payu
```

### Frontend

```bash
# Ir a checkout y verificar que aparezca PayU
http://localhost:8000/co/checkout
```

### Provider en región

```bash
cd backend
npm run add-payu  # Ver si PayU ya está en la región
```

## Archivos modificados

### Backend

- ✅ `medusa-config.ts` - PayU configurado
- ✅ `.env` - Credenciales sandbox
- ✅ `src/modules/payu/service.ts` - Provider implementado
- ✅ `src/modules/payu/index.ts` - Module definition
- ✅ `src/scripts/add-payu-to-region.ts` - Script de configuración
- ✅ `src/scripts/seed.ts` - Seed actualizado con PayU
- ✅ `package.json` - Script `add-payu` agregado

### Frontend

- ✅ `src/lib/constants.tsx` - PayU agregado al paymentInfoMap

## Troubleshooting

### Si PayU no aparece en checkout:

1. Verificar que el backend esté corriendo
2. Ejecutar: `npm run add-payu` en backend
3. Reiniciar frontend: `npm run dev`
4. Limpiar cache del navegador

### Si aparece error al procesar pago:

1. Revisar logs del backend: `docker compose logs -f medusa`
2. Verificar credenciales en `.env`
3. Verificar que `PAYU_TEST_MODE=true`

### Si webhook no funciona:

1. Usar ngrok: `ngrok http 9000`
2. Configurar URL en PayU panel
3. Ver logs en: `/webhooks/payment/pp_payu/payu`
