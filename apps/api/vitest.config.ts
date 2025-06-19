import { defineConfig } from 'vitest/config'

export default defineConfig({
   test: {
      globals: true,
      environment: 'miniflare',
      environmentOptions: {
         modules: true,
         script: false,
         kvNamespaces: ['TEST_NAMESPACE'],
      },
   },
   resolve: {
      alias: {
         '@': '/src',
      },
   },
})
