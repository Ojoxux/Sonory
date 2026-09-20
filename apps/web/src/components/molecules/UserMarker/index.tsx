/**
 * ユーザーマーカー管理コンポーネント
 *
 * @description 地図上のユーザー位置を描くレイヤーの作成・更新を管理
 * @example
 * ```tsx
 * <UserMarker
 *   map={mapInstance}
 *   mapStyleLoaded={mapStyleLoaded}
 *   position={userPosition}
 * />
 * ```
 */

"use client"

import type mapboxgl from "mapbox-gl"
import { useEffect } from "react"
import type { LocationData } from "@/components/organisms/MapComponent/mapbox.types"
import {
   USER_LOCATION_ACCURACY_LAYER_ID,
   USER_LOCATION_LAYERS,
   USER_LOCATION_SOURCE_ID,
} from "./constants"
import { createAccuracyRadiusExpression } from "./utils"

export type UserMarkerProps = {
   /** Mapboxマップインスタンス */
   map: mapboxgl.Map | null
   /** マップスタイルの読み込み状態 */
   mapStyleLoaded: boolean
   /** ユーザーの位置情報 */
   position: LocationData | null
}

export function UserMarker({
   map,
   mapStyleLoaded,
   position,
}: UserMarkerProps): null {
   // 現在地は DOM マーカーではなくレイヤーで描く。
   // DOM マーカーは常に画面の正面を向くため、傾けた地図から浮いて見えるため。
   useEffect(() => {
      if (!map || !mapStyleLoaded) return

      if (!map.getSource(USER_LOCATION_SOURCE_ID)) {
         map.addSource(USER_LOCATION_SOURCE_ID, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
         })
      }

      for (const layer of USER_LOCATION_LAYERS) {
         if (!map.getLayer(layer.id)) {
            map.addLayer(layer)
         }
      }

      return () => {
         for (const layer of USER_LOCATION_LAYERS) {
            if (map.getLayer(layer.id)) {
               map.removeLayer(layer.id)
            }
         }
         if (map.getSource(USER_LOCATION_SOURCE_ID)) {
            map.removeSource(USER_LOCATION_SOURCE_ID)
         }
      }
   }, [map, mapStyleLoaded])

   // 位置情報が更新されたら現在地を移動
   useEffect(() => {
      if (!map || !mapStyleLoaded) return

      const source = map.getSource(USER_LOCATION_SOURCE_ID)
      if (source?.type !== "geojson") return

      if (!position) {
         source.setData({ type: "FeatureCollection", features: [] })
         return
      }

      source.setData({
         type: "Feature",
         properties: {},
         geometry: {
            type: "Point",
            coordinates: [position.longitude, position.latitude],
         },
      })
      map.setPaintProperty(
         USER_LOCATION_ACCURACY_LAYER_ID,
         "circle-radius",
         createAccuracyRadiusExpression(position.latitude, position.accuracy),
      )
   }, [map, mapStyleLoaded, position])

   return null
}
