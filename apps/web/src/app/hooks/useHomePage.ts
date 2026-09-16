"use client"

import { useState } from "react"
import { useBrowserGeolocation } from "@/components/organisms/MapComponent/hooks/useBrowserGeolocation"
import { useDebugStore } from "@/store/useDebugStore"

/**
 * ホーム画面のロジックを管理するカスタムフック
 *
 * マップとUIオーバーレイに関連する状態と操作を提供する
 *
 * @params position 現在位置
 * @params debugTimeOverride デバッグ用時間オーバーライド（時間のみ0-23）
 * @params mapBearing マップのbearing（回転角度）
 * @params isSettingsOpen 設定シートの開閉状態
 * @params isAppInfoOpen アプリ情報シートの開閉状態
 * @params handleSettingsClick 設定ボタンがクリックされた時のコールバック
 * @params handleSettingsClose 設定シートを閉じる時のコールバック
 * @params handleAppInfoClick アプリ情報ボタンがクリックされた時のコールバック
 * @params handleAppInfoClose アプリ情報シートを閉じる時のコールバック
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
   isSettingsOpen: boolean
   isAppInfoOpen: boolean
   handleSettingsClick: () => void
   handleSettingsClose: () => void
   handleAppInfoClick: () => void
   handleAppInfoClose: () => void
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
   const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
   const [isAppInfoOpen, setIsAppInfoOpen] = useState<boolean>(false)

   const handleSettingsClick = (): void => {
      setIsSettingsOpen(true)
   }

   const handleSettingsClose = (): void => {
      setIsSettingsOpen(false)
   }

   const handleAppInfoClick = (): void => {
      setIsAppInfoOpen(true)
   }

   const handleAppInfoClose = (): void => {
      setIsAppInfoOpen(false)
   }

   const handleCompassClick = (): void => {
      if (returnToLocation) {
         returnToLocation()
      } else if (triggerGeolocation) {
         // フォールバックとして位置情報取得を実行
         triggerGeolocation()
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
      isSettingsOpen,
      isAppInfoOpen,
      handleSettingsClick,
      handleSettingsClose,
      handleAppInfoClick,
      handleAppInfoClose,
      handleCompassClick,
      handleGeolocationReady,
      handleReturnToLocationReady,
      handleBearingChange,
   }
}
