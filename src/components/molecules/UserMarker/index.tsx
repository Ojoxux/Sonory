/**
 * ユーザーマーカー管理コンポーネント
 *
 * @description 地図上のユーザー位置マーカーの作成・更新を管理
 * @example
 * ```tsx
 * <UserMarker
 *   map={mapInstance}
 *   position={userPosition}
 * />
 * ```
 */

'use client'

import type { LocationData } from '@/components/organisms/MapComponent/type'
import mapboxgl from 'mapbox-gl'
import { useCallback, useEffect, useRef } from 'react'

export type UserMarkerProps = {
  /** Mapboxマップインスタンス */
  map: mapboxgl.Map | null
  /** ユーザーの位置情報 */
  position: LocationData | null
}

export function UserMarker({ map, position }: UserMarkerProps): null {
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)

  /**
   * シンプルなマーカーを作成する関数
   *
   * @param lng - 経度
   * @param lat - 緯度
   */
  const createUserMarker = useCallback(
    (lng: number, lat: number): void => {
      if (!map) return

      // 既存のマーカーを削除
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }

      try {
        // シンプルなマーカーを作成
        const marker = new mapboxgl.Marker({
          color: '#ff6b6b',
        })
          .setLngLat([lng, lat])
          .addTo(map)

        userMarkerRef.current = marker
        console.log('ユーザーマーカーを作成しました:', { lng, lat })
      } catch (error) {
        console.error('マーカー作成エラー:', error)
      }
    },
    [map],
  )

  // 位置情報が更新されたらマーカーを更新
  useEffect(() => {
    if (!map || !position) return

    createUserMarker(position.longitude, position.latitude)
  }, [map, position, createUserMarker])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }
    }
  }, [])

  return null
}
