'use client'

import Link from 'next/link'

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Algo salió mal
      </p>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        No pudimos cargar esta página
      </h1>
      <p className="max-w-md text-neutral-500 dark:text-neutral-400">
        Fue un problema nuestro y es temporal. Probá de nuevo en unos segundos.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
