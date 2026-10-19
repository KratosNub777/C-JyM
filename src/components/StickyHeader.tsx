'use client'

import { useEffect, useState } from 'react'

// Histéresis: se compacta al pasar COMPACT_AFTER y vuelve a expandirse recién
// bajo EXPAND_BEFORE, para que un temblor del trackpad no haga parpadear el header.
const COMPACT_AFTER = 64
const EXPAND_BEFORE = 24

/**
 * Header fijo que se compacta al bajar. El contenido (renderizado en el servidor) usa
 * `group-data-[compact=true]/header:` para cambiar de tamaño. El espaciador conserva la
 * altura del header expandido, así que el contenido de la página nunca se desplaza.
 * Las alturas viven en variables CSS (`--header-*`) para que header y espaciador coincidan.
 */
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    let frame = 0

    function update() {
      frame = 0
      const y = window.scrollY
      setCompact((current) => (current ? y > EXPAND_BEFORE : y > COMPACT_AFTER))
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // Al recargar a mitad de página ya hay scroll: calcular el estado inicial.
    frame = requestAnimationFrame(update)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="[--header-strip:0rem] [--header-main:4rem] [--header-logo:3rem] [--header-search:3.625rem] [--header-nav:3rem] sm:[--header-strip:1.75rem] sm:[--header-main:6rem] sm:[--header-logo:5rem] sm:[--header-search:0rem]">
      <div
        aria-hidden="true"
        className="h-[calc(var(--header-strip)+var(--header-main)+var(--header-search)+var(--header-nav)+1px)]"
      />
      <header
        data-compact={compact}
        className="group/header fixed inset-x-0 top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur transition-shadow duration-200 data-[compact=true]:shadow-md dark:border-neutral-800 dark:bg-neutral-950/90"
      >
        {children}
      </header>
    </div>
  )
}
