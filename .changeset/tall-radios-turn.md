---
'@tanstack/cli': patch
'@tanstack/create': patch
---

Improve CLI compatibility and scaffold behavior for legacy router-first workflows.

- Add safer target directory handling by warning before creating into non-empty folders.
- Support explicit git initialization control via `--git` and `--no-git`.
- Restore router-only compatibility mode with file-based routing templates (without Start-dependent add-ons/deployments/starters), while still allowing toolchains.
- Default `create-tsrouter-app` to router-only compatibility mode.
- Remove stale `count.txt` ignore entries from base templates.

Also expands starter documentation with clearer creation, maintenance, UI usage, and banner guidance.
