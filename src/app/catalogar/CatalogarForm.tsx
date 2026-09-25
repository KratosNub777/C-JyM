'use client'

import { useRef, useState } from 'react'

import { validateProductFields } from '@/lib/validateProductFields'

type CategoryOption = { id: number; name: string }

const NEW_OPTION = '__new__'

export function CatalogarForm({
  topLevelCategories,
  subcategoriesByParent,
}: {
  topLevelCategories: CategoryOption[]
  subcategoriesByParent: Record<number, CategoryOption[]>
}) {
  const [categories, setCategories] = useState(topLevelCategories)
  const [subcategoriesMap, setSubcategoriesMap] = useState(subcategoriesByParent)

  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [brand, setBrand] = useState('')

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [sku, setSku] = useState('')
  const [stock, setStock] = useState('')
  const [description, setDescription] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const subcategoryOptions =
    categoryId && categoryId !== NEW_OPTION ? (subcategoriesMap[Number(categoryId)] ?? []) : []

  function resetProductFields() {
    setName('')
    setPrice('')
    setCompareAtPrice('')
    setSku('')
    setStock('')
    setDescription('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)

    if (categoryId === NEW_OPTION && !newCategoryName.trim())
      return setMessage({ type: 'error', text: 'Escribí el nombre de la nueva categoría.' })
    if (subcategoryId === NEW_OPTION && !newSubcategoryName.trim())
      return setMessage({ type: 'error', text: 'Escribí el nombre de la nueva subcategoría.' })

    const validationError = validateProductFields({
      name,
      hasCategory: Boolean(categoryId),
      price,
      stock,
      compareAtPrice,
    })
    if (validationError) return setMessage({ type: 'error', text: validationError })

    const formData = new FormData()
    formData.set('name', name.trim())
    formData.set('price', price)
    if (compareAtPrice) formData.set('compareAtPrice', compareAtPrice)
    if (sku.trim()) formData.set('sku', sku.trim())
    formData.set('stock', stock)
    if (description.trim()) formData.set('description', description.trim())
    if (brand.trim()) formData.set('brand', brand.trim())

    if (categoryId === NEW_OPTION) {
      formData.set('categoryName', newCategoryName.trim())
    } else {
      formData.set('categoryId', categoryId)
    }

    if (subcategoryId === NEW_OPTION) {
      formData.set('subcategoryName', newSubcategoryName.trim())
    } else if (subcategoryId) {
      formData.set('subcategoryId', subcategoryId)
    }

    const photoFile = photoInputRef.current?.files?.[0]
    if (photoFile) formData.set('photo', photoFile)

    setSubmitting(true)
    try {
      const res = await fetch('/catalogar/submit', { method: 'POST', body: formData })
      const result = await res.json()

      if (!res.ok || !result.ok) {
        setMessage({ type: 'error', text: result.error ?? 'No se pudo guardar el producto.' })
        return
      }

      if (categoryId === NEW_OPTION && result.category) {
        setCategories((prev) => [...prev, result.category])
        setCategoryId(String(result.category.id))
        setNewCategoryName('')
      }
      if (subcategoryId === NEW_OPTION && result.subcategory) {
        const parentId = Number(result.category?.id ?? categoryId)
        setSubcategoriesMap((prev) => ({
          ...prev,
          [parentId]: [...(prev[parentId] ?? []), result.subcategory],
        }))
        setSubcategoryId(String(result.subcategory.id))
        setNewSubcategoryName('')
      }

      setMessage({ type: 'success', text: `Guardado: ${result.product.name}` })
      resetProductFields()
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión. Probá de nuevo.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {message && (
        <p
          className={
            message.type === 'success'
              ? 'rounded-lg bg-brand-green-50 px-3 py-2 text-sm text-brand-green-600 dark:bg-brand-green-100/10'
              : 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10'
          }
        >
          {message.text}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Nombre *
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Categoría *
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setSubcategoryId('')
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
          required
        >
          <option value="">Elegir...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
          <option value={NEW_OPTION}>+ Nueva categoría</option>
        </select>
      </label>
      {categoryId === NEW_OPTION && (
        <input
          type="text"
          placeholder="Nombre de la nueva categoría"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
        />
      )}

      {categoryId && (
        <>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Subcategoría
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">Ninguna</option>
              {subcategoryOptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
              {categoryId !== NEW_OPTION && <option value={NEW_OPTION}>+ Nueva subcategoría</option>}
            </select>
          </label>
          {subcategoryId === NEW_OPTION && (
            <input
              type="text"
              placeholder="Nombre de la nueva subcategoría"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
            />
          )}
        </>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Marca
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Precio (Gs.) *
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Precio lista (Gs.)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Stock *
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          SKU
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Descripción
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Foto
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-600 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? 'Guardando...' : 'Guardar producto'}
      </button>
    </form>
  )
}
