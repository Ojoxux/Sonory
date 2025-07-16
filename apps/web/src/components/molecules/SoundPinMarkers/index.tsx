/**
 * 音声ピンマーカー管理コンポーネント
 *
 * @description 地図上の音声ピンマーカーの作成・更新・削除を管理
 * クラスタリング機能とパフォーマンス最適化を含む
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

"use client"

import { ClusterBadge } from "@/components/atoms/ClusterBadge"
import { SoundPinIcon } from "@/components/atoms/SoundPinIcon"
import type { SoundPin } from "@/store/useSoundPinStore"
import { type PinCluster, clusterPins } from "@/utils/clustering"
import mapboxgl from "mapbox-gl"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { createRoot } from "react-dom/client"

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
   const clusterMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
   const currentClustersRef = useRef<PinCluster[]>([])
   const currentZoomRef = useRef<number>(0)
   const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

   // ピンデータの安定化（メモ化）
   const stablePins = useMemo(() => {
      return pins.map((pin) => ({
         id: pin.id,
         latitude: pin.latitude,
         longitude: pin.longitude,
         isPersisted: pin.isPersisted,
         audioData: pin.audioData,
         classificationResults: pin.classificationResults,
         recordedAt: pin.recordedAt,
         primaryLabel: pin.primaryLabel,
         primaryConfidence: pin.primaryConfidence,
         weather: pin.weather,
         timeTag: pin.timeTag,
         environment: pin.environment,
      }))
   }, [pins])

   /**
    * クラスタマーカーを作成
    */
   const createClusterMarker = useCallback(
      (cluster: PinCluster): mapboxgl.Marker | null => {
         if (!map) return null

         console.log("🎯 マーカー作成:", {
            clusterId: cluster.id,
            isSingle: cluster.isSingle,
            count: cluster.count,
            center: cluster.center,
            pins: cluster.pins.map((p) => ({
               id: p.id,
               isPersisted: p.isPersisted,
            })),
         })

         try {
            const markerElement = document.createElement("div")
            markerElement.className = "cluster-marker"
            markerElement.style.cursor = "pointer"

            const root = createRoot(markerElement)

            const handleClick = () => {
               if (cluster.isSingle) {
                  const pin = cluster.pins[0]
                  onPinSelect(selectedPinId === pin.id ? null : pin.id)
               } else {
                  const bounds = new mapboxgl.LngLatBounds()
                  for (const pin of cluster.pins) {
                     bounds.extend([pin.longitude, pin.latitude])
                  }
                  map.fitBounds(bounds, { padding: 50, maxZoom: 18 })
               }
            }

            if (cluster.isSingle) {
               const pin = cluster.pins[0]
               const isSelected = selectedPinId === pin.id
               const isAnalyzing =
                  !pin.isPersisted || !pin.classificationResults

               const iconVariant = isSelected
                  ? "active"
                  : isAnalyzing
                    ? "analyzing"
                    : "default"

               console.log("🎨 SoundPinIcon描画:", {
                  clusterId: cluster.id,
                  pinId: pin.id,
                  variant: iconVariant,
                  isSelected,
                  isAnalyzing,
                  isPersisted: pin.isPersisted,
               })

               root.render(
                  <SoundPinIcon
                     size="medium"
                     variant={iconVariant}
                     onClick={handleClick}
                     animated={true}
                  />,
               )
            } else {
               root.render(
                  <ClusterBadge count={cluster.count} onClick={handleClick} />,
               )
            }

            const marker = new mapboxgl.Marker({
               element: markerElement,
               anchor: "center",
            })
               .setLngLat([cluster.center.longitude, cluster.center.latitude])
               .addTo(map)

            console.log("✅ マーカー地図追加完了:", {
               clusterId: cluster.id,
               position: [cluster.center.longitude, cluster.center.latitude],
               element: markerElement,
               addedToMap: true,
               elementVisible: markerElement.style.display !== "none",
               elementInDocument: document.contains(markerElement),
            })

            return marker
         } catch (error) {
            console.error("クラスタマーカーの作成に失敗:", error)
            return null
         }
      },
      [map, selectedPinId, onPinSelect],
   )

   /**
    * クラスタが変更されたかどうかを判定
    */
   const clustersChanged = useCallback(
      (newClusters: PinCluster[], oldClusters: PinCluster[]): boolean => {
         console.log("🔍 クラスタ変更チェック:", {
            newClustersLength: newClusters.length,
            oldClustersLength: oldClusters.length,
         })

         if (newClusters.length !== oldClusters.length) {
            console.log("✅ クラスタ数が変更されました")
            return true
         }

         for (let i = 0; i < newClusters.length; i++) {
            const newCluster = newClusters[i]
            const oldCluster = oldClusters[i]

            if (
               newCluster.count !== oldCluster.count ||
               newCluster.isSingle !== oldCluster.isSingle ||
               Math.abs(
                  newCluster.center.latitude - oldCluster.center.latitude,
               ) > 0.000001 ||
               Math.abs(
                  newCluster.center.longitude - oldCluster.center.longitude,
               ) > 0.000001
            ) {
               console.log("✅ クラスタ内容が変更されました:", {
                  index: i,
                  newCount: newCluster.count,
                  oldCount: oldCluster.count,
                  newIsSingle: newCluster.isSingle,
                  oldIsSingle: oldCluster.isSingle,
                  latDiff: Math.abs(
                     newCluster.center.latitude - oldCluster.center.latitude,
                  ),
                  lngDiff: Math.abs(
                     newCluster.center.longitude - oldCluster.center.longitude,
                  ),
               })
               return true
            }
         }

         console.log("❌ クラスタに変更はありません")
         return false
      },
      [],
   )

   /**
    * マーカーの差分更新
    */
   const updateMarkersIncremental = useCallback(
      (newClusters: PinCluster[]) => {
         if (!map) return

         const existingClusterIds = new Set(clusterMarkersRef.current.keys())
         const newClusterIds = new Set(newClusters.map((c) => c.id))

         // 削除されたマーカーを削除
         for (const clusterId of existingClusterIds) {
            if (!newClusterIds.has(clusterId)) {
               const marker = clusterMarkersRef.current.get(clusterId)
               if (marker) {
                  marker.remove()
                  clusterMarkersRef.current.delete(clusterId)
               }
            }
         }

         // 新規・更新マーカーを処理
         for (const cluster of newClusters) {
            const existingMarker = clusterMarkersRef.current.get(cluster.id)

            if (!existingMarker) {
               // 新規マーカー作成
               console.log("🆕 新規マーカー作成開始:", {
                  clusterId: cluster.id,
               })
               const marker = createClusterMarker(cluster)
               if (marker) {
                  clusterMarkersRef.current.set(cluster.id, marker)
                  console.log("✅ 新規マーカー作成完了:", {
                     clusterId: cluster.id,
                  })
               } else {
                  console.error("❌ 新規マーカー作成失敗:", {
                     clusterId: cluster.id,
                  })
               }
            } else {
               // 既存マーカーの位置更新
               const currentLngLat = existingMarker.getLngLat()
               const newLng = cluster.center.longitude
               const newLat = cluster.center.latitude

               if (
                  Math.abs(currentLngLat.lng - newLng) > 0.000001 ||
                  Math.abs(currentLngLat.lat - newLat) > 0.000001
               ) {
                  console.log("🔄 既存マーカー位置更新:", {
                     clusterId: cluster.id,
                     from: [currentLngLat.lng, currentLngLat.lat],
                     to: [newLng, newLat],
                  })
                  existingMarker.setLngLat([newLng, newLat])
               }
            }
         }

         currentClustersRef.current = newClusters
      },
      [map, createClusterMarker],
   )

   /**
    * デバウンス付きマーカー更新
    */
   const debouncedUpdateMarkers = useCallback(() => {
      if (!map || !mapStyleLoaded) return

      // 既存のタイマーをクリア
      if (updateTimeoutRef.current) {
         clearTimeout(updateTimeoutRef.current)
      }

      updateTimeoutRef.current = setTimeout(() => {
         const currentZoom = map.getZoom()

         // ズームレベルが大きく変わっていない場合は、軽量な更新のみ
         const zoomDiff = Math.abs(currentZoom - currentZoomRef.current)
         const isSignificantZoomChange = zoomDiff > 0.5

         console.log("🎯 マーカー更新:", {
            currentZoom,
            previousZoom: currentZoomRef.current,
            zoomDiff,
            isSignificantZoomChange,
            pinsCount: stablePins.length,
            pins: stablePins.map((pin) => ({
               id: pin.id,
               lat: pin.latitude,
               lng: pin.longitude,
               isPersisted: pin.isPersisted,
            })),
         })

         // クラスタリング実行
         const newClusters = clusterPins(stablePins, map)

         // 地図の現在の境界を取得
         const mapBounds = map.getBounds()
         const boundsInfo = mapBounds
            ? {
                 north: mapBounds.getNorth(),
                 south: mapBounds.getSouth(),
                 east: mapBounds.getEast(),
                 west: mapBounds.getWest(),
              }
            : null

         console.log("🗂️ クラスタリング結果:", {
            clustersCount: newClusters.length,
            mapBounds: boundsInfo,
            clusters: newClusters.map((cluster) => ({
               id: cluster.id,
               count: cluster.count,
               isSingle: cluster.isSingle,
               center: cluster.center,
               inBounds: boundsInfo
                  ? cluster.center.latitude >= boundsInfo.south &&
                    cluster.center.latitude <= boundsInfo.north &&
                    cluster.center.longitude >= boundsInfo.west &&
                    cluster.center.longitude <= boundsInfo.east
                  : "unknown",
               pins: cluster.pins.map((p) => ({
                  id: p.id,
                  isPersisted: p.isPersisted,
               })),
            })),
         })

         // 前回と比較して変更があるかチェック
         const hasChanges = clustersChanged(
            newClusters,
            currentClustersRef.current,
         )

         // マーカーが存在しない場合は強制的に作成
         const hasNoMarkers = clusterMarkersRef.current.size === 0
         const shouldUpdate =
            hasChanges || isSignificantZoomChange || hasNoMarkers

         console.log("🔍 マーカー更新判定:", {
            hasChanges,
            isSignificantZoomChange,
            hasNoMarkers,
            shouldUpdate,
            existingMarkersCount: clusterMarkersRef.current.size,
            clustersCount: newClusters.length,
         })

         if (shouldUpdate) {
            console.log("🔄 クラスタリング更新:", {
               clustersCount: newClusters.length,
               hasChanges,
               isSignificantZoomChange,
               hasNoMarkers,
               existingMarkersCount: clusterMarkersRef.current.size,
            })

            updateMarkersIncremental(newClusters)

            console.log("📌 マーカー更新後:", {
               totalMarkersCount: clusterMarkersRef.current.size,
               markerIds: Array.from(clusterMarkersRef.current.keys()),
            })
         } else {
            console.log("⏭️ クラスタリング更新スキップ: 変更なし")
         }

         currentZoomRef.current = currentZoom
      }, 50) // 100msのデバウンス
   }, [
      map,
      mapStyleLoaded,
      stablePins,
      clustersChanged,
      updateMarkersIncremental,
   ])

   /**
    * 選択状態変更時のマーカー更新（軽量）
    */
   const updateSelectedMarkers = useCallback(() => {
      if (!map || !mapStyleLoaded) return

      // 選択状態が変わった場合は、マーカーを再作成
      // SoundPinIconはvariantによって見た目が変わるため
      const _currentZoom = map.getZoom()
      const newClusters = clusterPins(stablePins, map)

      // 変更があるかチェック
      const hasChanges = clustersChanged(
         newClusters,
         currentClustersRef.current,
      )

      if (hasChanges) {
         updateMarkersIncremental(newClusters)
      }
   }, [
      map,
      mapStyleLoaded,
      selectedPinId,
      stablePins,
      clustersChanged,
      updateMarkersIncremental,
   ])

   // ピンデータ変更時の更新（依存配列を最適化）
   useEffect(() => {
      console.log("🔄 ピンデータ変更検知:", {
         pinsCount: stablePins.length,
         mapReady: !!map,
         styleLoaded: mapStyleLoaded,
         existingMarkers: clusterMarkersRef.current.size,
      })
      debouncedUpdateMarkers()
   }, [stablePins, mapStyleLoaded]) // 依存配列を簡素化

   // 選択状態変更時の軽量更新
   useEffect(() => {
      updateSelectedMarkers()
   }, [selectedPinId]) // 依存配列を最適化

   // ズームイベントの最適化
   useEffect(() => {
      if (!map || !mapStyleLoaded) return

      const handleZoomEnd = () => {
         debouncedUpdateMarkers()
      }

      // ズーム終了時のみ更新（ズーム中は更新しない）
      map.on("zoomend", handleZoomEnd)

      return () => {
         map.off("zoomend", handleZoomEnd)
      }
   }, [map, mapStyleLoaded]) // debouncedUpdateMarkersを依存配列から除外

   // クリーンアップ
   useEffect(() => {
      return () => {
         if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
         }

         for (const marker of clusterMarkersRef.current.values()) {
            marker.remove()
         }
         clusterMarkersRef.current.clear()
         currentClustersRef.current = []
      }
   }, [])

   return null
}
