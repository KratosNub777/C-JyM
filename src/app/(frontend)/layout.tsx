import { Clock, MagnifyingGlass, Tag } from '@phosphor-icons/react/dist/ssr'
import { GeistSans } from 'geist/font/sans'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { HeaderNav } from '@/components/HeaderNav'
import { getPayloadClient } from '@/lib/payload'
import './styles.css'

export const metadata = {
  description: 'Catálogo de electrodomésticos para tu hogar.',
  title: 'Comercial José María — Catálogo',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const payload = await getPayloadClient()
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 50,
    sort: 'name',
    depth: 0,
  })

  const topLevelCategories = categories
    .filter((category) => !category.parent)
    .map((category) => ({ id: category.id, name: category.name, slug: category.slug }))

  const childrenByParent = categories.reduce<Record<number, { id: number; name: string; slug: string }[]>>(
    (map, category) => {
      const parentId = typeof category.parent === 'number' ? category.parent : null
      if (!parentId) return map
      map[parentId] = map[parentId] ?? []
      map[parentId].push({ id: category.id, name: category.name, slug: category.slug })
      return map
    },
    {},
  )

  return (
    <html lang="es" className={GeistSans.className}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="hidden bg-brand-600 text-white sm:block">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-xs sm:px-6">
              <Clock size={14} weight="bold" />
              <span>Lun a Vie 7:30 a 18:30 h · Sáb 7:30 a 16:00 h</span>
            </div>
          </div>

          <div className="relative mx-auto flex h-24 max-w-7xl items-center px-4 sm:px-6">
            <Link href="/" className="shrink-0">
              <Image
                src="/logo.png"
                alt="Comercial José María"
                width={280}
                height={140}
                priority
                className="h-20 w-auto"
              />
            </Link>

            <form
              action="/buscar"
              method="get"
              className="mx-4 hidden max-w-md flex-1 sm:flex"
            >
              <div className="relative w-full">
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar productos..."
                  className="w-full rounded-full border border-neutral-300 bg-white py-2 pl-4 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  aria-label="Buscar"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                </button>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-8">
              <HeaderNav topLevelCategories={topLevelCategories} childrenByParent={childrenByParent} />

              <Link
                href="/ofertas"
                className="hidden items-center gap-1.5 rounded-full bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 md:flex"
              >
                <Tag size={16} weight="fill" />
                Ofertas
              </Link>

              <Link
                href="/productos"
                className="hidden text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900 md:block dark:text-neutral-300 dark:hover:text-white"
              >
                Productos
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
        <footer className="mt-16 border-t border-neutral-200 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          © {new Date().getFullYear()} Comercial José María. Catálogo de productos.
        </footer>
      </body>
    </html>
  )
}
