// app/providers.tsx
'use client'
/* 追加部分_Chakra-uiテスト用 */
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
        {children}
    </ChakraProvider>
  )  
}
