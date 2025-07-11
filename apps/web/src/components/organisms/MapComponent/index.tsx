"use client"

import type { ReactElement } from "react"
import "mapbox-gl/dist/mapbox-gl.css"
import { DebugPanel } from "@/components/atoms/DebugPanel"
import { SoundPinMarkers } from "@/components/molecules/SoundPinMarkers"
import { UserMarker } from "@/components/molecules/UserMarker"
import NotificationCenter from "@/components/organisms/NotificationCenter"
import { PinAudioPlayer } from "@/components/organisms/PinAudioPlayer"
import { useMapRealtime } from "@/hooks/useRealtime"
import type { MapBounds, SoundPin } from "@/store/useSoundPinStore"
import { useCallback, useEffect, useState } from "react"
import { useMapComponent } from "./hooks"
import type { MapComponentProps } from "./type"

/**
 * Mapbox GLを使用したマップコンポーネント
 *
 * Zenlyスタイルのシンプルな地図表示と、時間帯に応じた色変化を提供
 * 3D建物表示機能を含む
 * Phase 5Cでリアルタイム通知機能を統合
 */
export function MapComponent({
   onGeolocationReady,
   onReturnToLocationReady,
   onBearingChange,
}: MapComponentProps): ReactElement {
   const [playingPin, setPlayingPin] = useState<SoundPin | null>(null)

   const {
      mapContainerRef,
      map,
      mapStyleLoaded,
      position,
      currentLighting,
      debugMode,
      pins,
      selectedPinId,
      permissionStatus,
      geolocateInitialized,
      geolocateAttempted,
      debugTimeOverride,
      isMapboxPosition,
      selectPin,
      setDebugTimeOverride,
      updateLightingAndShadows,
   } = useMapComponent({
      onGeolocationReady,
      onReturnToLocationReady,
      onBearingChange,
   })

   // リアルタイム機能統合
   const realtime = useMapRealtime(position)

   /**
    * 地図範囲変更時のリアルタイム購読更新
    */
   const handleMapBoundsChange = useCallback(
      (bounds: MapBounds): void => {
         if (position && realtime.isConnected) {
            realtime.updateSubscription(bounds)
         }
      },
      [position, realtime],
   )

   /**
    * 地図移動イベントの監視
    */
   useEffect(() => {
      if (!map || !mapStyleLoaded) return

      const handleMoveEnd = (): void => {
         const bounds = map.getBounds()
         if (bounds) {
            const mapBounds: MapBounds = {
               north: bounds.getNorth(),
               south: bounds.getSouth(),
               east: bounds.getEast(),
               west: bounds.getWest(),
            }
            handleMapBoundsChange(mapBounds)
         }
      }

      // 地図移動完了時に購読を更新
      map.on("moveend", handleMoveEnd)

      // 初回の購読設定
      if (position) {
         handleMoveEnd()
      }

      return () => {
         map.off("moveend", handleMoveEnd)
      }
   }, [map, mapStyleLoaded, position, handleMapBoundsChange])

   /**
    * ピン選択時の処理（音声再生対応）
    */
   const handlePinSelect = (pinId: string | null): void => {
      selectPin(pinId)

      if (pinId) {
         // 選択されたピンを見つけて音声再生用に設定
         const selectedPin = pins.find((pin) => pin.id === pinId)
         if (selectedPin?.isPersisted && selectedPin.audioData?.url) {
            setPlayingPin(selectedPin)
         }
      }
   }

   /**
    * 音声再生を閉じる
    */
   const handleCloseAudioPlayer = (): void => {
      setPlayingPin(null)
      selectPin(null)
   }

   /**
    * 通知からのピンクリック処理
    */
   const handleNotificationPinClick = useCallback(
      (pinId: string): void => {
         // ピンを選択
         handlePinSelect(pinId)

         // 該当ピンの位置に地図を移動
         const targetPin = pins.find((pin) => pin.id === pinId)
         if (targetPin && map) {
            map.flyTo({
               center: [targetPin.longitude, targetPin.latitude],
               zoom: 16,
               duration: 1000,
            })
         }
      },
      [pins, map],
   )

   return (
      <>
         <div
            ref={mapContainerRef}
            className="absolute top-0 left-0 z-0 h-full w-full"
         />

         {/* 音声ピンマーカー */}
         <SoundPinMarkers
            map={map}
            mapStyleLoaded={mapStyleLoaded}
            pins={pins}
            selectedPinId={selectedPinId}
            onPinSelect={handlePinSelect}
         />

         {/* ユーザーマーカー */}
         <UserMarker map={map} position={position} />

         {/* リアルタイム通知センター */}
         <NotificationCenter
            position="top"
            maxNotifications={3}
            autoHideDuration={5000}
            onPinClick={handleNotificationPinClick}
         />

         {/* デバッグ情報表示 */}
         {debugMode && (
            <DebugPanel
               position={position}
               permissionStatus={permissionStatus}
               currentLighting={currentLighting}
               isMapboxPosition={isMapboxPosition}
               geolocateInitialized={geolocateInitialized}
               geolocateAttempted={geolocateAttempted}
               debugTimeOverride={debugTimeOverride}
               onTimeChange={setDebugTimeOverride}
               onUpdateLighting={updateLightingAndShadows}
            />
         )}

         {/* リアルタイム接続状態表示（デバッグ用） */}
         {debugMode && (
            <div className="fixed bottom-4 left-4 z-50 rounded bg-black bg-opacity-75 p-2 text-white text-xs">
               <div>
                  Realtime:{" "}
                  {realtime.isConnected ? "🟢 Connected" : "🔴 Disconnected"}
               </div>
               <div>Status: {realtime.connectionStatus}</div>
               <div>Unread: {realtime.unreadCount}</div>
               {realtime.connectionError && (
                  <div className="text-red-300">
                     Error: {realtime.connectionError}
                  </div>
               )}
            </div>
         )}

         {/* 音声ピン再生 */}
         {playingPin && (
            <PinAudioPlayer pin={playingPin} onClose={handleCloseAudioPlayer} />
         )}
      </>
   )
}

// next/dynamicで使用するためにデフォルトエクスポートを追加
export default MapComponent
