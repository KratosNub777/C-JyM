# C-JyM — Catálogo E-commerce

## Qué es esto

Plataforma de catálogo e-commerce para **Comercial José María** (@jmcomercialpy en Instagram, atom.bio/comercialjosemaria08), una casa de **electrodomésticos** paraguaya (heladeras, cocinas, lavarropas, televisores, climatización, pequeños electrodomésticos — marcas propias del rubro: Tokyo, Jam, Philco). Empresa mediana-grande, catálogo amplio: ~1.000 productos. Referencia de escala/estilo: tupi.com.py, pero a menor escala.

Arranca como catálogo visual (sin compra). Login y checkout con pagos reales se agregan en fases posteriores.

**Nota:** la instrucción original de este archivo decía "enfocada en compras internacionales" — eso era una suposición inicial sobre el rubro (se pensó en un catálogo tipo Apple/tecnología). Al revisar el Instagram real de la empresa se confirmó que es una casa de electrodomésticos de venta local, no un importador internacional. El catálogo mock actual (categorías y ~17 productos) ya refleja esto. Si en el futuro se confirma que sí hacen importación directa, ajustar esta sección y el copy de `ValuePropStrip`.

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

## Escalabilidad

Las queries de catálogo (productos y categorías) están cacheadas con
`unstable_cache` (ver `src/lib/productQueries.ts`, `src/lib/categoryQueries.ts`
y los tags compartidos en `src/lib/cacheTags.ts`), y home + ficha de producto
usan ISR (`revalidate`) de Next.js. La mayoría de las visitas se sirven desde
el borde de Vercel sin tocar Postgres. Al editar un producto o categoría desde
`/admin`, un hook de la colección invalida el tag correspondiente para que el
cambio se vea sin esperar al revalidate. Vercel escala solo (serverless); Neon
y Meilisearch escalan subiendo de plan/tamaño de cómputo cuando el tráfico lo
justifique.

## Cómo trabajar en este proyecto (modelo/flujo)

- **Sonnet** (default) para el 80% del trabajo: componentes, CRUD, configuración de Payload, scripts de importación, debugging.
- **Opus** para: arquitectura antes de escribir código, todo lo que toque la Fase 3 (pagos), auditorías de seguridad de auth.
- Una fase = un hilo de trabajo enfocado, no mezclar features grandes distintas en la misma sesión larga.
- Modo plan antes de features grandes; cambios chicos van directo.
- `/code-review` al cerrar cada fase; `/security-review` obligatorio antes de cerrar la Fase 3.
- Commits frecuentes y chicos, no uno gigante al final de la fase.
- Probar cada feature visual en navegador antes de darla por terminada.

## Convenciones

- Precios de producto: **solo guaraníes** (`price`, obligatorio). No se maneja USD — se descartó explícitamente, la empresa no vende en dólares.
- Variable de entorno de conexión a la base: **`DATABASE_URL`** (no `DATABASE_URI` — así la nombra el adaptador `@payloadcms/db-postgres` generado por `create-payload-app`).
- Base de datos de desarrollo: Neon (cloud), no local — ver `.env.example`. El usuario gestiona su propia cuenta Neon; el connection string real vive solo en `.env` (gitignored).
- `SITE_URL`: URL pública del sitio (metadata/OG, sitemap). Sin prefijo `NEXT_PUBLIC_` a propósito — solo se lee en código server-side (`src/lib/site.ts`), nunca en el cliente. En dev queda en `http://localhost:3000`; actualizar cuando se registre el dominio `.com.py`.
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL`: auth de clientes (Fase 2). El secreto es aleatorio, ≥32 caracteres y distinto de `PAYLOAD_SECRET`. Las tablas de Better Auth (`user`, `session`, `account`, `verification`, `rate_limit`) las crea `npm run auth:migrate` y están excluidas del `tablesFilter` de Payload — mantener esa exclusión.
- `ORDER_RESERVATION_HOURS` (1–168, default 24): plazo de reserva de stock de un pedido impago; se guarda en cada pedido. `CRON_SECRET` (≥32 caracteres): protege `POST /api/cron/expire-orders`. `RESERVATION_POLL_SECONDS`: intervalo del worker (`npm run orders:worker`; `npm run orders:expire` corre una vez).
- Identidades separadas: los **clientes** (Better Auth, tablas propias) y el **equipo** (Payload `users`, `/admin` y `/catalogar`) no comparten sesión ni cookies. Una sesión de cliente nunca da acceso al CMS. `customerId` de direcciones y pedidos siempre se deriva de la sesión en el servidor, nunca de un formulario.
- Pedidos (`Orders`) y direcciones se mutan solo desde server actions con `overrideAccess: true` y filtro por dueño; el stock se reserva/devuelve dentro de transacciones con bloqueos (ver `src/lib/checkout/`).
- `MEILISEARCH_HOST` / `MEILISEARCH_API_KEY`: instancia de Meilisearch que sincroniza `Products` (ver hooks en `src/collections/Products.ts`). En dev se levanta con `docker compose up -d meilisearch`.

### Estructura de carpetas (generada por `create-payload-app` template `blank`, Payload 3.x)

```
src/
  app/
    (frontend)/          # rutas públicas del catálogo (Next.js App Router)
      layout.tsx
      page.tsx            # home
      productos/
        page.tsx           # listado con filtros, orden y paginación
        [slug]/page.tsx     # ficha de producto (ISR)
      categorias/
        [slug]/page.tsx     # productos por categoría, con filtros y orden
      buscar/page.tsx      # resultados de búsqueda (Meilisearch), con filtros y orden
      ofertas/page.tsx     # productos en oferta, con filtros y orden
      sitemap.ts / robots.ts
      styles.css           # entry point de Tailwind (@import 'tailwindcss')
    (payload)/            # admin panel + API de Payload (autogenerado, no tocar a mano)
      ingresar/ registrarse/  # login y registro de clientes (`?next=/checkout` es el único destino alternativo permitido)
      cuenta/                 # área privada: perfil, direcciones/, pedidos/ y pedidos/[id]
      carrito/ checkout/      # carrito (localStorage + precios/stock actuales vía /api/carrito) y checkout con retiro en el local
    api/
      auth/[...all]/         # handler de Better Auth
      carrito/               # consulta de precios y stock actuales por IDs
      cron/expire-orders/    # vence pedidos impagos (Bearer CRON_SECRET)
    catalogar/            # formulario público fuera del catálogo (no confundir con /admin)
  collections/
    Users.ts              # usuarios admin del CMS (no confundir con clientes — eso es Fase 2/Better Auth)
    Media.ts              # uploads (imágenes de producto)
    Categories.ts          # categorías, soporta jerarquía vía campo `parent`
    Products.ts             # productos: precio en Gs., stock, categoría, imágenes, status
    Addresses.ts            # direcciones de clientes (customerId de Better Auth); solo el equipo lee por REST
    Orders.ts               # pedidos con snapshot de precios; sin create/update/delete públicos, todo pasa por checkout
  components/
    ProductCard.tsx        # tarjeta de producto reutilizada en home/listado/categoría
    ProductCarousel.tsx, ProductGridSkeleton.tsx
    FilterBar.tsx           # orden + combobox de marca + rango de precio + toggle de ofertas
    Pagination.tsx
    Hero.tsx, CategoryBentoGrid.tsx, CategoryShelf.tsx, ValuePropStrip.tsx, HeaderNav.tsx
    InstallmentBreakdown.tsx
    cart/, checkout/, customerAuth/, UserMenu.tsx   # UI de carrito, checkout y auth de clientes
  lib/
    payload.ts             # helper getPayloadClient() para la Local API de Payload en Server Components
    productQueries.ts, categoryQueries.ts  # queries cacheadas con unstable_cache
    cacheTags.ts            # tags de caché compartidos + invalidación desde hooks de colección
    productFilters.ts       # parseo de filtros de URL (marca, precio, ofertas, orden)
    products.ts, categories.ts, pricing.ts, format.ts, slug.ts
    site.ts                 # helper de SITE_URL para metadata/sitemap
    customerAuth/           # instancia de Better Auth, sesión de servidor, cliente y validación de direcciones
    cart/                   # modelo y store del carrito
    checkout/               # creación/cancelación/vencimiento de pedidos, transacciones, política de reserva, cron
    meilisearch.ts, auth.ts, useClickOutside.ts, validateProductFields.ts
  payload.config.ts        # registro de colecciones + adaptador postgres
  payload-types.ts         # tipos autogenerados — correr `npm run generate:types` tras editar una colección
```

- `migrations/`: SQL de referencia para producción (`customer-auth/`, `checkout/`). El push automático de Payload solo aplica en desarrollo; antes de desplegar hay que preparar las migraciones de Payload (incluido el esquema de Orders).
- Alias de import: `@/*` → `src/*`, `@payload-config` → `src/payload.config.ts` (ya configurados en `tsconfig.json`).
- Después de agregar/editar campos en una colección, correr `npm run generate:types` para actualizar `payload-types.ts`.
- Las páginas del frontend usan la **Local API** de Payload (`getPayloadClient()` + `payload.find(...)`) en vez de llamar a la API REST — es más rápido porque no hay round-trip HTTP dentro del mismo proceso Next.js.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Pruebas

- `npm run test:int` (Vitest) y `npm run test:e2e` (Playwright, el script incluye el loader de `tsx`; no correr `npx playwright` directo). **Ambos corren contra la base Neon de desarrollo** y crean/eliminan sus propios fixtures — nunca apuntar `DATABASE_URL` a producción.
- Playwright corre con `workers: 1` a propósito: los E2E comparten base (stock, pedidos, clientes) y en paralelo se interfieren.
- Al escribir E2E nuevos: (1) el rate limit de Better Auth vive en Postgres y `/sign-up` se agota tras pocos registros seguidos — limpiar `rate_limit` antes de registrar (ver `register()` en `customer-auth.e2e.spec.ts`); (2) `getPayload()` cachea la instancia `default` por worker y otros specs la destruyen en su `afterAll` — usar `getPayload({ config, key: ... })` propio para no heredar un pool cerrado.
- Antes de desplegar: definir `SITE_URL` con la URL HTTPS real (el build avisa si falta en producción).
