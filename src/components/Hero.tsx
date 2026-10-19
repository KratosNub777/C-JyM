'use client'

import { ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

type Slide = {
  image: string
  title: string
  text: string
  cta: { href: string; label: string }
  secondary?: { href: string; label: string }
}

// shortcut: slides fijos en código con fotos de ejemplo; pasar a una colección de Payload cuando haya flyers reales.
const SLIDES: Slide[] = [
  {
    image: '/images/hero.jpg',
    title: 'En tu hogar todos los días.',
    text: 'Heladeras, cocinas, lavarropas y más, con la confianza de siempre. Precios claros en guaraníes.',
    cta: { href: '/productos', label: 'Ver catálogo' },
    secondary: { href: '/categorias/heladeras', label: 'Ver heladeras' },
  },
  {
    image: '/images/categorias/climatizacion.jpg',
    title: 'Ambientes frescos todo el verano.',
    text: 'Aires acondicionados y ventiladores para cada espacio de tu casa.',
    cta: { href: '/categorias/climatizacion', label: 'Ver climatización' },
  },
  {
    image: '/images/categorias/television.jpg',
    title: 'Tu mejor pantalla, en cuotas.',
    text: 'Televisores de todos los tamaños con precios claros en guaraníes.',
    cta: { href: '/categorias/television', label: 'Ver televisores' },
  },
]

const arrowClass =
  'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 active:scale-95'

export function Hero() {
  const [current, setCurrent] = useState(0)
  const go = (delta: number) => setCurrent((i) => (i + delta + SLIDES.length) % SLIDES.length)

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="relative h-[420px] overflow-hidden rounded-2xl sm:h-[480px] md:h-[560px]"
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.image}
          aria-hidden={i !== current}
          inert={i !== current}
          className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={i === 0}
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

          <div className="relative flex h-full max-w-lg flex-col justify-center gap-5 px-14 sm:px-16 md:px-20">
            {i === 0 ? (
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {slide.title}
              </h1>
            ) : (
              <h2 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {slide.title}
              </h2>
            )}
            <p className="max-w-md text-base text-white/80">{slide.text}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={slide.cta.href}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition active:scale-[0.98]"
              >
                {slide.cta.label}
                <ArrowRight size={16} weight="bold" />
              </Link>
              {slide.secondary && (
                <Link
                  href={slide.secondary.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
                >
                  {slide.secondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Destacado anterior"
        className={`${arrowClass} left-2 sm:left-4`}
      >
        <CaretLeft size={20} weight="bold" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Destacado siguiente"
        className={`${arrowClass} right-2 sm:right-4`}
      >
        <CaretRight size={20} weight="bold" />
      </button>

      <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`Ir al destacado ${i + 1}`}
            aria-current={i === current}
            className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </section>
  )
}
