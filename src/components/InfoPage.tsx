import type { ReactNode } from 'react'

// Contenedor de las páginas de texto del footer (institucionales y legales).
export function InfoPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string
  intro?: string
  updated?: string
  children: ReactNode
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        {title}
      </h1>
      {intro && (
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-300">{intro}</p>
      )}
      {updated && (
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Última actualización: {updated}
        </p>
      )}
      <div className="mt-8 space-y-4 leading-relaxed text-neutral-700 dark:text-neutral-300 [&_a]:font-medium [&_a]:text-brand-600 [&_a]:underline-offset-2 hover:[&_a]:underline dark:[&_a]:text-brand-400 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-900 dark:[&_h2]:text-neutral-100 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  )
}
