# Fase 2: cuentas de clientes

Better Auth maneja clientes con email y contraseña. Payload mantiene el acceso del equipo interno a `/admin` y `/catalogar`; son identidades y cookies independientes.

## Desarrollo

1. `npm install`.
2. Configurar `DATABASE_URL`, `PAYLOAD_SECRET`, `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` en `.env`. El secreto de Better Auth debe ser aleatorio, de al menos 32 caracteres, diferente del de Payload. La URL local es `http://localhost:3000`. Better Auth solo acepta iniciar sesión desde `BETTER_AUTH_URL`; para otros orígenes de producción (p. ej. la variante con o sin `www`) listar las URLs exactas, sin comodines, en `BETTER_AUTH_TRUSTED_ORIGINS` separadas por coma. Las URLs de deploy y de rama de los previews de Vercel se confían solas.
3. `npm run auth:migrate` crea o actualiza las tablas de Better Auth usando la versión instalada. Se puede repetir; no borra usuarios. `npm run auth:generate` genera el SQL pendiente para revisión en `migrations/customer-auth/schema.sql`.
4. `npm run dev`. Payload sincroniza su esquema de desarrollo, incluida la colección `addresses`.
5. Abrir `/registrarse`, `/ingresar`, `/cuenta` o `/cuenta/direcciones`.

Las tablas `user`, `session`, `account`, `verification` y `rate_limit` son propiedad de Better Auth y están excluidas del `tablesFilter` de Payload. Mantener esta exclusión al agregar migraciones. `jose` 6 está declarado explícitamente porque el proyecto instala con `legacy-peer-deps` y Better Auth lo requiere; Payload conserva su propia versión 5.

## Comportamiento y límites

- El registro inicia sesión automáticamente. Contraseñas de 8 a 128 caracteres, sin verificación de email, login social, roles comerciales ni recuperación por correo en esta fase.
- El perfil muestra nombre y email. No incluye cambios de email o contraseña.
- Cada acción de direcciones valida la sesión y deriva `customerId` del servidor. Las consultas y mutaciones filtran por propietario; un ID ajeno no permite leer, modificar ni eliminar otra dirección.
- Cambiar la predeterminada utiliza una transacción y un bloqueo por cliente para serializar escrituras concurrentes. Eliminar o desmarcar la predeterminada puede dejar al cliente sin predeterminada. Las operaciones manuales del equipo desde Payload no aplican esta normalización automática.
- REST y GraphQL de direcciones requieren una sesión interna de Payload. Una sesión de cliente no concede acceso al CMS.
- El menú consulta la sesión en el navegador, conservando ISR en el catálogo. Las páginas privadas consultan en servidor. No se utiliza un proxy basado en presencia de cookies.
- Better Auth guarda el rate limit en Postgres, compartido entre instancias. Las operaciones del cliente usan sus protecciones de origen; las Server Actions usan las de Next.js.

## Verificación

```sh
npx tsc --noEmit
npm run lint
npx vitest run tests/int/customer-addresses.int.spec.ts
npx playwright install chromium
npm run test:e2e -- tests/e2e/customer-auth.e2e.spec.ts --reporter=line
```

El E2E crea dos clientes y un administrador temporales en la base de desarrollo y los elimina junto con sus direcciones al terminar. El comando npm incluye el loader TS necesario para importar la configuración de Payload. Usar una base de pruebas/desarrollo, nunca producción.

Antes del despliegue: configurar los secretos y la URL HTTPS real, ejecutar la migración de Better Auth y preparar/aplicar las migraciones de Payload para la base de destino. La sincronización automática de desarrollo no reemplaza las migraciones de producción.

Referencias: [instalación de Better Auth](https://better-auth.com/docs/installation), [integración con Next.js](https://better-auth.com/docs/integrations/next).
