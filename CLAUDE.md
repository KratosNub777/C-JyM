# C-JyM — Catálogo E-commerce

## Qué es esto

Plataforma de catálogo e-commerce para una empresa comercial paraguaya (mediana-grande), enfocada en compras internacionales. Catálogo amplio: ~1.000 productos. Referencia de escala/estilo: tupi.com.py, pero a menor escala.

Arranca como catálogo visual (sin compra). Login y checkout con pagos reales se agregan en fases posteriores.

Repo: https://github.com/KratosNub777/C-JyM.git

## Stack

- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Backend/CMS:** Payload CMS (TypeScript, corre integrado con Next.js) — da API + panel de admin para que el equipo cargue/edite productos sin tocar código
- **Base de datos:** PostgreSQL
- **Búsqueda/filtros:** Meilisearch (autohospedado, sincronizado desde Payload)
- **Auth (Fase 2):** Better Auth
- **Pagos (Fase 3):** Bancard o Pagopar — a definir cuál según lo que la empresa tenga habilitado (ver pregunta abierta en la propuesta de presupuesto)
- **Imágenes:** Cloudflare R2 o Cloudinary
- **Hosting planeado:** Vercel (frontend) + Railway (Payload + Meilisearch) + Neon/Supabase (Postgres)
- **Dominio:** .com.py — se registra en NIC Paraguay a nombre de la empresa (requiere RUC), no a nombre del desarrollador

## Por qué este stack (decisiones ya tomadas, no volver a discutir sin razón nueva)

- **Payload CMS en vez de un backend Java a medida:** el desarrollador trabaja solo en el proyecto (sin equipo backend dedicado). Payload da admin panel + API listos, mismo lenguaje que el frontend (TypeScript), y es más rápido de mantener a largo plazo. Java (Spring Boot) solo tendría sentido si hubiera integración con sistemas legacy empresariales en Java — no es el caso.
- **TypeScript en todo el stack** (frontend + Payload + Better Auth): tipado compartido entre CMS y frontend, menos errores en código que maneja dinero (montos, estados de pedido). No es una limitante para las transacciones de pago — esas las procesa la pasarela (Bancard/Pagopar), el código propio solo orquesta la llamada y verifica el webhook de confirmación.
- **Meilisearch en vez de filtrado en JS:** con ~1.000 productos, un filtro simple del lado del cliente no escala bien para búsqueda instantánea.
- **No usar VTEX ni Shopify:** son plataformas enterprise/SaaS, sobredimensionadas para esta escala y con costos recurrentes altos. El stack propio da control total sin licencias.

## Fases del proyecto

1. **Fase 1 — Catálogo visual + infraestructura de datos.** Setup completo del stack, modelado de datos, importación masiva de los ~1.000 productos, panel de admin, diseño responsive, SEO básico. Sin login ni compra.
2. **Fase 2 — Autenticación.** Login/registro con Better Auth, perfil de usuario, direcciones guardadas, roles si aplica (minorista/mayorista).
3. **Fase 3 — Carrito + checkout + pagos.** Integración con Bancard o Pagopar, manejo de stock en tiempo real, emails transaccionales. Requiere especial cuidado en seguridad (correr `/security-review` antes de cerrar esta fase).
4. **Fase 4 — Panel de pedidos y post-venta.** Gestión de estados de pedido, historial de compras, notificaciones, reportes básicos.

Cada fase es independiente y facturable por separado. El detalle de alcance/precio está en la propuesta de presupuesto (documento separado, no en este repo).

## Cómo trabajar en este proyecto (modelo/flujo)

- **Sonnet** (default) para el 80% del trabajo: componentes, CRUD, configuración de Payload, scripts de importación, debugging.
- **Opus** para: arquitectura antes de escribir código, todo lo que toque la Fase 3 (pagos), auditorías de seguridad de auth.
- Una fase = un hilo de trabajo enfocado, no mezclar features grandes distintas en la misma sesión larga.
- Modo plan antes de features grandes; cambios chicos van directo.
- `/code-review` al cerrar cada fase; `/security-review` obligatorio antes de cerrar la Fase 3.
- Commits frecuentes y chicos, no uno gigante al final de la fase.
- Probar cada feature visual en navegador antes de darla por terminada.

## Convenciones

- Precios de producto: guardar en USD (`priceUsd`, obligatorio) y opcionalmente Gs (`priceGs`).
- Variable de entorno de conexión a la base: **`DATABASE_URL`** (no `DATABASE_URI` — así la nombra el adaptador `@payloadcms/db-postgres` generado por `create-payload-app`).
- Base de datos de desarrollo: Neon (cloud), no local — ver `.env.example`. El usuario gestiona su propia cuenta Neon; el connection string real vive solo en `.env` (gitignored).

### Estructura de carpetas (generada por `create-payload-app` template `blank`, Payload 3.x)

```
src/
  app/
    (frontend)/          # rutas públicas del catálogo (Next.js App Router)
      layout.tsx
      page.tsx            # home
      productos/
        page.tsx           # listado con paginación
        [slug]/page.tsx     # ficha de producto
      categorias/
        [slug]/page.tsx     # productos por categoría
      styles.css           # entry point de Tailwind (@import 'tailwindcss')
    (payload)/            # admin panel + API de Payload (autogenerado, no tocar a mano)
  collections/
    Users.ts              # usuarios admin del CMS (no confundir con clientes — eso es Fase 2/Better Auth)
    Media.ts              # uploads (imágenes de producto)
    Categories.ts          # categorías, soporta jerarquía vía campo `parent`
    Products.ts             # productos: precio USD/Gs, stock, categoría, imágenes, status
  components/
    ProductCard.tsx        # tarjeta de producto reutilizada en home/listado/categoría
  lib/
    payload.ts             # helper getPayloadClient() para la Local API de Payload en Server Components
  payload.config.ts        # registro de colecciones + adaptador postgres
  payload-types.ts         # tipos autogenerados — correr `npm run generate:types` tras editar una colección
```

- Alias de import: `@/*` → `src/*`, `@payload-config` → `src/payload.config.ts` (ya configurados en `tsconfig.json`).
- Después de agregar/editar campos en una colección, correr `npm run generate:types` para actualizar `payload-types.ts`.
- Las páginas del frontend usan la **Local API** de Payload (`getPayloadClient()` + `payload.find(...)`) en vez de llamar a la API REST — es más rápido porque no hay round-trip HTTP dentro del mismo proceso Next.js.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
