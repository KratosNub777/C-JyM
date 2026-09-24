import { ProductGridSkeleton } from '@/components/ProductGridSkeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="h-[420px] w-full animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800 sm:h-[480px] md:h-[560px]" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={`aspect-square animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800 ${
              index === 0 ? 'col-span-2 row-span-2 md:col-span-2' : ''
            }`}
          />
        ))}
      </div>
      <div>
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  )
}
