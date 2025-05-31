'use client'

import { useGeolocation } from '@/components/organisms/MapComponent/hooks/useGeolocation'
import { UIOverlay } from '@/components/organisms/UIOverlay'
import { useDebugStore } from '@/store'
import dynamic from 'next/dynamic'
import type { ReactElement } from 'react'
import { useState } from 'react'

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
  const {
    position,
    debugTimeOverride,
    mapBearing,
    handleSettingsClick,
    handleCompassClick,
    handleGeolocationReady,
    handleReturnToLocationReady,
    handleBearingChange,
  } = useHomePage()

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <MapComponent
          onGeolocationReady={handleGeolocationReady}
          onReturnToLocationReady={handleReturnToLocationReady}
          onBearingChange={handleBearingChange}
        />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay
          onSettingsClick={handleSettingsClick}
          onCompassClick={handleCompassClick}
          latitude={position?.latitude}
          longitude={position?.longitude}
          debugTimeOverride={debugTimeOverride}
          mapBearing={mapBearing}
        />
      </div>
    </div>
  )
}

/**
 * ホーム画面のロジックを管理するカスタムフック
 *
 * マップとUIオーバーレイに関連する状態と操作を提供する
 *
 * @params position 現在位置
 * @params debugTimeOverride デバッグ用時間オーバーライド（時間のみ0-23）
 * @params mapBearing マップのbearing（回転角度）
 * @params handleSettingsClick 設定ボタンがクリックされた時のコールバック
 * @params handleCompassClick コンパスボタンがクリックされた時のコールバック
 * @params handleGeolocationReady 位置情報取得が準備できた時のコールバック
 * @params handleReturnToLocationReady 現在位置に戻るボタンがクリックされた時のコールバック
 * @params handleBearingChange マップのbearing（回転角度）が変更された時のコールバック
 *
 * @returns ホーム画面で使用する状態と関数のセット
 */
export const useHomePage = (): {
  position: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: number
  } | null
  debugTimeOverride: number | null
  mapBearing: number
  handleSettingsClick: () => void
  handleCompassClick: () => void
  handleGeolocationReady: (geolocationFunction: () => void) => void
  handleReturnToLocationReady: (returnFunction: () => void) => void
  handleBearingChange: (bearing: number) => void
} => {
  const { position } = useGeolocation()
  const { debugTimeOverride } = useDebugStore()
  const [triggerGeolocation, setTriggerGeolocation] = useState<
    (() => void) | null
  >(null)
  const [returnToLocation, setReturnToLocation] = useState<(() => void) | null>(
    null,
  )
  const [mapBearing, setMapBearing] = useState<number>(0)

  const handleSettingsClick = (): void => {
    console.log('設定ボタンがクリックされました')
    // TODO: 設定画面の表示処理を実装
  }

  const handleCompassClick = (): void => {
    console.log('コンパスボタンがクリックされました - 現在位置に戻ります')
    if (returnToLocation) {
      returnToLocation()
    } else if (triggerGeolocation) {
      // フォールバックとして位置情報取得を実行
      triggerGeolocation()
    } else {
      console.warn('位置情報機能がまだ準備できていません')
    }
  }

  const handleGeolocationReady = (geolocationFunction: () => void): void => {
    setTriggerGeolocation(() => geolocationFunction)
  }

  const handleReturnToLocationReady = (returnFunction: () => void): void => {
    setReturnToLocation(() => returnFunction)
  }

  const handleBearingChange = (bearing: number): void => {
    setMapBearing(bearing)
  }

  return {
    position,
    debugTimeOverride,
    mapBearing,
    handleSettingsClick,
    handleCompassClick,
    handleGeolocationReady,
    handleReturnToLocationReady,
    handleBearingChange,
  }
}
