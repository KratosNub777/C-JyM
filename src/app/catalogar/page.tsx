import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { CatalogarForm } from './CatalogarForm'
import { getAuthenticatedUser } from '@/lib/auth'
import { buildCategoryTree } from '@/lib/categories'
import { getPayloadClient } from '@/lib/payload'

export default async function CatalogarPage() {
  const user = await getAuthenticatedUser(await headers())

  if (!user) {
    redirect('/admin/login')
  }

  const payload = await getPayloadClient()
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 500,
    depth: 0,
    sort: 'name',
  })

  const { topLevel, childrenByParent } = buildCategoryTree(categories)

  const topLevelCategories = topLevel.map((category) => ({ id: category.id, name: category.name }))

  const subcategoriesByParent: Record<number, { id: number; name: string }[]> = {}
  for (const [parentId, children] of Object.entries(childrenByParent)) {
    subcategoriesByParent[Number(parentId)] = children.map((category) => ({
      id: category.id,
      name: category.name,
    }))
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
        Cargar producto
      </h1>
      <CatalogarForm
        topLevelCategories={topLevelCategories}
        subcategoriesByParent={subcategoriesByParent}
      />
    </div>
  )
}
