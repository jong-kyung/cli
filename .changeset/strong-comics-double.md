---
'@tanstack/cli': patch
'@tanstack/create': patch
---

Improve scaffold customization and custom add-on authoring flow.

- Add `--examples` / `--no-examples` support to include or omit demo/example pages during app creation.
- Prompt for add-on-declared environment variables during interactive create and seed entered values into generated `.env.local`.
- Ensure custom add-on/starter metadata consistently includes a `version`, with safe backfill for older metadata files.
- Align bundled starter/example metadata and docs with current Start/file-router behavior.
