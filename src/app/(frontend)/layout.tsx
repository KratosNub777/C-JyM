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
    <html lang="es">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold">
              C-JyM
            </Link>
            <nav className="flex gap-6 text-sm font-medium text-neutral-700">
              <Link href="/productos" className="hover:text-neutral-900">
                Productos
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-neutral-200 py-8 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} C-JyM. Catálogo de productos.
        </footer>
      </body>
    </html>
  )
}
