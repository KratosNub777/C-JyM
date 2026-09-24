import { ProductGridSkeleton } from '@/components/ProductGridSkeleton'

export default function Loading() {
  return (
    <div>
      <div className="mb-2 h-8 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mb-6 h-4 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <ProductGridSkeleton count={12} />
    </div>
  )
}
