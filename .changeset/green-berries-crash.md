---
'@tanstack/create': patch
---

Improve generated React scaffold reliability and default lint ergonomics.

- Migrate React template imports to package `imports` aliases (`#/*`) while preserving `@/*` compatibility during transition.
- Harden eslint toolchain templates for fresh apps by avoiding known parser/project and resolver issues.
- Fix generated shadcn utility import style for stricter eslint configs.
- Improve TanStack Form demo select contrast in dark mode.
