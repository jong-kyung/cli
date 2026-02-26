import { expect, test } from '@playwright/test'

import { attachRuntimeGuards, createAppFixture } from './helpers'

test('@blocking creates a Solid app and renders the home route', async ({ page }) => {
  const fixture = await createAppFixture({
    appName: 'solid-smoke-app',
    framework: 'solid',
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await page.goto(fixture.url)
    await expect(page.getByRole('heading', { name: /TANSTACK/i })).toBeVisible()
    await expect(page.getByText('The framework for next generation AI applications')).toBeVisible()
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
