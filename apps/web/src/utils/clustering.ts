/**
 * ピンクラスタリングユーティリティ
 *
 * @description 地図上のピンを距離に基づいてクラスタリングし、
 * 近接するピンをグループ化してバッジ表示する機能を提供
 */

import type mapboxgl from "mapbox-gl"
import type { SoundPin } from "@/store/useSoundPinStore"

/** クラスタリング設定 */
export type ClusteringConfig = {
   /** クラスタリング距離（ピクセル単位） */
   clusterRadius: number
   /** 最小クラスタサイズ */
   minClusterSize: number
   /** 最大ズームレベル（これ以上はクラスタリングしない） */
   maxZoom: number
}

/** クラスタ情報 */
export type PinCluster = {
   /** クラスタID */
   id: string
   /** 中心座標 */
   center: {
      latitude: number
      longitude: number
   }
   /** クラスタに含まれるピンの配列 */
   pins: SoundPin[]
   /** ピン数 */
   count: number
   /** 単一ピンかどうか */
   isSingle: boolean
}

/** デフォルトクラスタリング設定 */
export const DEFAULT_CLUSTERING_CONFIG: ClusteringConfig = {
   clusterRadius: 60, // 60ピクセル以内のピンをクラスタリング
   minClusterSize: 2, // 2個以上でクラスタ化
   maxZoom: 17, // ズームレベル17以上ではクラスタリングしない
}

/**
 * 2点間の距離を計算（ハヴァーサイン公式）
 * @param lat1 - 緯度1
 * @param lng1 - 経度1
 * @param lat2 - 緯度2
 * @param lng2 - 経度2
 * @returns 距離（メートル）
 */
export function calculateDistance(
   lat1: number,
   lng1: number,
   lat2: number,
   lng2: number,
): number {
   const R = 6371e3 // 地球の半径（メートル）
   const φ1 = (lat1 * Math.PI) / 180
   const φ2 = (lat2 * Math.PI) / 180
   const Δφ = ((lat2 - lat1) * Math.PI) / 180
   const Δλ = ((lng2 - lng1) * Math.PI) / 180

   const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

   return R * c
}

/**
 * 地図座標をピクセル座標に変換
 * @param map - Mapboxマップインスタンス
 * @param lat - 緯度
 * @param lng - 経度
 * @returns ピクセル座標
 */
export function latLngToPixel(
   map: mapboxgl.Map,
   lat: number,
   lng: number,
): { x: number; y: number } {
   const point = map.project([lng, lat])
   return { x: point.x, y: point.y }
}

/**
 * ピクセル座標間の距離を計算
 * @param p1 - ピクセル座標1
 * @param p2 - ピクセル座標2
 * @returns ピクセル距離
 */
export function calculatePixelDistance(
   p1: { x: number; y: number },
   p2: { x: number; y: number },
): number {
   const dx = p1.x - p2.x
   const dy = p1.y - p2.y
   return Math.sqrt(dx * dx + dy * dy)
}

/**
 * ピンをクラスタリングする（最適化版）
 * @param pins - ピンの配列
 * @param map - Mapboxマップインスタンス
 * @param config - クラスタリング設定
 * @returns クラスタの配列
 */
export function clusterPins(
   pins: SoundPin[],
   map: mapboxgl.Map,
   config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG,
): PinCluster[] {
   const currentZoom = map.getZoom()

   // 高ズームレベルではクラスタリングしない
   if (currentZoom >= config.maxZoom) {
      return pins.map((pin) => ({
         id: pin.id,
         center: {
            latitude: pin.latitude,
            longitude: pin.longitude,
         },
         pins: [pin],
         count: 1,
         isSingle: true,
      }))
   }

   // ピンが少ない場合は個別表示
   if (pins.length <= 3) {
      return pins.map((pin) => ({
         id: pin.id,
         center: {
            latitude: pin.latitude,
            longitude: pin.longitude,
         },
         pins: [pin],
         count: 1,
         isSingle: true,
      }))
   }

   const clusters: PinCluster[] = []
   const processed = new Set<string>()

   // ピンのピクセル座標を事前計算（最適化）
   const pinPixels = new Map<string, { x: number; y: number }>()
   for (const pin of pins) {
      pinPixels.set(pin.id, latLngToPixel(map, pin.latitude, pin.longitude))
   }

   for (const pin of pins) {
      if (processed.has(pin.id)) continue

      const cluster: PinCluster = {
         id: `cluster-${pin.id}`,
         center: {
            latitude: pin.latitude,
            longitude: pin.longitude,
         },
         pins: [pin],
         count: 1,
         isSingle: true,
      }

      processed.add(pin.id)

      // 現在のピンのピクセル座標を取得
      const pinPixel = pinPixels.get(pin.id)
      if (!pinPixel) continue

      // 他のピンとの距離を計算してクラスタに追加
      for (const otherPin of pins) {
         if (processed.has(otherPin.id)) continue

         const otherPixel = pinPixels.get(otherPin.id)
         if (!otherPixel) continue
         const pixelDistance = calculatePixelDistance(pinPixel, otherPixel)

         if (pixelDistance <= config.clusterRadius) {
            cluster.pins.push(otherPin)
            cluster.count++
            processed.add(otherPin.id)
         }
      }

      // クラスタの中心座標を計算（重心）
      if (cluster.count > 1) {
         const totalLat = cluster.pins.reduce((sum, p) => sum + p.latitude, 0)
         const totalLng = cluster.pins.reduce((sum, p) => sum + p.longitude, 0)

         cluster.center = {
            latitude: totalLat / cluster.count,
            longitude: totalLng / cluster.count,
         }
         cluster.isSingle = false
      }

      // 最小クラスタサイズ以上の場合のみクラスタとして扱う
      if (cluster.count >= config.minClusterSize || cluster.count === 1) {
         clusters.push(cluster)
      }
   }

   return clusters
}
