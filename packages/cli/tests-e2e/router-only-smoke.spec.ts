import { expect, test } from '@playwright/test'

import { attachRuntimeGuards, createReactAppFixture } from './helpers'

test('@blocking creates a React router-only app and navigates every internal link', async ({
  page,
}) => {
  const fixture = await createReactAppFixture({
    appName: 'react-router-only-smoke-app',
    routerOnly: true,
  })
  const guards = attachRuntimeGuards(page, fixture.url)

  try {
    await page.goto(fixture.url)
    await expect(
      page.getByRole('heading', { name: 'Island hours, but for product teams.' }),
    ).toBeVisible()

    const homeLinks = await page
      .locator('a[href^="/"]')
      .evaluateAll((anchors) =>
        Array.from(new Set(anchors.map((anchor) => anchor.getAttribute('href') || '')))
          .filter(Boolean)
          .sort(),
      )

    expect(homeLinks).toContain('/blog')

    await page.locator('a[href="/blog"]').first().click()
    await expect(page).toHaveURL(/\/blog\/?$/)
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible()

    const blogPostLinks = await page
      .locator('a[href^="/blog/"]')
      .evaluateAll((anchors) =>
        Array.from(new Set(anchors.map((anchor) => anchor.getAttribute('href') || '')))
          .filter(Boolean)
          .sort(),
      )

    expect(blogPostLinks.length).toBeGreaterThan(0)

    for (const postPath of blogPostLinks) {
      await page.locator(`a[href="${postPath}"]`).first().click()
      await expect(page).toHaveURL(new RegExp(`${postPath}/?$`))
      await expect(page.locator('h1').first()).toBeVisible()
      await page.goBack()
      await expect(page).toHaveURL(/\/blog\/?$/)
    }

    await page.goto(`${fixture.url}/about`)
    await expect(page.getByRole('heading', { name: 'Built for shipping fast.' })).toBeVisible()

    await page.goto(fixture.url)
    await expect(
      page.getByRole('heading', { name: 'Island hours, but for product teams.' }),
    ).toBeVisible()
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
