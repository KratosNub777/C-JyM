import { GeistSans } from 'geist/font/sans'
import Link from 'next/link'
import React from 'react'

import './styles.css'

export const metadata = {
  description: 'Catálogo de productos',
  title: 'C-JyM — Catálogo',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es" className={GeistSans.className}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              C-JyM
            </Link>
            <nav className="flex gap-6 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <Link
                href="/productos"
                className="transition-colors hover:text-neutral-900 dark:hover:text-white"
              >
                Productos
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
        <footer className="mt-16 border-t border-neutral-200 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          © {new Date().getFullYear()} C-JyM. Catálogo de productos.
        </footer>
      </body>
    </html>
  )
}
