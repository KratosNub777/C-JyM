'use client'

import { X } from '@phosphor-icons/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { formatGs } from '@/lib/format'
import { hasActiveFilters, parseProductFilters, SORT_OPTIONS } from '@/lib/productFilters'

export function FilterBar({
  brands,
  priceBounds,
  basePath,
}: {
  brands: string[]
  priceBounds: { min: number; max: number } | null
  basePath: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const rawParams: Record<string, string | string[]> = {}
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key)
    rawParams[key] = values.length > 1 ? values : values[0]
  }
  const filters = parseProductFilters(rawParams)
  const activeBrands = new Set(searchParams.getAll('brand'))

  const [minInput, setMinInput] = useState(searchParams.get('min') ?? '')
  const [maxInput, setMaxInput] = useState(searchParams.get('max') ?? '')

  function navigate(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)
    params.delete('page')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function handleSortChange(value: string) {
    navigate((params) => {
      if (value === 'newest') params.delete('sort')
      else params.set('sort', value)
    })
  }

  function toggleBrand(brand: string) {
    navigate((params) => {
      const current = params.getAll('brand')
      params.delete('brand')
      const next = activeBrands.has(brand)
        ? current.filter((value) => value !== brand)
        : [...current, brand]
      next.forEach((value) => params.append('brand', value))
    })
  }

  function applyPriceRange() {
    navigate((params) => {
      if (minInput) params.set('min', minInput)
      else params.delete('min')
      if (maxInput) params.set('max', maxInput)
      else params.delete('max')
    })
  }

  function clearFilters() {
    const q = searchParams.get('q')
    router.push(q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath)
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">Ordenar por</span>
          <select
            value={filters.sort}
            onChange={(event) => handleSortChange(event.target.value)}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {priceBounds && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Precio</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={formatGs(priceBounds.min)}
              value={minInput}
              onChange={(event) => setMinInput(event.target.value)}
              className="w-24 min-w-0 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-600 focus:outline-none sm:w-28 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <span className="text-neutral-400">—</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={formatGs(priceBounds.max)}
              value={maxInput}
              onChange={(event) => setMaxInput(event.target.value)}
              className="w-24 min-w-0 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-600 focus:outline-none sm:w-28 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <button
              type="button"
              onClick={applyPriceRange}
              className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Aplicar
            </button>
          </div>
        )}

        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <X size={14} weight="bold" />
            Limpiar filtros
          </button>
        )}
      </div>

      {brands.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Marca</span>
          {brands.map((brand) => {
            const active = activeBrands.has(brand)
            return (
              <button
                key={brand}
                type="button"
                onClick={() => toggleBrand(brand)}
                className={
                  active
                    ? 'rounded-full bg-brand-600 px-3 py-1 text-sm font-medium text-white'
                    : 'rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-700 transition-colors hover:border-brand-600 hover:text-brand-600 dark:border-neutral-700 dark:text-neutral-300'
                }
              >
                {brand}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
