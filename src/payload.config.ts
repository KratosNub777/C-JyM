import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { s3Storage } from '@payloadcms/storage-s3'
import { r2ConfigFromEnv, r2PublicFileUrl } from './lib/storage/r2'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Addresses } from './collections/Addresses'
import { Orders } from './collections/Orders'

// Imágenes en Cloudflare R2 cuando hay R2_BUCKET; sin él, disco local (desarrollo). En Vercel el
// disco es efímero y de solo lectura, así que producción necesita R2.
const r2 = r2ConfigFromEnv()
if (!r2 && process.env.NODE_ENV === 'production')
  console.warn(
    'R2_BUCKET no está configurado: las imágenes subidas desde /admin no se conservarán.',
  )

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Products, Addresses, Orders],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Better Auth owns these tables. Never include them in Payload schema pushes.
    tablesFilter: ['!user', '!session', '!account', '!verification', '!rate_limit'],
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      enabled: Boolean(r2),
      // Con el plugin apagado el esquema debe ser el mismo: así desarrollo y producción comparten migraciones.
      alwaysInsertFields: true,
      bucket: r2?.bucket ?? '',
      collections: {
        media: {
          // Las fotos son públicas: el navegador las pide directo al bucket y no pasan por la app.
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            r2 ? r2PublicFileUrl(r2.publicUrl, filename, prefix) : filename,
        },
      },
      config: {
        endpoint: r2?.endpoint,
        region: 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: r2?.accessKeyId ?? '',
          secretAccessKey: r2?.secretAccessKey ?? '',
        },
      },
    }),
  ],
})
