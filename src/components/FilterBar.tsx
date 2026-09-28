'use client'

import { Check, CaretDown, Tag, X } from '@phosphor-icons/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'

import { formatGs } from '@/lib/format'
import {
  hasActiveFilters,
  parseProductFilters,
  SORT_OPTIONS,
  type SortOption,
} from '@/lib/productFilters'
import { useClickOutside } from '@/lib/useClickOutside'

const CONTROL =
  'flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 transition-colors hover:border-neutral-400 focus-within:border-brand-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
const LABEL =
  'mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400'
const PANEL =
  'absolute left-0 top-full z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900'

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (value: SortOption) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const current = SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0]

  return (
    <div className="relative" ref={ref}>
      <span className={LABEL}>Ordenar por</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${CONTROL} w-full justify-between sm:w-56`}
      >
        <span>{current.label}</span>
        <CaretDown
          size={14}
          weight="bold"
          className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className={PANEL}>
          {SORT_OPTIONS.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={
                  active
                    ? 'flex w-full items-center justify-between px-3.5 py-2 text-left text-sm font-medium text-brand-600 dark:text-brand-400'
                    : 'flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }
              >
                {option.label}
                {active && <Check size={14} weight="bold" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BrandCombobox({
  brands,
  active,
  onToggle,
}: {
  brands: string[]
  active: string[]
  onToggle: (brand: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const filtered = brands.filter((brand) => brand.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative" ref={ref}>
      <span className={LABEL}>Marca</span>
      <div
        className={`${CONTROL} w-full flex-wrap px-2 py-1.5 sm:w-64`}
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
      >
        {active.map((brand) => (
          <span
            key={brand}
            className="flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white"
          >
            {brand}
            <button
              type="button"
              aria-label={`Quitar filtro ${brand}`}
              onClick={(event) => {
                event.stopPropagation()
                onToggle(brand)
              }}
            >
              <X size={10} weight="bold" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={active.length === 0 ? 'Buscar marca...' : ''}
          className="min-w-[80px] flex-1 border-none bg-transparent py-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
        />
      </div>

      {open && (
        <div className={PANEL}>
          {filtered.length === 0 ? (
            <p className="px-3.5 py-2 text-sm text-neutral-400 dark:text-neutral-500">
              Sin resultados
            </p>
          ) : (
            filtered.map((brand) => {
              const isActive = active.includes(brand)
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => onToggle(brand)}
                  className={
                    isActive
                      ? 'flex w-full items-center justify-between px-3.5 py-2 text-left text-sm font-medium text-brand-600 dark:text-brand-400'
                      : 'flex w-full items-center justify-between px-3.5 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }
                >
                  {brand}
                  {isActive && <Check size={14} weight="bold" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export function FilterBar({
  brands,
  priceBounds,
  basePath,
  onSaleCount,
}: {
  brands: string[]
  priceBounds: { min: number; max: number } | null
  basePath: string
  onSaleCount?: number
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
  const activeBrands = searchParams.getAll('brand')

  const [minInput, setMinInput] = useState(searchParams.get('min') ?? '')
  const [maxInput, setMaxInput] = useState(searchParams.get('max') ?? '')

  function navigate(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)
    params.delete('page')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function handleSortChange(value: SortOption) {
    navigate((params) => {
      if (value === 'newest') params.delete('sort')
      else params.set('sort', value)
    })
  }

  function toggleBrand(brand: string) {
    navigate((params) => {
      const current = params.getAll('brand')
      params.delete('brand')
      const next = activeBrands.includes(brand)
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

  function toggleOnSale() {
    navigate((params) => {
      if (filters.onSale) params.delete('sale')
      else params.set('sale', '1')
    })
  }

  function clearFilters() {
    const q = searchParams.get('q')
    router.push(q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath)
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-end gap-4">
        <SortDropdown value={filters.sort} onChange={handleSortChange} />

        {brands.length > 0 && (
          <BrandCombobox brands={brands} active={activeBrands} onToggle={toggleBrand} />
        )}

        {priceBounds && (
          <div>
            <span className={LABEL}>Precio</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={formatGs(priceBounds.min)}
                value={minInput}
                onChange={(event) => setMinInput(event.target.value)}
                className={`${CONTROL} w-24 sm:w-28`}
              />
              <span className="text-neutral-400">—</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={formatGs(priceBounds.max)}
                value={maxInput}
                onChange={(event) => setMaxInput(event.target.value)}
                className={`${CONTROL} w-24 sm:w-28`}
              />
              <button
                type="button"
                onClick={applyPriceRange}
                className="h-10 shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}

        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-10 items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <X size={14} weight="bold" />
            Limpiar filtros
          </button>
        )}

        {!!onSaleCount && onSaleCount > 0 && (
          <button
            type="button"
            onClick={toggleOnSale}
            className={
              filters.onSale
                ? 'ml-auto flex h-10 items-center gap-2 rounded-xl border border-accent-oferta-600 bg-accent-oferta-600 px-4 text-sm font-semibold text-white transition-colors'
                : 'ml-auto flex h-10 items-center gap-2 rounded-xl border border-accent-oferta-600/40 bg-accent-oferta-50 px-4 text-sm font-semibold text-accent-oferta-600 transition-colors hover:bg-accent-oferta-100 dark:border-accent-oferta-600/50 dark:bg-accent-oferta-600/10 dark:text-accent-oferta-100 dark:hover:bg-accent-oferta-600/20'
            }
          >
            <Tag size={16} weight="fill" />
            {onSaleCount} {onSaleCount === 1 ? 'producto en oferta' : 'productos en oferta'}
          </button>
        )}
      </div>
    </div>
  )
}
