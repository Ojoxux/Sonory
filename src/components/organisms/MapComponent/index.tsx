'use client'

import type { ReactElement } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { DebugPanel } from '@/components/atoms/DebugPanel'
import { SoundPinMarkers } from '@/components/molecules/SoundPinMarkers'
import { UserMarker } from '@/components/molecules/UserMarker'
import { useMapComponent } from './hooks'
import type { MapComponentProps } from './type'

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

  return (
    <>
      <div
        ref={mapContainerRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      {/* 音声ピンマーカー */}
      <SoundPinMarkers
        map={map}
        mapStyleLoaded={mapStyleLoaded}
        pins={pins}
        selectedPinId={selectedPinId}
        onPinSelect={selectPin}
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
    </>
  )
}

// next/dynamicで使用するためにデフォルトエクスポートを追加
export default MapComponent
