// app/providers.tsx
'use client'
/* 追加部分_Chakra-uiテスト用 */
import { ChakraProvider } from '@chakra-ui/react'
import { system } from '../theme.js'
// theme.jsで定義したオブジェクトをvalueに渡す

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>
}
