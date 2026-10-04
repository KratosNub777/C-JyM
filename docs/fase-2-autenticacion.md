# Fase 2: cuentas de clientes

Better Auth maneja clientes con email y contraseña. Payload mantiene el acceso del equipo interno a `/admin` y `/catalogar`; son identidades y cookies independientes.

## Desarrollo

1. `npm install`.
2. Configurar `DATABASE_URL`, `PAYLOAD_SECRET`, `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` en `.env`. El secreto de Better Auth debe ser aleatorio, de al menos 32 caracteres, diferente del de Payload. La URL local es `http://localhost:3000`. Better Auth solo acepta iniciar sesión desde `BETTER_AUTH_URL`; para otros orígenes de producción (p. ej. la variante con o sin `www`) listar las URLs exactas, sin comodines, en `BETTER_AUTH_TRUSTED_ORIGINS` separadas por coma. Las URLs de deploy y de rama de los previews de Vercel se confían solas.
3. `npm run auth:migrate` crea o actualiza las tablas de Better Auth usando la versión instalada. Se puede repetir; no borra usuarios. `npm run auth:generate` genera el SQL pendiente para revisión en `migrations/customer-auth/schema.sql`.
4. Opcional: configurar `SMTP_*` para que los códigos salgan por email real (ver `.env.example`) y probarlo con `npm run email:test -- destino@correo.com`, que verifica la conexión y las credenciales, manda un correo de prueba y explica el error si falla (contraseña de aplicación de Gmail, host, puerto, remitente). Sin SMTP, en desarrollo el email con el código se imprime en la consola del servidor.
5. `npm run dev`. Payload sincroniza su esquema de desarrollo, incluida la colección `addresses`.
6. Abrir `/registrarse`, `/ingresar`, `/cuenta` o `/cuenta/direcciones`.

Las tablas `user`, `session`, `account`, `verification` y `rate_limit` son propiedad de Better Auth y están excluidas del `tablesFilter` de Payload. Mantener esta exclusión al agregar migraciones. `jose` 6 está declarado explícitamente porque el proyecto instala con `legacy-peer-deps` y Better Auth lo requiere; Payload conserva su propia versión 5.

## HTTPS

Vercel redirige HTTP a HTTPS por sí solo; la app no repite ese redirect. Lo que sí exige:

- En producción `BETTER_AUTH_URL` es obligatoria y con `https://` (solo se acepta `http://` hacia `localhost`). Si falta o es insegura, la app no arranca y el mensaje dice cuál es el problema. De ella depende que la cookie de sesión de clientes salga con `Secure` y el prefijo `__Secure-`.
- `BETTER_AUTH_TRUSTED_ORIGINS` y los orígenes de los previews solo admiten `https://` (o `http://` hacia localhost).
- `SITE_URL` insegura en producción genera una advertencia en el log, porque el sitemap y los metadatos publicarían enlaces http.
- Todas las respuestas llevan `Strict-Transport-Security: max-age=31536000` en producción (`src/lib/security/headers.ts`). No incluye `includeSubDomains` ni `preload`: se pueden sumar cuando se confirme que todo el dominio `.com.py` usa HTTPS, porque `preload` es difícil de revertir.
- La cookie de sesión del panel de Payload lleva `Secure`, `HttpOnly` y `SameSite=Lax` en producción.

## Comportamiento y límites

- El registro pide la contraseña dos veces y **no inicia sesión hasta verificar el email** con un código de 6 dígitos enviado por correo. El código vence a los 5 minutos, admite 5 intentos y se guarda cifrado con `BETTER_AUTH_SECRET`; se puede pedir que lo reenvíe (60 s entre reenvíos y 3 pedidos por minuto por IP). Mientras siga vigente, el reenvío manda **el mismo código** y le renueva los 5 minutos (`resendStrategy: 'reuse'`), así nadie puede anular el código de otra persona pidiendo uno nuevo a su nombre; los intentos fallidos se conservan. Al verificarlo se inicia sesión. Contraseñas de 8 a 128 caracteres. Sin login social ni roles comerciales en esta fase.
- El registro es abierto: cualquiera puede crear una cuenta con su propio email, sin que nadie se lo asigne antes. El código solo demuestra que el email es suyo. Si alguien registra el email de otra persona y no puede verificarlo, la cuenta queda sin verificar y **el siguiente registro con ese email la reemplaza** (Better Auth no lo hace solo); así el dueño real no hereda la contraseña de quien se registró primero. Las cuentas verificadas nunca se reemplazan.
- Ingresar con la contraseña correcta pero el email sin verificar envía un código nuevo y lleva a `/verificar-email`. Registrarse con un email que ya existe responde igual que con uno nuevo, así que no revela qué emails tienen cuenta.
- Recuperar la contraseña: `/olvide-contrasena` envía un código (siempre con la misma respuesta, exista o no la cuenta) y `/restablecer-contrasena` pide el código y la contraseña nueva dos veces. Al cambiarla se cierran las demás sesiones de la cuenta. Las pantallas guardan el email en `sessionStorage`, no en la URL.
- El registro no envía el código por sí mismo: Better Auth lo despacharía en segundo plano cuando la transacción del alta ya cerró y falla. El formulario lo pide con una llamada aparte apenas termina el registro (`sendOnSignUp: false`).
- Los emails salen por SMTP (`src/lib/email/mailer.ts`) después de responder al cliente, para que el tiempo de respuesta no delate si una cuenta existe.
- **Tope por destinatario:** además del límite por IP, cada dirección recibe como máximo 5 emails con código por hora (`src/lib/customerAuth/codeQuota.ts`), sumando verificación, ingreso sin verificar y recuperación. Pasado el tope no se envía y la respuesta es la misma (no revela si la cuenta existe). El contador vive en la tabla `verification` de Better Auth (identificador `email-code-quota:` + hash del email, vence con la ventana y Better Auth lo borra solo), así que no hace falta ninguna migración. Si el conteo falla, el email se envía igual y queda en el log. El código no se pide en cada inicio de sesión, solo para verificar la cuenta y recuperar la contraseña.
- **Limpieza de cuentas sin verificar:** `GET/POST /api/cron/cleanup-accounts` (Vercel Cron diario a las `30 9 * * *` UTC, mismo `Bearer CRON_SECRET` que el vencimiento de reservas) borra las cuentas sin verificar con más de 7 días, junto con sus credenciales; nunca toca cuentas verificadas ni con pedidos o direcciones (`src/lib/customerAuth/cleanup.ts`). Responde solo la cantidad borrada.
- El perfil muestra nombre y email. No incluye cambios de email o contraseña.
- Cada acción de direcciones valida la sesión y deriva `customerId` del servidor. Las consultas y mutaciones filtran por propietario; un ID ajeno no permite leer, modificar ni eliminar otra dirección.
- Cambiar la predeterminada utiliza una transacción y un bloqueo por cliente para serializar escrituras concurrentes. Eliminar o desmarcar la predeterminada puede dejar al cliente sin predeterminada. Las operaciones manuales del equipo desde Payload no aplican esta normalización automática.
- REST y GraphQL de direcciones requieren una sesión interna de Payload. Una sesión de cliente no concede acceso al CMS.
- El menú consulta la sesión en el navegador, conservando ISR en el catálogo. Las páginas privadas consultan en servidor. No se utiliza un proxy basado en presencia de cookies.
- Better Auth guarda el rate limit en Postgres, compartido entre instancias. La consulta de sesión (`/get-session`, una por página vista) está exenta para no escribir en la base en cada visita; inicio de sesión, registro y demás endpoints conservan su límite. Las operaciones del cliente usan sus protecciones de origen; las Server Actions usan las de Next.js y además un límite por cliente (`src/lib/customerAuth/actionLimit.ts`): 20 operaciones de direcciones y 10 de checkout (crear o cancelar pedidos) por minuto, guardado en la tabla `verification` igual que el tope de códigos. Pasado el límite responden "Hiciste muchos intentos seguidos" sin tocar la base; si el conteo falla, dejan pasar y lo registran.
- Cada cliente puede guardar hasta 20 direcciones (`MAX_ADDRESSES`). El límite se verifica dentro de la transacción y del bloqueo por cliente, y la pantalla deshabilita el botón al alcanzarlo. Editar y eliminar siguen funcionando en el límite.
- El formulario distingue datos rechazados (400/401/422), límite de intentos (429), origen no permitido (403) y fallos del servidor, para no mostrar "contraseña incorrecta" ante un error que no lo es.
- En producción el pool de conexiones de Better Auth es de 3 (5 en desarrollo). Usar el endpoint con pooler de Neon en `DATABASE_URL` para que las instancias serverless no agoten las conexiones.

## Verificación

```sh
npx tsc --noEmit
npm run lint
npx vitest run tests/int/customer-addresses.int.spec.ts
npx playwright install chromium
npm run test:e2e -- tests/e2e/customer-auth.e2e.spec.ts --reporter=line
```

Los E2E leen los códigos con `auth.api.getVerificationOTP` (API de servidor, ver `tests/helpers/customerAuth.ts`). El E2E crea varios clientes y un administrador temporales en la base de desarrollo y los elimina junto con sus direcciones al terminar. El comando npm incluye el loader TS necesario para importar la configuración de Payload. Usar una base de pruebas/desarrollo, nunca producción.

Antes del despliegue: configurar los secretos y la URL HTTPS real, correr `npm run db:setup` contra la base de destino (migraciones de Payload y de Better Auth). La sincronización automática de desarrollo no reemplaza las migraciones de producción. Pasos completos en [despliegue](despliegue.md).

Referencias: [instalación de Better Auth](https://better-auth.com/docs/installation), [integración con Next.js](https://better-auth.com/docs/integrations/next).
