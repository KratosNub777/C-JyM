import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { CART_STORAGE_KEY } from '../../src/lib/cart/model'
import { orderReference } from '../../src/lib/checkout/model'
import { expirePendingOrders } from '../../src/lib/checkout/expireOrders'
import {
  fillRegistration,
  resetAuthRateLimits,
  submitVerificationCode,
} from '../helpers/customerAuth'

const base = 'http://localhost:3000'
const run = randomUUID()
const email = `checkout-ui-${run}@example.com`
const otherEmail = `checkout-ui-other-${run}@example.com`
const lostEmail = `checkout-ui-lost-${run}@example.com`
const expiredEmail = `checkout-ui-expired-${run}@example.com`
const password = `Test-${run}!`
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
let payload: Payload
let productId: number
let slug: string

test.beforeAll(async () => {
  const resolved = await config
  // Fixture writes don't need public indexing/cache hooks in this separate process.
  const products = resolved.collections.find((collection) => collection.slug === 'products')!
  products.hooks.afterChange = []
  products.hooks.afterDelete = []
  payload = await getPayload({ config: resolved })
  const category = (await payload.find({ collection: 'categories', limit: 1, depth: 0 })).docs[0]
  slug = `checkout-ui-${run}`
  const product = await payload.create({
    collection: 'products',
    data: {
      name: 'Producto de prueba checkout',
      slug,
      category: category.id,
      price: 25000,
      stock: 3,
      status: 'active',
    },
  })
  productId = product.id
})
test.afterAll(async () => {
  const customers = await pool.query('SELECT id FROM "user" WHERE email = ANY($1)', [
    [email, otherEmail, lostEmail, expiredEmail],
  ])
  if (payload) {
    if (customers.rows.length)
      await payload.delete({
        collection: 'orders',
        where: { customerId: { in: customers.rows.map((customer) => customer.id) } },
        overrideAccess: true,
      })
    if (productId) await payload.delete({ collection: 'products', id: productId })
    await payload.destroy()
  }
  await pool.query('DELETE FROM "user" WHERE email = ANY($1)', [
    [email, otherEmail, lostEmail, expiredEmail],
  ])
  await pool.query('DELETE FROM verification WHERE identifier LIKE ANY($1)', [
    [email, otherEmail, lostEmail, expiredEmail].map((item) => `%${item}`),
  ])
  await pool.end()
})

async function register(page: Page, userEmail: string) {
  await resetAuthRateLimits()
  await fillRegistration(page, { name: 'Cliente Checkout', email: userEmail, password })
  await submitVerificationCode(page, userEmail)
}

test('guest cart survives signup, checkout/cancellation work, and foreign orders stay private', async ({
  page,
  browser,
}) => {
  test.setTimeout(180000)
  await page.goto(`${base}/productos/${slug}`)
  await page.getByRole('button', { name: 'Agregar al carrito', exact: true }).click()
  await page.goto(`${base}/carrito`)
  await page.getByRole('link', { name: 'Continuar al checkout' }).click()
  await expect(page).toHaveURL(`${base}/ingresar?next=/checkout`)
  await page.getByRole('link', { name: 'Registrate', exact: true }).click()
  await expect(page).toHaveURL(`${base}/registrarse?next=/checkout`)
  await register(page, email)
  await expect(page).toHaveURL(`${base}/checkout`)
  await expect(page.getByRole('heading', { name: 'Confirmar pedido', exact: true })).toBeVisible()
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Producto de prueba checkout' }),
  ).toBeVisible()
  await page.getByLabel('Teléfono', { exact: true }).fill('0981123456')
  await page.getByLabel('Observaciones (opcional)').fill('Prueba automatizada, no despachar')
  await page.screenshot({ path: '.playwright-cli/checkout-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '.playwright-cli/checkout-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.setViewportSize({ width: 1280, height: 900 })

  // A stale quoted price is rejected on the server and refreshed for explicit review.
  await pool.query('UPDATE products SET price = 30000 WHERE id = $1', [productId])
  await page.getByRole('button', { name: 'Confirmar pedido', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Cambió un precio' })).toBeVisible()
  await expect(
    page
      .getByRole('region', { name: 'Resumen del pedido' })
      .getByText('Gs. 30.000', { exact: true }),
  ).toHaveCount(2)
  expect(
    (await pool.query('SELECT stock::integer AS stock FROM products WHERE id = $1', [productId]))
      .rows[0].stock,
  ).toBe(3)
  await expect(page.getByLabel('Teléfono', { exact: true })).toHaveValue('0981123456')
  await expect(page.getByLabel('Observaciones (opcional)')).toHaveValue(
    'Prueba automatizada, no despachar',
  )
  const orderRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && Boolean(request.headers()['next-action']),
    { timeout: 15000 },
  )
  await page.getByRole('button', { name: 'Confirmar pedido', exact: true }).click()
  const orderRequest = await orderRequestPromise
  await expect(page).toHaveURL(/\/cuenta\/pedidos\/\d+$/)
  const orderId = Number(page.url().split('/').at(-1))
  await expect(
    page.getByRole('heading', { name: `Pedido ${orderReference(orderId)}`, exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Pendiente de pago')
  expect(
    (await pool.query('SELECT stock::integer AS stock FROM products WHERE id = $1', [productId]))
      .rows[0].stock,
  ).toBe(2)
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).items, CART_STORAGE_KEY),
  ).toEqual([])
  await page.screenshot({ path: '.playwright-cli/checkout-confirmed.png', fullPage: true })

  const replay = await page.request.post(orderRequest.url(), {
    headers: {
      'next-action': orderRequest.headers()['next-action'],
      'content-type': orderRequest.headers()['content-type'],
      origin: base,
    },
    data: orderRequest.postDataBuffer()!,
  })
  expect(replay.ok()).toBe(true)
  expect(
    (await pool.query('SELECT stock::integer AS stock FROM products WHERE id = $1', [productId]))
      .rows[0].stock,
  ).toBe(2)
  const deniedAPI = await page.request.get(`${base}/api/orders`)
  expect([401, 403]).toContain(deniedAPI.status())
  const forgedAPI = await page.request.post(`${base}/api/orders`, {
    data: { customerId: 'victim', total: 0 },
  })
  expect([401, 403]).toContain(forgedAPI.status())

  await page.getByRole('button', { name: 'Cancelar pedido', exact: true }).click()
  const cancelPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && Boolean(request.headers()['next-action']),
  )
  await page.getByRole('button', { name: 'Sí, cancelar pedido', exact: true }).click()
  const cancelRequest = await cancelPromise
  await expect(page.getByRole('status')).toHaveText('Cancelado')
  expect(
    (await pool.query('SELECT stock::integer AS stock FROM products WHERE id = $1', [productId]))
      .rows[0].stock,
  ).toBe(3)
  await page.reload()
  await expect(page.getByRole('status')).toHaveText('Cancelado')
  await page.goto(`${base}/cuenta/pedidos`)
  await expect(page.getByRole('link', { name: new RegExp(orderReference(orderId)) })).toBeVisible()

  const secondContext = await browser.newContext()
  try {
    const second = await secondContext.newPage()
    await second.goto(`${base}/registrarse`)
    await register(second, otherEmail)
    await expect(second).toHaveURL(`${base}/cuenta`)
    await second.goto(`${base}/cuenta/pedidos/${orderId}`)
    await expect(
      second.getByRole('heading', { name: `Pedido ${orderReference(orderId)}` }),
    ).toHaveCount(0)
    const forged = await second.request.post(cancelRequest.url(), {
      headers: {
        'next-action': cancelRequest.headers()['next-action'],
        'content-type': cancelRequest.headers()['content-type'],
        origin: base,
      },
      data: cancelRequest.postDataBuffer()!,
    })
    expect(await forged.text()).toContain('El pedido no existe.')
    await second.goto(`${base}/cuenta/pedidos`)
    await expect(second.getByText('Todavía no tenés pedidos.', { exact: false })).toBeVisible()
  } finally {
    await secondContext.close()
  }

  await page.getByRole('button', { name: 'Menú de mi cuenta' }).click()
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(`${base}/ingresar`)
  await page.goto(`${base}/checkout`)
  await expect(page).toHaveURL(`${base}/ingresar?next=/checkout`)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page).toHaveURL(`${base}/checkout`)
  await page.goto(`${base}/ingresar?next=https://example.com`)
  await expect(page).toHaveURL(`${base}/cuenta`)
})

test('lost confirmation response can be retried after reload without a second reservation', async ({
  page,
}) => {
  test.setTimeout(120000)
  await page.goto(`${base}/registrarse?next=/checkout`)
  await register(page, lostEmail)
  await expect(page).toHaveURL(`${base}/checkout`)
  await page.evaluate(
    ({ key, id }) =>
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, items: [{ productId: id, quantity: 1 }] }),
      ),
    { key: CART_STORAGE_KEY, id: productId },
  )
  await page.reload()
  await page.getByLabel('Teléfono', { exact: true }).fill('0981123456')
  let dropped = false
  await page.route('**/checkout', async (route) => {
    if (route.request().method() === 'POST' && !dropped) {
      dropped = true
      await route.fetch() // Server commits; the browser never receives its response.
      await route.abort('failed')
    } else await route.continue()
  })
  await page.getByRole('button', { name: 'Confirmar pedido', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Verificar mi pedido', exact: true })).toBeEnabled()
  expect(
    (await pool.query('SELECT stock::integer AS stock FROM products WHERE id = $1', [productId]))
      .rows[0].stock,
  ).toBe(2)
  await page.unroute('**/checkout')
  await page.reload()
  await page.getByRole('button', { name: 'Verificar mi pedido', exact: true }).click()
  await expect(page).toHaveURL(/\/cuenta\/pedidos\/\d+$/)
  expect(
    (await pool.query('SELECT stock::integer AS stock FROM products WHERE id = $1', [productId]))
      .rows[0].stock,
  ).toBe(2)
  await page.getByRole('button', { name: 'Cancelar pedido', exact: true }).click()
  await page.getByRole('button', { name: 'Sí, cancelar pedido', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Cancelado')
})

test('reservation deadline and expired receipt are shown without a second stock return', async ({
  page,
}) => {
  test.setTimeout(120000)
  await page.goto(`${base}/registrarse?next=/checkout`)
  await register(page, expiredEmail)
  await expect(page).toHaveURL(`${base}/checkout`)
  await page.evaluate(
    ({ key, id }) =>
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, items: [{ productId: id, quantity: 1 }] }),
      ),
    { key: CART_STORAGE_KEY, id: productId },
  )
  await page.reload()
  await expect(
    page.getByText('Al confirmar reservamos el stock durante 24 horas.', { exact: false }),
  ).toBeVisible()
  await page.getByLabel('Teléfono', { exact: true }).fill('0981123456')
  await page.getByRole('button', { name: 'Confirmar pedido', exact: true }).click()
  await expect(page).toHaveURL(/\/cuenta\/pedidos\/\d+$/)
  const id = Number(page.url().split('/').at(-1))
  await expect(page.getByText('Reserva hasta el', { exact: false })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '.playwright-cli/reservation-deadline-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  expect((await page.request.post(`${base}/api/cron/expire-orders`)).status()).toBe(401)
  await pool.query(
    "UPDATE orders SET expires_at = clock_timestamp() - INTERVAL '1 minute' WHERE id = $1",
    [id],
  )
  // Same batch service as the worker, scoped to this fixture to protect other development orders.
  expect((await expirePendingOrders(payload, { orderIds: [id] })).expired).toBe(1)
  await page.reload()
  await expect(page.getByRole('status')).toHaveText('Vencido')
  await expect(
    page.getByText('Tu pedido venció y el stock reservado se liberó.', { exact: false }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar pedido', exact: true })).toHaveCount(0)
  expect(
    (await pool.query('SELECT stock::integer AS stock FROM products WHERE id = $1', [productId]))
      .rows[0].stock,
  ).toBe(3)
  expect((await expirePendingOrders(payload, { orderIds: [id] })).expired).toBe(0)
  await page.screenshot({ path: '.playwright-cli/reservation-expired-mobile.png', fullPage: true })
  await page.goto(`${base}/cuenta/pedidos`)
  await expect(
    page.getByRole('link', { name: new RegExp(`${orderReference(id)}.*Vencido`) }),
  ).toBeVisible()
})
