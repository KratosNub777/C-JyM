import { ProductGridSkeleton } from '@/components/ProductGridSkeleton'

export default function Loading() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Productos</h1>
      <ProductGridSkeleton count={24} />
    </div>
  )
}
