---
'@tanstack/create': patch
'@tanstack/cli': patch
---

Improve generated app reliability and CLI compatibility.

- Fix React Query provider scaffolding (including Query + tRPC combinations) so generated apps build correctly.
- Fix Prisma add-on package template rendering by exposing package-manager execute helper in `package.json.ejs` context.
- Restore `--tailwind` and `--no-tailwind` as deprecated compatibility flags that are accepted but ignored with clear warnings.
- Align CLI/docs examples with the current Tailwind-always-on behavior.
- Update Convex demo import to type-only `Id` import to avoid runtime resolution issues.
