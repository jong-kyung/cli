---
'@tanstack/cli': minor
'@tanstack/create': minor
---

This release pulls together a large batch of improvements across the CLI and scaffolding engine since the last versioning pass.

- Modernizes and refreshes the generated React/Solid template experience, including updated starter content and stronger defaults.
- Improves create flows with better option normalization, stronger guardrails around target directories, and clearer compatibility behavior in router-only mode.
- Expands scaffolding ergonomics with examples toggles, improved add-on/config handling, and reliability fixes across package-manager and cross-platform paths.
- Strengthens test and release confidence via e2e/release workflow hardening and broader smoke coverage.
- Streamlines product surface area by removing the local `create-ui` package and `--ui` command paths from the CLI; visual setup now lives at `https://tanstack.com/builder`.
- Cleans up docs and custom CLI examples to match the current terminal-first workflow and Builder guidance.
