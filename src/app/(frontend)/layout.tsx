import { Clock } from '@phosphor-icons/react/dist/ssr'
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
  })

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

          <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="shrink-0">
              <Image
                src="/logo.png"
                alt="Comercial José María"
                width={220}
                height={110}
                priority
                className="h-14 w-auto"
              />
            </Link>

            <HeaderNav
              categories={categories.map((category) => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
              }))}
            />

            <Link
              href="/productos"
              className="hidden text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900 md:block dark:text-neutral-300 dark:hover:text-white"
            >
              Productos
            </Link>
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
