'use client'

import { useBrowserGeolocation } from '@/components/organisms/MapComponent/hooks/useBrowserGeolocation'
import { useDebugStore } from '@/store/useDebugStore'
import { useState } from 'react'

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
   const { position } = useBrowserGeolocation()
   const { debugTimeOverride } = useDebugStore()
   const [triggerGeolocation, setTriggerGeolocation] = useState<
      (() => void) | null
   >(null)
   const [returnToLocation, setReturnToLocation] = useState<
      (() => void) | null
   >(null)
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
