import type { Category } from '@/payload-types'

export function buildCategoryTree(categories: Category[]) {
  const topLevel = categories.filter((category) => !category.parent)

  const childrenByParent = categories.reduce<Record<number, Category[]>>((map, category) => {
    const parentId = typeof category.parent === 'number' ? category.parent : null
    if (!parentId) return map
    map[parentId] = map[parentId] ?? []
    map[parentId].push(category)
    return map
  }, {})

  return { topLevel, childrenByParent }
}
