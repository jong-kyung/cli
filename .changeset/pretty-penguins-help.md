---
'@tanstack/cli': patch
'@tanstack/create': patch
---

Add a continuous development workflow for custom add-on authors.

- Add `tanstack add-on dev` to watch project files and continuously refresh `.add-on` outputs.
- Rebuild `.add-on` assets and `add-on.json` automatically when source files change.
- Document the new add-on development loop in the custom add-on guide.
