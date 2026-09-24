import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Error 404
      </p>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        No encontramos esta página
      </h1>
      <p className="max-w-md text-neutral-500 dark:text-neutral-400">
        El producto o la categoría que buscás no existe o ya no está disponible.
      </p>
      <Link
        href="/productos"
        className="mt-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Ver todo el catálogo
      </Link>
    </div>
  )
}
