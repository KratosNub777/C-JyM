import { ProductGridSkeleton } from '@/components/ProductGridSkeleton'

export default function Loading() {
  return (
    <div>
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-neutral-200" />
      <ProductGridSkeleton count={12} />
    </div>
  )
}
