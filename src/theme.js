// 追加部分 2025/05/26
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'
// defineConfig で定義。providers.tsxに渡す
const config = defineConfig({
  globalCss: {
    'html, body': {
      bg: 'gray.100',
      color: 'gray.800',
    },
  },
})

export const system = createSystem(defaultConfig, config)
