"use client"

import type {
   MapBounds,
   NearbyPin,
   NearbyPinsResponse,
} from "@sonory/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"

interface UseNearbyPinsOptions {
   bounds: MapBounds | null
   limit?: number
   categories?: string[]
}

interface UseNearbyPinsResult {
   pins: NearbyPin[]
   isLoading: boolean
   error: Error | null
   refetch: () => void
}

/**
 * Rounds bounds to reduce cache fragmentation and improve hit rates
 */
const roundBounds = (bounds: MapBounds): MapBounds => {
   const precision = 50000 // ~2m precision for ultra-high cache hit rates
   return {
      north: Math.round(bounds.north * precision) / precision,
      south: Math.round(bounds.south * precision) / precision,
      east: Math.round(bounds.east * precision) / precision,
      west: Math.round(bounds.west * precision) / precision,
   }
}

// Request deduplication map
const pendingRequests = new Map<string, Promise<NearbyPin[]>>()

/**
 * Fetches pins from API with ultra-optimized settings and request deduplication
 */
const fetchPinsFromAPI = async (
   bounds: MapBounds,
   limit = 50,
   categories?: string[],
): Promise<NearbyPin[]> => {
   const params = new URLSearchParams({
      north: bounds.north.toString(),
      south: bounds.south.toString(),
      east: bounds.east.toString(),
      west: bounds.west.toString(),
      limit: limit.toString(),
   })

   if (categories && categories.length > 0) {
      for (const category of categories) {
         params.append("categories", category)
      }
   }

   const url = `/api/pins/nearby?${params}`

   // Request deduplication - return existing promise if same request is pending
   if (pendingRequests.has(url)) {
      const existingRequest = pendingRequests.get(url)
      if (existingRequest) {
         return existingRequest
      }
   }

   // AbortController for timeout
   const controller = new AbortController()
   const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒タイムアウト（短縮）

   const requestPromise = (async () => {
      try {
         const response = await fetch(url, {
            signal: controller.signal,
            headers: {
               Accept: "application/json",
               "Cache-Control": "max-age=120", // 2分間キャッシュ
               "Accept-Encoding": "gzip, deflate, br",
            },
         })

         if (!response.ok) {
            throw new Error(`Failed to fetch pins: ${response.statusText}`)
         }

         const data = (await response.json()) as NearbyPinsResponse

         if (!data.success || !data.data) {
            throw new Error("ピン取得結果が不正です")
         }

         return data.data
      } finally {
         clearTimeout(timeoutId)
         // Remove from pending requests
         pendingRequests.delete(url)
      }
   })()

   // Store the promise for deduplication
   pendingRequests.set(url, requestPromise)

   return requestPromise
}

/**
 * Hook for fetching nearby pins with caching
 */
export const useNearbyPins = ({
   bounds,
   limit = 50,
   categories,
}: UseNearbyPinsOptions): UseNearbyPinsResult => {
   // Round bounds for better cache hits
   const roundedBounds = useMemo(
      () => (bounds ? roundBounds(bounds) : null),
      [bounds],
   )

   // Generate cache key
   const queryKey = useMemo(
      () => ["pins", "nearby", roundedBounds, limit, categories],
      [roundedBounds, limit, categories],
   )

   // Main query with ultra-aggressive caching
   const query = useQuery({
      queryKey,
      queryFn: () =>
         roundedBounds
            ? fetchPinsFromAPI(roundedBounds, limit, categories)
            : Promise.resolve([]),
      // 地図の範囲が決まる前に全部 0 の範囲で問い合わせない
      enabled: roundedBounds !== null,
      staleTime: 5 * 60 * 1000, // 5分間 - より長いstale time
      gcTime: 20 * 60 * 1000, // 20分間 - より長いメモリ保持
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1, // リトライ回数をさらに削減
      retryDelay: 300, // リトライ遅延をさらに短縮
      placeholderData: keepPreviousData,
      networkMode: "online",
      // Enable background refetch for better UX
      refetchInterval: 10 * 60 * 1000, // 10分間隔でバックグラウンド更新
      refetchIntervalInBackground: false,
   })

   // Cleanup pending requests on unmount
   useEffect(() => {
      return () => {
         // Clear any pending requests for this component
         pendingRequests.clear()
      }
   }, [])

   return {
      pins: query.data ?? [],
      isLoading: query.isLoading,
      error: query.error,
      refetch: query.refetch,
   }
}
