import {
  ArrowsClockwise,
  Clock,
  EnvelopeSimple,
  FileText,
  InstagramLogo,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  Tag,
  Truck,
  UsersThree,
  WhatsappLogo,
} from '@phosphor-icons/react/dist/ssr'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { HeaderNav } from '@/components/HeaderNav'
import { UserMenu } from '@/components/UserMenu'
import { CartLink } from '@/components/cart/CartLink'
import { CartFeedback } from '@/components/cart/CartFeedback'
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
          <div className="hidden bg-ink-700 text-white sm:block">
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
                  aria-label="Buscar"
                  className="flex items-center justify-center bg-brand-600 px-5 text-white transition-colors hover:bg-brand-700"
                >
                  <MagnifyingGlass size={16} weight="bold" />
                </button>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1 sm:ml-0">
              <UserMenu />

              <CartLink />
            </div>
          </div>

          <div className="relative bg-ink-600">
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
                className="animate-pulse-glow ml-auto flex items-center gap-1.5 rounded-full bg-accent-oferta-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent-oferta-700"
              >
                <Tag size={16} weight="fill" />
                Ofertas
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
        <CartFeedback />
        <footer className="mt-16 bg-ink-700 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
              <div className="shrink-0">
                <Image
                  src="/logo-dark.png"
                  alt="Comercial José María"
                  width={280}
                  height={140}
                  className="h-12 w-auto"
                />
                <div className="mt-4 flex items-center gap-3">
                  <a
                    href="https://wa.me/595000000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp de Comercial José María"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-600"
                  >
                    <WhatsappLogo size={18} weight="regular" />
                  </a>
                  <a
                    href="https://instagram.com/jmcomercialpy"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram de Comercial José María"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-600"
                  >
                    <InstagramLogo size={18} weight="regular" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 lg:flex-1 lg:px-10">
                <div>
                  <h3 className="text-sm font-semibold text-white">Información</h3>
                  <nav className="mt-4 flex flex-col gap-2.5 text-sm text-white/70">
                    <Link
                      href="/terminos"
                      className="flex items-center gap-2 transition-colors hover:text-white"
                    >
                      <FileText size={16} weight="regular" className="shrink-0 text-white/50" />
                      Términos y condiciones
                    </Link>
                    <Link
                      href="/garantia"
                      className="flex items-center gap-2 transition-colors hover:text-white"
                    >
                      <ArrowsClockwise size={16} weight="regular" className="shrink-0 text-white/50" />
                      Garantía y devoluciones
                    </Link>
                    <Link
                      href="/privacidad"
                      className="flex items-center gap-2 transition-colors hover:text-white"
                    >
                      <ShieldCheck size={16} weight="regular" className="shrink-0 text-white/50" />
                      Políticas de privacidad
                    </Link>
                  </nav>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">Institucional</h3>
                  <nav className="mt-4 flex flex-col gap-2.5 text-sm text-white/70">
                    <Link
                      href="/quienes-somos"
                      className="flex items-center gap-2 transition-colors hover:text-white"
                    >
                      <UsersThree size={16} weight="regular" className="shrink-0 text-white/50" />
                      Nosotros
                    </Link>
                    <Link
                      href="/contacto"
                      className="flex items-center gap-2 transition-colors hover:text-white"
                    >
                      <EnvelopeSimple size={16} weight="regular" className="shrink-0 text-white/50" />
                      Contacto
                    </Link>
                  </nav>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">Horario y ubicación</h3>
                  <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <Clock size={16} weight="regular" className="shrink-0 text-white/50" />
                      Lun a Vie 7:30 a 18:30 h · Sáb 7:30 a 16:00 h
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck size={16} weight="regular" className="shrink-0 text-white/50" />
                      {/* TODO(owner): confirmar política real de entregas */}
                      Entregas próximamente
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={16} weight="regular" className="mt-0.5 shrink-0 text-white/50" />
                      {/* TODO(owner): reemplazar con la dirección real del local */}
                      Dirección próximamente
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-xs text-white/70">
                  <ShieldCheck size={20} weight="regular" className="shrink-0 text-white/50" />
                  {/* TODO(owner): reemplazar por el badge real de la pasarela de pago (Fase 3) */}
                  <span>
                    Compra segura
                    <br />
                    Próximamente pago online
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/70 w-fit">
                <MapPin size={14} weight="regular" className="shrink-0 text-white/50" />
                Dirección próximamente, Paraguay
              </div>
              <p className="text-xs text-white/50">
                © {new Date().getFullYear()} Comercial José María. Catálogo de productos.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
