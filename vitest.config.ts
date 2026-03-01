// ABOUTME: Vitest configuration for running unit and integration tests.
// ABOUTME: Configures path aliases to match the Next.js tsconfig paths.
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
