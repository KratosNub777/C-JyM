export const PRODUCTS_TAG = 'products'
export const CATEGORIES_TAG = 'categories'
export const CATALOG_REVALIDATE_SECONDS = 300

// Passed as revalidateTag's 2nd arg: expires the tag immediately instead of
// serving stale content, since our hooks run outside a Server Action
// (Payload's admin saves go through its own Route Handlers).
export const REVALIDATE_IMMEDIATELY = { expire: 0 } as const
