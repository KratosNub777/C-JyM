export default function Loading() {
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 h-7 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ))}
        <div className="h-12 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  )
}
