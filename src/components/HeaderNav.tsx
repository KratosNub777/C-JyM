'use client'

import { CaretDown, List, X } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type CategoryLink = {
  id: number
  name: string
  slug: string
}

export function HeaderNav({ categories }: { categories: CategoryLink[] }) {
  const topCategories = categories.slice(0, 5)

  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const desktopMenuRef = useRef<HTMLDivElement>(null)

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

  return (
    <>
      <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-700 md:flex dark:text-neutral-300">
        {topCategories.map((category) => (
          <Link
            key={category.id}
            href={`/categorias/${category.slug}`}
            className="transition-colors hover:text-neutral-900 dark:hover:text-white"
          >
            {category.name}
          </Link>
        ))}

        <div className="relative" ref={desktopMenuRef}>
          <button
            type="button"
            onClick={() => setDesktopOpen((value) => !value)}
            className="flex items-center gap-1 transition-colors hover:text-neutral-900 dark:hover:text-white"
            aria-expanded={desktopOpen}
          >
            Categorías
            <CaretDown size={14} weight="bold" className={desktopOpen ? 'rotate-180' : ''} />
          </button>

          {desktopOpen && (
            <div className="absolute left-1/2 top-full z-50 mt-3 w-[420px] -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categorias/${category.slug}`}
                    onClick={() => setDesktopOpen(false)}
                    className="rounded-md px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => setMobileOpen((value) => !value)}
        className="text-neutral-700 md:hidden dark:text-neutral-300"
        aria-expanded={mobileOpen}
        aria-label="Abrir menú de categorías"
      >
        {mobileOpen ? <X size={24} /> : <List size={24} />}
      </button>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-neutral-200 bg-white px-4 py-4 shadow-lg md:hidden dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categorias/${category.slug}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
