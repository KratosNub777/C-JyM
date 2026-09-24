export default function Loading() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square w-full animate-pulse rounded-lg bg-neutral-200" />
      <div className="flex flex-col gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="mt-2 h-10 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="mt-4 h-24 w-full animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  )
}
