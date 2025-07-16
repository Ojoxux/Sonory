"use client"

import { useQuery } from "@tanstack/react-query"
import { memo, useCallback, useMemo } from "react"
import type { LocationDisplayProps } from "./type"

/**
 * 位置情報表示コンポーネント
 *
 * @description
 * 緯度・経度を基に逆ジオコーディングで地名を取得し表示する
 * React Queryを使用してキャッシュと再取得を最適化
 *
 * @example
 * ```tsx
 * <LocationDisplay
 *   latitude={35.6762}
 *   longitude={139.6503}
 * />
 * ```
 */
const LocationDisplayComponent = function LocationDisplay({
   latitude,
   longitude,
   className = "",
   debugTimeOverride = null,
}: LocationDisplayProps) {
   // 座標を丸めてキャッシュキーを生成（精度を下げてキャッシュヒット率を上げる）
   const roundedLat = useMemo(
      () => (latitude ? Math.round(latitude * 500) / 500 : null),
      [latitude],
   )
   const roundedLon = useMemo(
      () => (longitude ? Math.round(longitude * 500) / 500 : null),
      [longitude],
   )

   // 時間帯をチェック
   const isDarkTime = useMemo(() => {
      const EVENING_START_HOUR = 17
      const MORNING_END_HOUR = 5
      const hour =
         debugTimeOverride !== null ? debugTimeOverride : new Date().getHours()
      return hour >= EVENING_START_HOUR || hour < MORNING_END_HOUR
   }, [debugTimeOverride])

   // クエリキーを安定化
   const queryKey = useMemo(
      () => ["location", roundedLat, roundedLon],
      [roundedLat, roundedLon],
   )

   // クエリ関数を安定化
   const queryFn = useCallback(async () => {
      if (!latitude || !longitude) return ""

      const response = await fetch(
         `/api/geocoding/reverse?lat=${latitude}&lon=${longitude}&lang=en`,
         {
            headers: {
               Accept: "application/json",
               "Cache-Control": "max-age=3600", // 1時間キャッシュ
            },
         },
      )

      if (!response.ok) {
         throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
         throw new Error(data.error)
      }

      return data.locationName || ""
   }, [latitude, longitude])

   // enabledフラグを安定化
   const enabled = useMemo(
      () => !!(latitude && longitude),
      [latitude, longitude],
   )

   // React Queryで逆ジオコーディングを実行（超積極的キャッシュ）
   const {
      data: locationName,
      isLoading,
      isError,
   } = useQuery({
      queryKey,
      queryFn,
      // 2時間キャッシュ（大幅延長）
      staleTime: 2 * 60 * 60 * 1000,
      // 4時間キャッシュを保持
      gcTime: 4 * 60 * 60 * 1000,
      // 座標が有効な場合のみクエリを実行
      enabled,
      // エラー時の再試行を無効化
      retry: false,
      // 各種自動再取得を無効化
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      // ネットワークモード
      networkMode: "online",
   })

   // 時間帯に応じたスタイル
   const textColorClass = useMemo(
      () => (isDarkTime ? "text-white" : "text-gray-900"),
      [isDarkTime],
   )
   const borderColorClass = useMemo(
      () => (isDarkTime ? "border-white" : "border-gray-900"),
      [isDarkTime],
   )

   // 位置情報がない場合は何も表示しない
   const hasValidPosition = useMemo(
      () => !!(latitude && longitude),
      [latitude, longitude],
   )

   if (!hasValidPosition) {
      return null
   }

   return (
      <div className={`relative ${className}`}>
         <div
            className={`transition-all duration-500 ${isLoading ? "opacity-50" : "opacity-100"}`}
         >
            {isLoading ? (
               <div className="flex items-center gap-3">
                  <div
                     className={`h-3 w-3 animate-pulse rounded-full ${isDarkTime ? "bg-white/50" : "bg-gray-400"}`}
                  />
                  <span
                     className={`font-arial-rounded-mt-pro font-bold text-5xl tracking-tight ${isDarkTime ? "text-white/50" : "text-gray-400"}`}
                  >
                     Loading
                  </span>
               </div>
            ) : (
               <div className="inline-block">
                  <h2
                     className={`font-arial-rounded-mt-pro font-bold text-6xl tracking-tight ${textColorClass} pb-2 leading-none ${isError ? "text-yellow-500" : ""}`}
                  >
                     {locationName}
                  </h2>
                  <div
                     className={`h-0.5 w-full ${borderColorClass} border-b-2`}
                  />
                  <p
                     className={`mt-3 font-arial-rounded-mt-pro font-bold text-sm tracking-wide ${isDarkTime ? "text-white/50" : "text-gray-500"}`}
                  >
                     {latitude?.toFixed(4)}° N, {longitude?.toFixed(4)}° E
                     {isError && (
                        <span className="ml-2 text-xs text-yellow-500">
                           (位置情報取得エラー)
                        </span>
                     )}
                  </p>
               </div>
            )}
         </div>
      </div>
   )
}

export const LocationDisplay = memo(LocationDisplayComponent)
