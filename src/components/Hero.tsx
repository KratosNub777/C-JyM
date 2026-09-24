import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative h-[420px] overflow-hidden rounded-2xl sm:h-[480px] md:h-[560px]">
      <Image
        src="https://picsum.photos/seed/cjm-hogar/1600/1000"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      <div className="relative flex h-full max-w-lg flex-col justify-center gap-5 px-6 sm:px-10 md:px-14">
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Todo para renovar tu hogar.
        </h1>
        <p className="max-w-md text-base text-white/80">
          Heladeras, cocinas, lavarropas y más, con la confianza de siempre. Precios claros en
          USD y guaraníes.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition active:scale-[0.98]"
          >
            Ver catálogo
            <ArrowRight size={16} weight="bold" />
          </Link>
          <Link
            href="/categorias/heladeras"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
          >
            Ver heladeras
          </Link>
        </div>
      </div>
    </section>
  )
}
