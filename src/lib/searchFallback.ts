import type { Where } from 'payload'

const MAX_TERMS = 5
const MAX_TERM_LENGTH = 50

// Búsqueda de respaldo en Postgres para cuando Meilisearch no responde: cada palabra debe
// aparecer en nombre, marca o SKU (sin distinguir mayúsculas). No tolera errores de tipeo
// ni rankea como Meilisearch, pero evita mostrar "sin resultados" por una caída del índice.
export function fallbackSearchWhere(query: string): Where {
  const terms = query
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_TERMS)
    .map((term) => term.slice(0, MAX_TERM_LENGTH))

  const termClauses = terms.map((term): Where => {
    const fields: Where[] = [
      { name: { contains: term } },
      { brand: { contains: term } },
      { sku: { contains: term } },
    ]
    return { or: fields }
  })

  return { and: [{ status: { equals: 'active' } }, ...termClauses] }
}
