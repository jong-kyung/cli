import { expect, test } from '@playwright/test'

import { attachRuntimeGuards, createReactAppFixture } from './helpers'

test('@blocking creates a React app and navigates core demo routes', async ({ page }) => {
  const fixture = await createReactAppFixture({
    appName: 'react-smoke-app',
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await page.goto(fixture.url)
    await expect(
      page.getByRole('heading', {
        name: 'Island hours, but for product teams.',
      }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Blog' }).click()
    await expect(page).toHaveURL(/\/blog\/?$/)
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible()

    await page.locator('main article a').first().click()
    await expect(page).toHaveURL(/\/blog\/.+/)
    await expect(page.getByText('Post', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about\/?$/)
    await expect(page.getByRole('heading', { name: 'Built for shipping fast.' })).toBeVisible()
  } finally {
    try {
      guards.assertClean()
    } finally {
      guards.dispose()
      await fixture.stop()
      await fixture.cleanup()
    }
  }
})
