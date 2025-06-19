/**
 * 音声ピンマーカー管理コンポーネント
 *
 * @description 地図上の音声ピンマーカーの作成・更新・削除を管理
 * @example
 * ```tsx
 * <SoundPinMarkers
 *   map={mapInstance}
 *   pins={soundPins}
 *   selectedPinId={selectedId}
 *   onPinSelect={(id) => setSelectedId(id)}
 * />
 * ```
 */

'use client'

import { CarIcon } from '@/components/atoms/CarIcon'
import type { SoundPin } from '@/store/useSoundPinStore'
import mapboxgl from 'mapbox-gl'
import { useCallback, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'

export type SoundPinMarkersProps = {
   /** Mapboxマップインスタンス */
   map: mapboxgl.Map | null
   /** マップスタイルの読み込み状態 */
   mapStyleLoaded: boolean
   /** 音声ピンの配列 */
   pins: SoundPin[]
   /** 選択中のピンID */
   selectedPinId: string | null
   /** ピン選択時のコールバック */
   onPinSelect: (pinId: string | null) => void
}

export function SoundPinMarkers({
   map,
   mapStyleLoaded,
   pins,
   selectedPinId,
   onPinSelect,
}: SoundPinMarkersProps): null {
   const soundPinMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())

   /**
    * 音声ピンのマーカーを作成
    *
    * @param pinId - ピンのID
    * @param latitude - 緯度
    * @param longitude - 経度
    * @param onClick - クリック時のコールバック
    * @returns Mapboxマーカーインスタンス
    */
   const createSoundPinMarker = useCallback(
      (
         pinId: string,
         latitude: number,
         longitude: number,
         onClick: () => void,
      ): mapboxgl.Marker | null => {
         if (!map) return null

         try {
            // マーカー用のDOM要素を作成
            const markerElement = document.createElement('div')
            markerElement.className = 'sound-pin-marker'
            markerElement.style.cursor = 'pointer'

            // Reactコンポーネントをマーカー要素にレンダリング
            const root = createRoot(markerElement)
            root.render(
               <CarIcon
                  size="medium"
                  color="text-blue-600"
                  onClick={onClick}
                  className={
                     selectedPinId === pinId ? 'ring-2 ring-blue-400' : ''
                  }
               />,
            )

            // Mapboxマーカーを作成
            const marker = new mapboxgl.Marker({
               element: markerElement,
               anchor: 'center',
            })
               .setLngLat([longitude, latitude])
               .addTo(map)

            return marker
         } catch (error) {
            console.error('音声ピンマーカーの作成に失敗:', error)
            return null
         }
      },
      [map, selectedPinId],
   )

   /**
    * 音声ピンマーカーを更新
    */
   const updateSoundPinMarkers = useCallback(() => {
      if (!map || !mapStyleLoaded) return

      // 既存のマーカーをクリア
      soundPinMarkersRef.current.forEach((marker) => {
         marker.remove()
      })
      soundPinMarkersRef.current.clear()

      // 新しいマーカーを作成
      pins.forEach((pin) => {
         const marker = createSoundPinMarker(
            pin.id,
            pin.latitude,
            pin.longitude,
            () => {
               console.log('音声ピンがクリックされました:', pin.primaryLabel)
               onPinSelect(selectedPinId === pin.id ? null : pin.id)
            },
         )

         if (marker) {
            soundPinMarkersRef.current.set(pin.id, marker)
         }
      })
   }, [
      map,
      mapStyleLoaded,
      pins,
      selectedPinId,
      createSoundPinMarker,
      onPinSelect,
   ])

   // 音声ピンが変更されたときにマーカーを更新
   useEffect(() => {
      updateSoundPinMarkers()
   }, [updateSoundPinMarkers])

   // クリーンアップ
   useEffect(() => {
      return () => {
         soundPinMarkersRef.current.forEach((marker) => {
            marker.remove()
         })
         soundPinMarkersRef.current.clear()
      }
   }, [])

   return null
}
