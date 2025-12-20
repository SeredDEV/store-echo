# Store Echo - Tienda E-commerce con Medusa.js

<p align="center">
  <img src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg" alt="Medusa" width="300"/>
</p>

<p align="center">
  <strong>Plataforma de comercio digital construida con Medusa v2.12.3</strong>
</p>

<p align="center">
  <a href="https://docs.medusajs.com">📚 Documentación</a> •
  <a href="./MEDUSA-GUIDE.md">📖 Guía Completa</a> •
  <a href="https://discord.gg/medusajs">💬 Discord</a>
</p>

---

## 🚀 Descripción

**Store Echo** es una plataforma de e-commerce completa construida con:

- **Backend**: [Medusa Framework v2.12.3](https://docs.medusajs.com/) - Framework de comercio headless
- **Frontend**: [Next.js 15](https://nextjs.org/) - Storefront moderno con React 19
- **UI**: [Medusa UI](https://docs.medusajs.com/) + [Tailwind CSS](https://tailwindcss.com/)

## ✨ Características

- 🛒 **Carrito y Checkout** completo
- 💳 **Múltiples métodos de pago** (Stripe integrado)
- 📦 **Gestión de inventario** multi-almacén
- 🌍 **Multi-región y multi-moneda**
- 👥 **Gestión de clientes** y grupos
- 🎁 **Promociones y descuentos**
- 📊 **Panel de administración** personalizable
- 🌐 **Admin en español** - Traducciones completas incluidas
- 🔧 **100% personalizable** y extensible

## 📋 Requisitos Previos

- **Node.js**: >= 20.x
- **PostgreSQL**: >= 14.x (o SQLite para desarrollo)
- **Yarn**: >= 1.22.x

## 🏁 Inicio Rápido

### 1️⃣ Configurar el Backend

```bash
cd backend

# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Migrar base de datos
yarn db:migrate

# Poblar con datos de prueba
yarn seed

# Crear usuario administrador
yarn user:create
# Email: admin@medusa-test.com
# Password: supersecret

# Iniciar servidor de desarrollo
yarn dev
```

✅ **Backend disponible en**: http://localhost:9000  
✅ **Admin Panel**: http://localhost:9000/app

### 2️⃣ Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env.local
# Asegurar que NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000

# Iniciar storefront
yarn dev
```

✅ **Storefront disponible en**: http://localhost:8000

### 3️⃣ Cambiar el Admin a Español 🌐

El admin viene con traducciones completas en español:

1. Abre el Admin Panel: http://localhost:9000/app
2. Haz clic en tu avatar (esquina superior derecha)
3. Ve a Settings → Language
4. Selecciona **Español**
5. ¡Listo! El admin ahora está en español

**Guía completa**: Ver [`TRADUCCIONES-ADMIN.md`](./TRADUCCIONES-ADMIN.md)

## 📁 Estructura del Proyecto

```
store-echo/
├── backend/                    # Aplicación Medusa
│   ├── src/
│   │   ├── admin/             # 🎨 Personalizaciones del Admin
│   │   ├── api/               # 🔌 Rutas API personalizadas
│   │   │   ├── admin/         # Endpoints para Admin
│   │   │   └── store/         # Endpoints para Storefront
│   │   ├── jobs/              # ⏰ Trabajos programados (cron)
│   │   ├── links/             # 🔗 Enlaces entre modelos de datos
│   │   ├── modules/           # 📦 Módulos personalizados
│   │   ├── scripts/           # 🛠️ Scripts de utilidad
│   │   ├── subscribers/       # 📡 Suscriptores de eventos
│   │   └── workflows/         # ⚙️ Workflows personalizados
│   ├── medusa-config.ts       # ⚙️ Configuración principal
│   └── package.json
│
├── frontend/                   # Storefront Next.js
│   ├── src/
│   │   ├── app/               # App Router de Next.js
│   │   ├── components/        # Componentes React
│   │   ├── lib/               # Utilidades y helpers
│   │   └── modules/           # Módulos de funcionalidad
│   ├── public/                # Archivos estáticos
│   └── package.json
│
├── MEDUSA-GUIDE.md            # 📖 Guía completa en español
├── EJEMPLOS.md                # 📚 Ejemplos de código
├── INICIO-RAPIDO.md           # ⚡ Configuración rápida
├── TRADUCCIONES-ADMIN.md      # 🌐 Admin en español
└── README.md                  # Este archivo
```

## 🎯 Comandos Principales

### Backend

```bash
# Desarrollo
yarn dev                        # Servidor en modo desarrollo
yarn build                      # Construir para producción
yarn start                      # Iniciar en producción

# Base de datos
yarn db:migrate                 # Ejecutar migraciones
yarn db:reset                   # Resetear BD (drop + migrate + seed)
yarn seed                       # Poblar con datos de prueba

# Testing
yarn test:unit                  # Tests unitarios
yarn test:integration:http      # Tests de integración
```

### Frontend

```bash
yarn dev                        # Desarrollo (localhost:8000)
yarn build                      # Construir para producción
yarn start                      # Iniciar en producción
yarn lint                       # Ejecutar linter
```

## 🛠️ Desarrollo y Personalización

### Crear una Ruta API Personalizada

```typescript
// backend/src/api/store/custom/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ message: "¡Hola desde tu API personalizada!" })
}
```

### Crear un Modelo de Datos

```typescript
// backend/src/modules/brand/models/brand.ts
import { model } from "@medusajs/framework/utils"

const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  logo_url: model.text().nullable(),
})

export default Brand
```

### Crear un Workflow

```typescript
// backend/src/workflows/send-welcome-email.ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"

export const sendWelcomeEmailWorkflow = createWorkflow(
  "send-welcome-email",
  function (input: { email: string; name: string }) {
    // Lógica del workflow
    return new WorkflowResponse({ sent: true })
  }
)
```

### Personalizar el Admin

```typescript
// backend/src/admin/widgets/custom-widget.tsx
import { defineWidgetConfig } from "@medusajs/admin-sdk"

const CustomWidget = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3>Widget Personalizado</h3>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default CustomWidget
```

### Suscribirse a Eventos

```typescript
// backend/src/subscribers/order-placed.ts
import { SubscriberArgs } from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs) {
  console.log("📦 Nueva orden creada:", data.id)
  // Tu lógica personalizada aquí
}

export const config = {
  event: "order.placed",
}
```

## 📚 Documentación y Recursos

### 📖 Documentación Principal

- **[MEDUSA-GUIDE.md](./MEDUSA-GUIDE.md)** - Guía completa en español con ejemplos
- **[Documentación Oficial](https://docs.medusajs.com/)** - Docs oficiales de Medusa
- **[API Reference](https://docs.medusajs.com/api)** - Referencia de APIs

### 🎓 Tutoriales y Recetas

- [Crear un Marketplace](https://docs.medusajs.com/recipes/marketplace)
- [Productos Digitales](https://docs.medusajs.com/recipes/digital-products)
- [Suscripciones](https://docs.medusajs.com/recipes/subscriptions)
- [Integración con ERP](https://docs.medusajs.com/recipes/erp)

### 🧩 Módulos de Comercio

Medusa incluye módulos para todas las funcionalidades de e-commerce:

| Módulo | Descripción |
|--------|-------------|
| 🛒 **Cart** | Carrito de compras y checkout |
| 💳 **Payment** | Procesamiento de pagos |
| 📦 **Order** | Gestión de pedidos (OMS) |
| 📦 **Fulfillment** | Cumplimiento y envíos |
| 📊 **Inventory** | Gestión de inventario |
| 🏷️ **Product** | Catálogo de productos |
| 💰 **Pricing** | Motor de precios |
| 🎁 **Promotion** | Descuentos y promociones |
| 👥 **Customer** | Gestión de clientes |
| 🌍 **Region** | Multi-región |
| 💱 **Currency** | Multi-moneda |
| 🔐 **Auth** | Autenticación |

**[Ver todos los módulos →](https://docs.medusajs.com/)**

### 🛠️ Herramientas

- **[@medusajs/cli](https://docs.medusajs.com/)** - CLI de Medusa
- **[@medusajs/js-sdk](https://docs.medusajs.com/)** - SDK de JavaScript
- **[@medusajs/ui](https://docs.medusajs.com/)** - Biblioteca de componentes UI

### 💬 Comunidad

- [Discord](https://discord.gg/medusajs) - Chat en tiempo real
- [GitHub Discussions](https://github.com/medusajs/medusa/discussions) - Discusiones
- [Twitter](https://twitter.com/medusajs) - Actualizaciones
- [Blog](https://medusajs.com/blog/) - Artículos y tutoriales

## 🔐 Variables de Entorno

### Backend (.env)

```env
# Base de datos
DATABASE_URL=postgres://user:password@localhost:5432/medusa

# CORS
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:7001,http://localhost:9000
AUTH_CORS=http://localhost:7001,http://localhost:9000

# Secrets
JWT_SECRET=your-jwt-secret-here
COOKIE_SECRET=your-cookie-secret-here

# Stripe (opcional)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env.local)

```env
# URL del backend
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000

# Stripe (si usas pagos)
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
```

## 🚀 Despliegue

### Opción 1: Medusa Cloud (Recomendado)

```bash
# Instalar CLI de Medusa Cloud
npm install -g @medusajs/medusa-cli

# Login
medusa login

# Desplegar
medusa deploy
```

**[Más info sobre Medusa Cloud →](https://medusajs.com/cloud)**

### Opción 2: Manual (VPS, AWS, etc.)

1. Construir el backend: `cd backend && yarn build`
2. Construir el frontend: `cd frontend && yarn build`
3. Configurar variables de entorno de producción
4. Iniciar servicios con PM2 o similar

## 🧪 Testing

```bash
# Backend - Tests unitarios
cd backend && yarn test:unit

# Backend - Tests de integración
cd backend && yarn test:integration:http

# Frontend - Linting
cd frontend && yarn lint
```

## 📦 Tecnologías Utilizadas

### Backend
- **Medusa Framework** v2.12.3
- **TypeScript** v5.6.2
- **Node.js** >= 20
- **PostgreSQL** / SQLite

### Frontend
- **Next.js** v15.3.8
- **React** v19.0.3
- **TypeScript** v5.3.2
- **Tailwind CSS** v3.0.23
- **Medusa UI** (latest)
- **Stripe** (pagos)

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto usa licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

¿Necesitas ayuda?

- 📖 Lee la [Guía Completa](./MEDUSA-GUIDE.md)
- 📚 Consulta la [Documentación Oficial](https://docs.medusajs.com/)
- 💬 Únete al [Discord de Medusa](https://discord.gg/medusajs)
- 🐛 [Reporta un bug](https://github.com/medusajs/medusa/issues)

---

<p align="center">
  Hecho con ❤️ usando <a href="https://medusajs.com">Medusa</a>
</p>

<p align="center">
  <a href="https://docs.medusajs.com">Documentación</a> •
  <a href="https://medusajs.com/blog">Blog</a> •
  <a href="https://twitter.com/medusajs">Twitter</a> •
  <a href="https://discord.gg/medusajs">Discord</a>
</p>

