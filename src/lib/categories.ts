import type { Icon } from '@phosphor-icons/react'
import { Broom, CookingPot, Fan, Snowflake, Television } from '@phosphor-icons/react/dist/ssr'

import type { Category } from '@/payload-types'

export const ICONS_BY_SLUG: Record<string, Icon> = {
  'linea-blanca': Snowflake,
  cocina: CookingPot,
  'climatizacion-grupo': Fan,
  'audio-tv': Television,
  'cuidado-del-hogar': Broom,
}

export function getParentId(category: Category): number | null {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent.id : category.parent
}

export function buildCategoryTree(categories: Category[]) {
  const topLevel = categories.filter((category) => !category.parent)

  const childrenByParent = categories.reduce<Record<number, Category[]>>((map, category) => {
    const parentId = getParentId(category)
    if (!parentId) return map
    map[parentId] = map[parentId] ?? []
    map[parentId].push(category)
    return map
  }, {})

  return { topLevel, childrenByParent }
}
