import Link from 'next/link'

import type { RawSearchParams } from '@/lib/productFilters'

export function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  basePath,
  searchParams,
}: {
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  basePath: string
  searchParams: RawSearchParams
}) {
  if (totalPages <= 1) return null

  function hrefForPage(targetPage: number) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'page' || value === undefined) continue
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
      else params.set(key, value)
    }
    params.set('page', String(targetPage))
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-4 text-sm">
      <Link
        href={hrefForPage(page - 1)}
        aria-disabled={!hasPrevPage}
        className={
          hasPrevPage
            ? 'font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
            : 'pointer-events-none text-neutral-300 dark:text-neutral-700'
        }
      >
        ← Anterior
      </Link>
      <span className="text-neutral-500 dark:text-neutral-400">
        Página {page} de {totalPages}
      </span>
      <Link
        href={hrefForPage(page + 1)}
        aria-disabled={!hasNextPage}
        className={
          hasNextPage
            ? 'font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
            : 'pointer-events-none text-neutral-300 dark:text-neutral-700'
        }
      >
        Siguiente →
      </Link>
    </div>
  )
}
