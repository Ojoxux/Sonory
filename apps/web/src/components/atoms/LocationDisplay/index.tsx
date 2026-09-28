"use client"

import { useQuery } from "@tanstack/react-query"
import { memo, useCallback, useMemo } from "react"
import type { LocationDisplayProps } from "./types"

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
   isDarkTime = false,
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

   const textColorClass = isDarkTime ? "text-white" : "text-neutral-900"
   const borderColorClass = isDarkTime ? "border-white" : "border-neutral-900"
   const mutedColorClass = isDarkTime ? "text-white/50" : "text-neutral-500"

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
            className={`transition-opacity duration-menu ease-out ${isLoading ? "opacity-50" : "opacity-100"}`}
         >
            {isLoading ? (
               <div className="flex items-center gap-3">
                  <div
                     className={`h-3 w-3 animate-pulse rounded-full ${isDarkTime ? "bg-white/50" : "bg-neutral-400"}`}
                  />
                  <span
                     className={`font-bold text-5xl tracking-tight ${isDarkTime ? "text-white/50" : "text-neutral-400"}`}
                  >
                     Loading
                  </span>
               </div>
            ) : (
               <div className="inline-block">
                  <h2
                     className={`font-bold text-6xl tracking-tight ${textColorClass} pb-2 leading-none ${isError ? "text-warn-500" : ""}`}
                  >
                     {locationName}
                  </h2>
                  <div
                     className={`h-0.5 w-full ${borderColorClass} border-b-2`}
                  />
                  <p
                     className={`mt-3 font-bold text-sm tracking-wide ${mutedColorClass}`}
                  >
                     {latitude?.toFixed(4)}° N, {longitude?.toFixed(4)}° E
                     {isError && (
                        <span className="ml-2 text-xs text-warn-500">
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
