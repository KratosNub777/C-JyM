import { ProductGridSkeleton } from '@/components/ProductGridSkeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="h-56 w-full animate-pulse rounded-lg bg-neutral-200" />
      <div>
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-neutral-200" />
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  )
}
