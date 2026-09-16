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

import mapboxgl from "mapbox-gl"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { createRoot, type Root } from "react-dom/client"
import { ClusterBadge } from "@/components/atoms/ClusterBadge"
import { SoundPinIcon } from "@/components/atoms/SoundPinIcon"
import type { SoundPin } from "@/store/useSoundPinStore"
import { clusterPins, type PinCluster } from "@/utils/clustering"

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
   const rootMapRef = useRef<Map<string, Root>>(new Map())
   const currentClustersRef = useRef<PinCluster[]>([])
   const currentZoomRef = useRef<number>(0)
   const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

   // propsをrefに保存してエフェクト内で安全に使用
   const onPinSelectRef = useRef(onPinSelect)
   const selectedPinIdRef = useRef(selectedPinId)

   // 最新の値を常に保持
   useEffect(() => {
      onPinSelectRef.current = onPinSelect
      selectedPinIdRef.current = selectedPinId
   })

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

         try {
            const markerElement = document.createElement("div")
            markerElement.className = "cluster-marker"
            markerElement.style.cursor = "pointer"

            const root = createRoot(markerElement)
            rootMapRef.current.set(cluster.id, root)

            const handleClick = () => {
               if (cluster.isSingle) {
                  const pin = cluster.pins[0]
                  onPinSelectRef.current(
                     selectedPinIdRef.current === pin.id ? null : pin.id,
                  )
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
               const isSelected = selectedPinIdRef.current === pin.id
               const isAnalyzing =
                  !pin.isPersisted || !pin.classificationResults

               const iconVariant = isSelected
                  ? "active"
                  : isAnalyzing
                    ? "analyzing"
                    : "default"

               root.render(
                  <SoundPinIcon
                     size="medium"
                     variant={iconVariant}
                     onClick={handleClick}
                     animated={true}
                     primaryLabel={pin.primaryLabel}
                     primaryConfidence={pin.primaryConfidence}
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

            return marker
         } catch (error) {
            console.error("クラスタマーカーの作成に失敗:", error)
            return null
         }
      },
      [map],
   )

   /**
    * クラスタが変更されたかどうかを判定
    */
   const clustersChanged = useCallback(
      (newClusters: PinCluster[], oldClusters: PinCluster[]): boolean => {
         if (newClusters.length !== oldClusters.length) {
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
               return true
            }
         }

         return false
      },
      [],
   )

   /**
    * 新規マーカーを作成する
    */
   const createNewMarkers = useCallback(
      (
         newClusters: PinCluster[],
         _existingClusterIds: Set<string>,
      ): Map<string, mapboxgl.Marker> => {
         const newMarkersToAdd = new Map<string, mapboxgl.Marker>()

         for (const cluster of newClusters) {
            const existingMarker = clusterMarkersRef.current.get(cluster.id)

            if (!existingMarker) {
               const marker = createClusterMarker(cluster)
               if (marker) {
                  newMarkersToAdd.set(cluster.id, marker)
               }
            }
         }

         return newMarkersToAdd
      },
      [createClusterMarker],
   )

   /**
    * 既存マーカーの位置を更新する
    */
   const updateExistingMarkerPositions = useCallback(
      (newClusters: PinCluster[]): void => {
         for (const cluster of newClusters) {
            const existingMarker = clusterMarkersRef.current.get(cluster.id)

            if (existingMarker) {
               const currentLngLat = existingMarker.getLngLat()
               const newLng = cluster.center.longitude
               const newLat = cluster.center.latitude

               if (
                  Math.abs(currentLngLat.lng - newLng) > 0.000001 ||
                  Math.abs(currentLngLat.lat - newLat) > 0.000001
               ) {
                  existingMarker.setLngLat([newLng, newLat])
               }
            }
         }
      },
      [],
   )

   /**
    * 不要になったマーカーを削除する
    */
   const removeObsoleteMarkers = useCallback(
      (newClusterIds: Set<string>): void => {
         const existingClusterIds = new Set(clusterMarkersRef.current.keys())

         for (const clusterId of existingClusterIds) {
            if (!newClusterIds.has(clusterId)) {
               const marker = clusterMarkersRef.current.get(clusterId)
               if (marker) {
                  marker.remove()
                  clusterMarkersRef.current.delete(clusterId)
               }

               const root = rootMapRef.current.get(clusterId)
               if (root) {
                  setTimeout(() => {
                     root.unmount()
                  }, 0)
                  rootMapRef.current.delete(clusterId)
               }
            }
         }
      },
      [],
   )

   /**
    * マーカーの差分更新
    */
   const updateMarkersIncremental = useCallback(
      (newClusters: PinCluster[]) => {
         if (!map) return

         // 新しいクラスターが空の場合は処理をスキップ
         if (newClusters.length === 0) {
            return
         }

         const existingClusterIds = new Set(clusterMarkersRef.current.keys())
         const newClusterIds = new Set(newClusters.map((c) => c.id))

         // 既存マーカーの位置更新
         updateExistingMarkerPositions(newClusters)

         // 新規マーカーを作成
         const newMarkersToAdd = createNewMarkers(
            newClusters,
            existingClusterIds,
         )

         // 新規マーカーをマップに追加
         for (const [clusterId, marker] of newMarkersToAdd) {
            clusterMarkersRef.current.set(clusterId, marker)
         }

         // 不要になったマーカーを削除
         removeObsoleteMarkers(newClusterIds)

         currentClustersRef.current = newClusters
      },
      [
         map,
         createNewMarkers,
         updateExistingMarkerPositions,
         removeObsoleteMarkers,
      ],
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

         // クラスタリング実行
         const newClusters = clusterPins(stablePins, map)

         // 前回と比較して変更があるかチェック
         const hasChanges = clustersChanged(
            newClusters,
            currentClustersRef.current,
         )

         // マーカーが存在しない場合は強制的に作成
         const hasNoMarkers = clusterMarkersRef.current.size === 0
         const shouldUpdate =
            hasChanges || isSignificantZoomChange || hasNoMarkers

         if (shouldUpdate) {
            updateMarkersIncremental(newClusters)
         }

         currentZoomRef.current = currentZoom
      }, 100) // 100msのデバウンス
   }, [
      map,
      mapStyleLoaded,
      stablePins,
      clustersChanged,
      updateMarkersIncremental,
   ])

   // ピンデータ変更時の更新（依存配列を最適化）
   // selectedPinIdの変更も含めて、すべての変更をdebouncedUpdateMarkersで処理
   useEffect(() => {
      debouncedUpdateMarkers()
   }, [map, stablePins, mapStyleLoaded, selectedPinId, debouncedUpdateMarkers])

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
   }, [map, mapStyleLoaded, debouncedUpdateMarkers])

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

         for (const root of rootMapRef.current.values()) {
            setTimeout(() => {
               root.unmount()
            }, 0)
         }
         rootMapRef.current.clear()

         currentClustersRef.current = []
      }
   }, [])

   return null
}
