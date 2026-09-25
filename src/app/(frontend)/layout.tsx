import { Clock, MagnifyingGlass, Tag } from '@phosphor-icons/react/dist/ssr'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { HeaderNav } from '@/components/HeaderNav'
import { buildCategoryTree } from '@/lib/categories'
import { getPayloadClient } from '@/lib/payload'
import { getSiteUrl } from '@/lib/site'
import './styles.css'

const siteDescription = 'Catálogo de electrodomésticos para tu hogar.'

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Comercial José María — Catálogo',
    template: '%s — Comercial José María',
  },
  description: siteDescription,
  openGraph: {
    type: 'website',
    siteName: 'Comercial José María',
    locale: 'es_PY',
    title: 'Comercial José María — Catálogo',
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const payload = await getPayloadClient()
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 500,
    sort: 'name',
    depth: 0,
  })

  const { topLevel, childrenByParent: childrenByParentDocs } = buildCategoryTree(categories)

  const topLevelCategories = topLevel.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }))

  const childrenByParent: Record<number, { id: number; name: string; slug: string }[]> = {}
  for (const [parentId, children] of Object.entries(childrenByParentDocs)) {
    childrenByParent[Number(parentId)] = children.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }))
  }

  return (
    <html lang="es" className={GeistSans.className}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="hidden bg-brand-700 text-white sm:block">
            <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-xs sm:px-6">
              <Clock size={14} weight="bold" />
              <span>Lun a Vie 7:30 a 18:30 h · Sáb 7:30 a 16:00 h</span>
            </div>
          </div>

          <div className="mx-auto flex h-24 max-w-7xl items-center gap-6 px-4 sm:px-6">
            <Link href="/" className="shrink-0">
              <Image
                src="/logo.png"
                alt="Comercial José María"
                width={280}
                height={140}
                priority
                className="h-20 w-auto dark:hidden"
              />
              <Image
                src="/logo-dark.png"
                alt="Comercial José María"
                width={280}
                height={140}
                priority
                className="hidden h-20 w-auto dark:block"
              />
            </Link>

            <form action="/buscar" method="get" className="hidden flex-1 sm:flex">
              <div className="flex w-full max-w-2xl overflow-hidden rounded-full border border-neutral-300 focus-within:border-brand-600 dark:border-neutral-700">
                <input
                  type="search"
                  name="q"
                  placeholder="Estoy buscando..."
                  className="w-full bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  <MagnifyingGlass size={16} weight="bold" />
                  Buscar
                </button>
              </div>
            </form>
          </div>

          <div className="relative bg-brand-600">
            <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 sm:px-6">
              <HeaderNav topLevelCategories={topLevelCategories} childrenByParent={childrenByParent} />

              <Link
                href="/productos"
                className="hidden text-sm font-medium text-white/90 transition-colors hover:text-white md:block"
              >
                Productos
              </Link>

              <Link
                href="/ofertas"
                className="ml-auto flex items-center gap-1.5 rounded-full bg-brand-green-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700"
              >
                <Tag size={16} weight="fill" />
                Ofertas
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
