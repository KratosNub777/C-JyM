import { GeistSans } from 'geist/font/sans'
import React from 'react'

import '../(frontend)/styles.css'

export const metadata = {
  robots: { index: false },
  title: 'Cargar producto',
}

export default function CatalogarLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es" className={GeistSans.className}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  )
}
