import { ProductGridSkeleton } from '@/components/ProductGridSkeleton'

export default function Loading() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Ofertas</h1>
      <div className="mb-6 h-5 w-72 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <ProductGridSkeleton count={12} />
    </div>
  )
}
