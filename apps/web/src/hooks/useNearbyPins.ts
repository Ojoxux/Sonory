"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { MapBounds, SoundPin } from "@/store/useSoundPinStore"
import { useSoundPinStore } from "@/store/useSoundPinStore"
import { useMemo, useCallback } from "react"

/**
 * 近隣のピンを取得するカスタムフック
 * React Queryを使用してピンデータをキャッシュし、効率的な取得を行う
 */
export const useNearbyPins = (bounds: MapBounds | null) => {
   const { pins: localPins, persistedPins, tempPins } = useSoundPinStore()
   const queryClient = useQueryClient()

   // デバッグ情報
   const boundsExists = !!bounds
   const enabledAndBounds = boundsExists

   console.log("🔍 useNearbyPins: フック開始", {
      bounds,
      enabled: enabledAndBounds,
      boundsExists,
      enabledAndBounds,
      boundsDetail: bounds ? {
         north: bounds.north.toFixed(4),
         south: bounds.south.toFixed(4),
         east: bounds.east.toFixed(4),
         west: bounds.west.toFixed(4),
      } : null,
   })

   // React Queryでピンを取得
   const query = useQuery({
      queryKey: ["nearby-pins", bounds],
      queryFn: async (): Promise<SoundPin[]> => {
         if (!bounds) {
            console.log("🔍 useNearbyPins: 境界がnullのため空配列を返す")
            return []
         }

         console.log("🔍 useNearbyPins: APIリクエスト開始", {
            bounds: {
               north: bounds.north.toFixed(4),
               south: bounds.south.toFixed(4),
               east: bounds.east.toFixed(4),
               west: bounds.west.toFixed(4),
            },
         })

         const params = new URLSearchParams({
            north: bounds.north.toString(),
            south: bounds.south.toString(),
            east: bounds.east.toString(),
            west: bounds.west.toString(),
         })

         const response = await fetch(`/api/pins/nearby?${params}`)

         if (!response.ok) {
            console.error("🔍 useNearbyPins: APIエラー", {
               status: response.status,
               statusText: response.statusText,
            })
            throw new Error(`Failed to fetch pins: ${response.status}`)
         }

         const data = await response.json()

         console.log("🔍 useNearbyPins: APIレスポンス", {
            success: data.success,
            dataLength: data.data?.length || 0,
            rawData: data.data,
            firstItem: data.data?.[0] ? {
               id: data.data[0].id,
               location: data.data[0].location,
               audio: data.data[0].audio,
               createdAt: data.data[0].createdAt,
               hasAiAnalysis: !!data.data[0].aiAnalysis,
               allKeys: Object.keys(data.data[0]),
               fullObject: data.data[0],
            } : null,
         })

         if (!data.success) {
            throw new Error(data.error || "Failed to fetch pins")
         }

         // APIから取得したピンをSoundPin形式に変換
         const apiPins: SoundPin[] = (data.data || []).map((pinData: any, index: number) => {
            try {
               console.log(`🔍 useNearbyPins: ピン${index}変換開始`, {
                  id: pinData.id,
                  location: pinData.location,
                  audio: pinData.audio,
                  createdAt: pinData.createdAt,
                  aiAnalysis: pinData.aiAnalysis,
               })

               const transformed = {
                  id: pinData.id,
                  latitude: pinData.location?.lat || 0,
                  longitude: pinData.location?.lng || 0,
                  audioData: {
                     url: pinData.audio?.url || "",
                     recordedAt: new Date(pinData.createdAt),
                     id: pinData.id,
                     blob: new Blob(), // 空のBlob
                  },
                  classificationResults: pinData.aiAnalysis?.allClassifications || [],
                  recordedAt: new Date(pinData.createdAt),
                  primaryLabel: pinData.aiAnalysis?.categories?.topic || "不明",
                  primaryConfidence: pinData.aiAnalysis?.categories?.confidence || 0,
                  isPersisted: true,
                  timeTag: pinData.timeTag || "不明",
                  environment: pinData.aiAnalysis?.environment || "unknown",
                  weather: pinData.weather,
               }

               console.log(`🔍 useNearbyPins: ピン${index}変換成功`, {
                  id: transformed.id,
                  lat: transformed.latitude,
                  lng: transformed.longitude,
                  primaryLabel: transformed.primaryLabel,
               })

               return transformed
            } catch (error) {
               console.error(`🔍 useNearbyPins: ピン${index}変換エラー`, { pin: pinData, error })
               return null
            }
         }).filter((pin: SoundPin | null): pin is SoundPin => pin !== null)

         console.log("🔍 useNearbyPins: 変換されたAPIピン", {
            apiPinsLength: apiPins.length,
            apiPins: apiPins.map((pin: SoundPin) => ({
               id: pin.id,
               lat: pin.latitude.toFixed(4),
               lng: pin.longitude.toFixed(4),
               isPersisted: pin.isPersisted,
               primaryLabel: pin.primaryLabel,
            })),
         })

         return apiPins
      },
      enabled: enabledAndBounds, // 境界が設定されていればクエリを実行
      staleTime: 5 * 60 * 1000, // 5分間キャッシュ
      gcTime: 10 * 60 * 1000, // 10分間メモリに保持
      retry: 1,
      refetchOnWindowFocus: false,
   })

   // ローカルピンとAPIピンを統合
   const allPins = useMemo(() => {
      const apiPins = query.data || []
      const combined = [...localPins, ...persistedPins, ...tempPins, ...apiPins]

      // 重複を除去（IDベース）
      const uniquePins = combined.filter(
         (pin, index, array) => array.findIndex((p) => p.id === pin.id) === index,
      )

      console.log("🔍 useNearbyPins: ピン統合", {
         localPins: localPins.length,
         persistedPins: persistedPins.length,
         tempPins: tempPins.length,
         apiPins: apiPins.length,
         combined: combined.length,
         uniquePins: uniquePins.length,
      })

      return uniquePins
   }, [localPins, persistedPins, tempPins, query.data])

   // 再取得関数
   const refetch = useCallback(() => {
      console.log("🔍 useNearbyPins: 手動再取得実行")
      return query.refetch()
   }, [query.refetch])

   // 無効化関数
   const invalidate = useCallback(() => {
      console.log("🔍 useNearbyPins: キャッシュ無効化実行")
      queryClient.invalidateQueries({ queryKey: ["nearby-pins"] })
   }, [queryClient])

   console.log("🔍 useNearbyPins: 最終的なピン", {
      queryEnabled: enabledAndBounds,
      queryStatus: query.status,
      queryIsPending: query.isPending,
      queryIsLoading: query.isLoading,
      queryIsError: query.isError,
      queryError: query.error?.message,
      apiPins: query.data?.length || 0,
      totalPins: allPins.length,
      localPins: localPins.length,
      persistedPins: persistedPins.length,
      tempPins: tempPins.length,
      boundsForQuery: bounds ? {
         north: bounds.north.toFixed(4),
         south: bounds.south.toFixed(4),
         east: bounds.east.toFixed(4),
         west: bounds.west.toFixed(4),
      } : null,
   })

   return {
      pins: allPins,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch,
      invalidate,
   }
} 