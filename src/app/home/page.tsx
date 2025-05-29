'use client'

import { useGeolocation } from '@/components/organisms/MapComponent/hooks/useGeolocation'
import { UIOverlay } from '@/components/organisms/UIOverlay'
import { useDebugStore } from '@/store'
import dynamic from 'next/dynamic'
import type { ReactElement } from 'react'

// MapComponentをクライアントサイドのみでロードするために動的インポート（SSRなし）
const MapComponent = dynamic(
  () =>
    import('@/components/organisms/MapComponent').then(
      (mod) => mod.MapComponent,
    ),
  { ssr: false },
)

/**
 * Sonoryのホーム画面コンポーネント
 *
 * フルスクリーンマップとUIオーバーレイを表示する
 *
 * @returns ホーム画面のJSX要素
 */
export default function Home(): ReactElement {
  const { position } = useGeolocation()
  const { debugTimeOverride } = useDebugStore()

  const handleSettingsClick = (): void => {
    console.log('設定ボタンがクリックされました')
    // TODO: 設定画面の表示処理を実装
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <MapComponent />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay
          onSettingsClick={handleSettingsClick}
          latitude={position?.latitude}
          longitude={position?.longitude}
          debugTimeOverride={debugTimeOverride}
        />
      </div>
    </div>
  )
}
