import { expect, test, type APIRequestContext } from '@playwright/test'
import { CART_STORAGE_KEY } from '../../src/lib/cart/model'

const base = 'http://localhost:3000'

async function stockedProduct(request: APIRequestContext) {
  const response = await request.get(`${base}/api/products?limit=100&depth=0`)
  expect(response.ok()).toBe(true)
  const { docs } = await response.json()
  const product = docs.find(
    (item: { status: string; stock: number }) => item.status === 'active' && item.stock >= 3,
  )
  expect(
    product,
    'El catálogo de desarrollo necesita un producto activo con al menos 3 unidades.',
  ).toBeTruthy()
  return product as { id: number; name: string; slug: string; price: number; stock: number }
}

test('cart works from cards and product pages, persists and synchronizes tabs', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(90_000)
  const product = await stockedProduct(request)
  await page.goto(`${base}/carrito`)
  await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible()
  await page.goto(`${base}/productos`)
  // A card button adds the product without triggering its product link.
  await page
    .getByRole('button', { name: `Agregar al carrito: ${product.name}`, exact: true })
    .click()
  await expect(page.getByRole('link', { name: 'Carrito, 1 producto', exact: true })).toBeVisible()
  await expect(page).toHaveURL(`${base}/productos`)
  await page.goto(`${base}/productos/${product.slug}`)
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Carrito, 2 productos', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Carrito, 2 productos', exact: true }).click()
  await expect(page.getByRole('link', { name: product.name, exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Carrito, 2 productos', exact: true })).toBeVisible()
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    CART_STORAGE_KEY,
  )
  expect(saved).toEqual({ version: 1, items: [{ productId: product.id, quantity: 2 }] })

  const second = await context.newPage()
  await second.goto(`${base}/carrito`)
  await expect(
    second.getByRole('link', { name: 'Carrito, 2 productos', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: `Aumentar cantidad de ${product.name}`, exact: true })
    .click()
  await expect(
    second.getByRole('link', { name: 'Carrito, 3 productos', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: `Reducir cantidad de ${product.name}`, exact: true })
    .click()
  await expect(page.getByRole('link', { name: 'Carrito, 2 productos', exact: true })).toBeVisible()
  await second.close()
  await page
    .getByRole('button', { name: `Quitar ${product.name} del carrito`, exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible()
  await page.goto(`${base}/productos/${product.slug}`)
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click()
  await page.getByRole('link', { name: 'Carrito, 1 producto', exact: true }).click()
  await page.getByRole('button', { name: 'Vaciar carrito', exact: true }).click()
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('link', { name: product.name, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Vaciar carrito', exact: true }).click()
  await page.getByRole('button', { name: 'Sí, vaciar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible()
})

test('cart rechecks stock, ignores stored prices, recovers from request failures and corrupted storage', async ({
  page,
  request,
}) => {
  const product = await stockedProduct(request)
  await page.goto(`${base}/carrito`)
  await page.evaluate(
    ({ key, id, quantity }) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          items: [
            { productId: id, quantity, price: 1 },
            { productId: 2_000_000_000, quantity: 1 },
          ],
        }),
      ),
    { key: CART_STORAGE_KEY, id: product.id, quantity: product.stock + 1 },
  )
  await page.reload()
  await expect(page.getByText(/Ajustá la cantidad/)).toBeVisible()
  await expect(page.getByText('Este producto ya no está en el catálogo.')).toBeVisible()
  const server = await request.get(`${base}/api/carrito?ids=${product.id}`)
  expect((await server.json()).products[0].price).toBe(product.price)
  await page
    .getByRole('button', { name: `Aumentar cantidad de ${product.name}`, exact: true })
    .isDisabled()
    .then((disabled) => expect(disabled).toBe(true))
  await page
    .getByRole('button', { name: `Reducir cantidad de ${product.name}`, exact: true })
    .click()
  await expect(page.getByText(/Ajustá la cantidad/)).toHaveCount(0)
  await page.route('**/api/carrito?*', (route) =>
    route.fulfill({ status: 503, json: { error: 'Temporary failure' } }),
  )
  await page.reload()
  await expect(
    page.getByText('No pudimos consultar los precios y el stock. Tu carrito sigue guardado.'),
  ).toBeVisible()
  await page.unroute('**/api/carrito?*')
  await page.getByRole('button', { name: 'Intentar de nuevo' }).click()
  await expect(page.getByRole('link', { name: product.name, exact: true })).toBeVisible()
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), CART_STORAGE_KEY)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible()
  expect((await request.get(`${base}/api/carrito?ids=-1`)).status()).toBe(400)
  expect(
    (
      await request.get(`${base}/api/carrito?ids=${Array(101).fill(product.id).join(',')}`)
    ).status(),
  ).toBe(400)
})

test('blocked browser storage retains an editable cart in memory', async ({ page, request }) => {
  const product = await stockedProduct(request)
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Blocked', 'QuotaExceededError')
    }
  })
  await page.goto(`${base}/productos/${product.slug}`)
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click()
  await page.getByRole('link', { name: 'Carrito, 1 producto', exact: true }).click()
  await expect(page.getByText(/El navegador no permite guardar el carrito/)).toBeVisible()
  await page
    .getByRole('button', { name: `Aumentar cantidad de ${product.name}`, exact: true })
    .click()
  await expect(page.getByRole('link', { name: 'Carrito, 2 productos', exact: true })).toBeVisible()
})
