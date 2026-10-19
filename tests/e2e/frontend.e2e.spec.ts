import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Comercial José María/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('En tu hogar todos los días.')
  })

  test('mobile: search is visible and filters fold behind a button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('http://localhost:3000/productos')

    await expect(page.getByRole('searchbox', { name: 'Buscar productos' })).toBeVisible()

    const toggle = page.getByRole('button', { name: /Filtros/ })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByText('Ordenar por')).toBeHidden()

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText('Ordenar por')).toBeVisible()

    await page.goto('http://localhost:3000/productos?sort=price-asc&sale=1')
    await expect(page.getByRole('button', { name: /Filtros/ })).toContainText('2')
  })

  test('desktop: filters stay visible without the toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000/productos')

    await expect(page.getByText('Ordenar por')).toBeVisible()
    await expect(page.getByRole('button', { name: /Filtros/ })).toBeHidden()
  })
})
