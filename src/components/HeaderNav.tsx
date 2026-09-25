'use client'

import {
  Broom,
  CaretDown,
  CaretRight,
  CookingPot,
  Fan,
  GridFour,
  List,
  MagnifyingGlass,
  Snowflake,
  Television,
  X,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type CategoryLink = {
  id: number
  name: string
  slug: string
}

const ICONS_BY_SLUG: Record<string, typeof Snowflake> = {
  'linea-blanca': Snowflake,
  cocina: CookingPot,
  'climatizacion-grupo': Fan,
  'audio-tv': Television,
  'cuidado-del-hogar': Broom,
}

export function HeaderNav({
  topLevelCategories,
  childrenByParent,
}: {
  topLevelCategories: CategoryLink[]
  childrenByParent: Record<number, CategoryLink[]>
}) {
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [activeId, setActiveId] = useState(topLevelCategories[0]?.id)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedMobileId, setExpandedMobileId] = useState<number | null>(null)
  const desktopMenuRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openDesktopMenu() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    setDesktopOpen(true)
  }

  function scheduleCloseDesktopMenu() {
    closeTimeoutRef.current = setTimeout(() => setDesktopOpen(false), 150)
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!desktopOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target as Node)) {
        setDesktopOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [desktopOpen])

  const activeChildren = activeId ? (childrenByParent[activeId] ?? []) : []

  return (
    <>
      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        <div
          className="relative"
          ref={desktopMenuRef}
          onMouseEnter={openDesktopMenu}
          onMouseLeave={scheduleCloseDesktopMenu}
        >
          <button
            type="button"
            onClick={() => setDesktopOpen((value) => !value)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-white transition-colors ${
              desktopOpen ? 'bg-white/10' : 'hover:bg-white/10'
            }`}
            aria-expanded={desktopOpen}
          >
            <GridFour size={16} weight="bold" />
            Categorías
            <CaretDown size={14} weight="bold" className={desktopOpen ? 'rotate-180' : ''} />
          </button>

          {desktopOpen && (
            <div className="absolute left-0 top-full z-50 mt-3 flex w-[560px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <div className="w-56 shrink-0 border-r border-neutral-200 bg-neutral-50 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                {topLevelCategories.map((category) => {
                  const Icon = ICONS_BY_SLUG[category.slug]
                  const isActive = category.id === activeId
                  return (
                    <Link
                      key={category.id}
                      href={`/categorias/${category.slug}`}
                      onMouseEnter={() => setActiveId(category.id)}
                      onClick={() => setDesktopOpen(false)}
                      className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-white text-brand-600 dark:bg-neutral-900 dark:text-brand-400'
                          : 'text-neutral-700 hover:bg-white/60 dark:text-neutral-300 dark:hover:bg-neutral-900/60'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {Icon && <Icon size={18} weight={isActive ? 'fill' : 'regular'} />}
                        {category.name}
                      </span>
                      <CaretRight size={12} weight="bold" className="opacity-50" />
                    </Link>
                  )
                })}
              </div>

              <div className="flex-1 p-4">
                {activeChildren.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {activeChildren.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categorias/${child.slug}`}
                        onClick={() => setDesktopOpen(false)}
                        className="rounded-md px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">
                    Sin subcategorías todavía.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => setMobileOpen((value) => !value)}
        className="py-2 text-white md:hidden"
        aria-expanded={mobileOpen}
        aria-label="Abrir menú de categorías"
      >
        {mobileOpen ? <X size={24} /> : <List size={24} />}
      </button>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[70vh] overflow-y-auto border-b border-neutral-200 bg-white px-4 py-4 shadow-lg md:hidden dark:border-neutral-800 dark:bg-neutral-900">
          <form action="/buscar" method="get" className="mb-4 sm:hidden">
            <div className="relative w-full">
              <input
                type="search"
                name="q"
                placeholder="Buscar productos..."
                className="w-full rounded-full border border-neutral-300 bg-white py-2 pl-4 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 dark:text-neutral-400"
                aria-label="Buscar"
              >
                <MagnifyingGlass size={18} weight="bold" />
              </button>
            </div>
          </form>
          <div className="flex flex-col gap-1">
            {topLevelCategories.map((category) => {
              const Icon = ICONS_BY_SLUG[category.slug]
              const isExpanded = expandedMobileId === category.id
              const children = childrenByParent[category.id] ?? []
              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/categorias/${category.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex flex-1 items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      {Icon && <Icon size={18} />}
                      {category.name}
                    </Link>
                    {children.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedMobileId(isExpanded ? null : category.id)}
                        className="p-2 text-neutral-500 dark:text-neutral-400"
                        aria-label={`Ver subcategorías de ${category.name}`}
                        aria-expanded={isExpanded}
                      >
                        <CaretDown size={14} weight="bold" className={isExpanded ? 'rotate-180' : ''} />
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="ml-6 flex flex-col gap-1 border-l border-neutral-200 pl-3 dark:border-neutral-800">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/categorias/${child.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="rounded-md px-2 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
