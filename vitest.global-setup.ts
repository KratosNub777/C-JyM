import 'dotenv/config'

// En desarrollo Payload sincroniza el esquema de la base al iniciarse. Si varios archivos de test lo
// hacen a la vez tras un cambio de columnas, todos intentan el mismo ALTER TABLE: uno gana y el resto
// falla con "column ... already exists" (42701). Iniciar Payload una vez acá, antes de los workers,
// deja el esquema al día y los tests en paralelo ya no compiten.
export default async function setup() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('./src/payload.config')
  const payload = await getPayload({ config, key: 'vitest-global-setup' })
  await payload.destroy()
}
