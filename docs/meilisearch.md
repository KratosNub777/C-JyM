# Meilisearch en producción

Meilisearch alimenta únicamente `/buscar`. Filtros, categorías, ofertas y fichas leen de Postgres, así que el resto del catálogo no depende de este servicio.

Si Meilisearch no responde, `/buscar` registra el error y busca directo en Postgres: cada palabra debe aparecer en el nombre, la marca o el SKU de un producto activo (`src/lib/searchFallback.ts`). Es una búsqueda más simple, sin tolerancia a errores de tipeo ni ranking, pensada para no mostrar "sin resultados" durante una caída.

## Servicio en Railway

Payload corre dentro de Next.js (Vercel); Railway solo aloja Meilisearch.

1. Crear un servicio desde la imagen Docker `getmeili/meilisearch:v1.12` (la misma versión del `docker-compose.yml`).
2. Variables del servicio:
   - `MEILI_MASTER_KEY`: valor aleatorio y largo. Es la clave maestra; no se carga en Vercel.
   - `MEILI_ENV=production`. Sin esto Meilisearch no exige clave.
   - `MEILI_NO_ANALYTICS=true`.
3. Agregar un volumen montado en `/meili_data`.
4. Generar un dominio público HTTPS para el puerto 7700. Vercel no alcanza la red privada de Railway, por eso la URL es pública y todo acceso queda protegido por las claves.
5. Elegir la región más cercana a São Paulo (las funciones de Vercel corren en `gru1` y el cliente corta a los 5 segundos).
6. Comprobar `GET https://<dominio>/health`, que debe responder `{"status":"available"}`.

El índice se reconstruye por completo desde Postgres, así que perder el volumen no pierde datos: solo hay que volver a sincronizar.

## Claves

| Clave | Dónde vive | Para qué |
| --- | --- | --- |
| Maestra (`MEILI_MASTER_KEY`) | Railway y la terminal del desarrollador (`MEILISEARCH_MASTER_KEY`) | Configurar el índice, sincronizar y crear la clave de la app |
| Clave de la app | Vercel (`MEILISEARCH_API_KEY`) | Buscar y agregar o borrar documentos del índice `products` |

La clave de la app no puede cambiar la configuración del índice, borrar índices ni crear otras claves. Se crea con la maestra:

```sh
MEILISEARCH_HOST=https://<dominio> MEILISEARCH_MASTER_KEY=<maestra> npm run meilisearch:key
```

Cada ejecución crea una clave nueva. Guardar el resultado como `MEILISEARCH_API_KEY` en Vercel junto con `MEILISEARCH_HOST`. Para rotarla: crear una nueva, actualizar Vercel, redeployar y eliminar la anterior desde la API de claves de Meilisearch.

## Carga inicial y mantenimiento

`npm run meilisearch:sync` configura los atributos del índice, sube todos los productos activos y elimina del índice los documentos sin producto activo. Se puede repetir sin riesgo. Ejecutarlo:

- una vez al crear el servicio (con `DATABASE_URL` y las variables de Meilisearch de producción);
- después de una importación masiva de productos;
- después de cualquier caída de Meilisearch: los hooks de `Products` solo registran el error, así que el índice puede quedar desactualizado.

En desarrollo, `docker compose up -d meilisearch` levanta la instancia local; ahí `MEILISEARCH_API_KEY` es la clave maestra del compose y no hace falta `MEILISEARCH_MASTER_KEY`.
