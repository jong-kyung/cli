---
id: starters
title: Starters
---

Starters are reusable presets of project setup choices. They capture configuration, not source files.

## Use a Starter

```bash
tanstack create my-app --starter https://example.com/starter.json
tanstack create my-app --starter ./local-starter.json
```

You can also set a starter in the UI flow:

```bash
tanstack create my-app --ui
```

Then use **Set Starter** and paste the URL to your hosted `starter.json`.

## Create a Starter

```bash
# 1. Create project with desired setup
tanstack create my-preset --add-ons clerk,drizzle,sentry

# 2. Initialize starter
cd my-preset
tanstack starter init

# 3. Edit starter-info.json (name/description/banner), then compile
tanstack starter compile

# 4. Use or distribute starter.json
tanstack create new-app --starter ./starter.json
```

## Maintain a Starter

When you update your source preset project:

```bash
cd my-preset
tanstack starter compile
```

Commit and publish the updated `starter.json` to the same URL (or a versioned URL) used by your team.

Recommended workflow:

1. Keep your source preset project in git.
2. Run `tanstack starter compile` whenever add-ons/options change.
3. Publish `starter.json` where it can be fetched over HTTPS.
4. Use that URL with `--starter` (CLI) or **Set Starter** (UI).

## Starter Schema

`starter-info.json`:

```json
{
  "id": "my-saas",
  "name": "SaaS Starter",
  "description": "Auth, database, monitoring",
  "framework": "react",
  "mode": "file-router",
  "typescript": true,
  "tailwind": true,
  "addOns": ["clerk", "drizzle", "sentry"],
  "addOnOptions": {
    "drizzle": { "database": "postgres" }
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier |
| `name` | Yes | Display name |
| `description` | Yes | Brief description |
| `framework` | Yes | `react` or `solid` |
| `mode` | Yes | `file-router` |
| `typescript` | Yes | Enable TypeScript |
| `tailwind` | Yes | Include Tailwind |
| `addOns` | Yes | Add-on IDs |
| `addOnOptions` | No | Per-add-on config |
| `banner` | No | Image URL shown in UI |

### Banner Image

`banner` should be a publicly accessible image URL (PNG/JPG/WebP) used by the create UI. A screenshot of the starter works well.

Example:

```json
{
  "banner": "https://example.com/my-starter-banner.png"
}
```

## Starter vs Add-on

| | Starter | Add-on |
|-|---------|--------|
| Contains code | No | Yes |
| Adds files | No | Yes |
| Configuration preset | Yes | No |
