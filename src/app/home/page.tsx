'use client'

import { UIOverlay } from '@/components/UIOverlay'
import { Box } from '@chakra-ui/react'
import dynamic from 'next/dynamic'

// MapComponentをクライアントサイドのみでロードするために動的インポート（SSRなし）
const MapComponent = dynamic(
  () => import('@/components/MapComponent').then((mod) => mod.MapComponent),
  { ssr: false },
)

/**
 * Sonoryのホーム画面コンポーネント
 *
 * フルスクリーンマップとUIオーバーレイを表示する
 */
export default function Home() {
  return (
    <Box position="relative" h="100vh" w="100vw" overflow="hidden">
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        zIndex="0"
        pointerEvents="auto"
      >
        <MapComponent />
      </Box>
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        zIndex="10"
        pointerEvents="none"
      >
        <UIOverlay />
      </Box>
    </Box>
  )
}
