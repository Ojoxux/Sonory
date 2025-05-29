'use client'

import { AppHeader } from '@/components/molecules/AppHeader'
import { RecordingInterface } from '@/components/organisms/RecordingInterface'
import type { UIOverlayProps } from './type'

/**
 * UIオーバーレイコンポーネント
 *
 * @description
 * マップ上に表示されるUI要素を統合するOrganismコンポーネント
 * ヘッダーと録音インターフェースを含む
 *
 * @example
 * ```tsx
 * <UIOverlay
 *   onSettingsClick={() => console.log('設定')}
 *   latitude={37.1234}
 *   longitude={139.1234}
 * />
 * ```
 */
export function UIOverlay({
  onSettingsClick,
  latitude,
  longitude,
  debugTimeOverride,
}: UIOverlayProps) {
  return (
    <>
      {/* ヘッダー（常に表示） */}
      <AppHeader
        onSettingsClick={onSettingsClick}
        latitude={latitude}
        longitude={longitude}
        debugTimeOverride={debugTimeOverride}
      />

      {/* 録音インターフェース */}
      <RecordingInterface
        onExpandedChange={() => {
          /* no-op */
        }}
      />
    </>
  )
}
