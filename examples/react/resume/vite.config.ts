import { defineConfig } from 'vite'
import contentCollections from '@content-collections/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'

const config = defineConfig({
  plugins: [
    contentCollections(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
