"use client"

import type { ReactElement } from "react"
import "mapbox-gl/dist/mapbox-gl.css"
import { DebugPanel } from "@/components/atoms/DebugPanel"
import { SoundPinMarkers } from "@/components/molecules/SoundPinMarkers"
import { UserMarker } from "@/components/molecules/UserMarker"
import { PinAudioPlayer } from "@/components/organisms/PinAudioPlayer"
import type { SoundPin } from "@/store/useSoundPinStore"
import { useState } from "react"
import { useMapComponent } from "./hooks"
import type { MapComponentProps } from "./type"

/**
 * Mapbox GLを使用したマップコンポーネント
 *
 * Zenlyスタイルのシンプルな地図表示と、時間帯に応じた色変化を提供
 * 3D建物表示機能を含む
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

         {/* 音声ピン再生 */}
         {playingPin && (
            <PinAudioPlayer pin={playingPin} onClose={handleCloseAudioPlayer} />
         )}
      </>
   )
}

// next/dynamicで使用するためにデフォルトエクスポートを追加
export default MapComponent
