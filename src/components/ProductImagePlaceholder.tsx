import Image from 'next/image'

// Se muestra mientras un producto no tiene foto: el logo atenuado sobre un fondo de marca.
export function ProductImagePlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 to-neutral-100 p-8 dark:from-neutral-800 dark:to-neutral-900">
      <Image
        src="/logo.png"
        alt=""
        width={160}
        height={80}
        className="h-auto w-3/5 max-w-[200px] opacity-40 dark:hidden"
      />
      <Image
        src="/logo-dark.png"
        alt=""
        width={160}
        height={80}
        className="hidden h-auto w-3/5 max-w-[200px] opacity-40 dark:block"
      />
      <span className="sr-only">Sin imagen</span>
    </div>
  )
}
