"use client"

import type { SoundPinAPI } from "@sonory/shared-types"
import {
   keepPreviousData,
   useQuery,
   useQueryClient,
} from "@tanstack/react-query"
import { useCallback, useEffect, useEffectEvent, useMemo, useRef } from "react"

interface MapBounds {
   north: number
   south: number
   east: number
   west: number
}

interface UseNearbyPinsOptions {
   bounds: MapBounds
   limit?: number
   categories?: string[]
}

interface UseNearbyPinsResult {
   pins: SoundPinAPI[]
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

/**
 * Generates adjacent bounds for prefetching
 */
const generateAdjacentBounds = (bounds: MapBounds): MapBounds[] => {
   const latDiff = bounds.north - bounds.south
   const lngDiff = bounds.east - bounds.west

   const adjacent: MapBounds[] = []

   // Generate 8 adjacent areas (north, south, east, west, and 4 corners)
   const offsets = [
      { lat: latDiff, lng: 0 }, // North
      { lat: -latDiff, lng: 0 }, // South
      { lat: 0, lng: lngDiff }, // East
      { lat: 0, lng: -lngDiff }, // West
      { lat: latDiff, lng: lngDiff }, // Northeast
      { lat: latDiff, lng: -lngDiff }, // Northwest
      { lat: -latDiff, lng: lngDiff }, // Southeast
      { lat: -latDiff, lng: -lngDiff }, // Southwest
   ]

   for (const offset of offsets) {
      adjacent.push({
         north: bounds.north + offset.lat,
         south: bounds.south + offset.lat,
         east: bounds.east + offset.lng,
         west: bounds.west + offset.lng,
      })
   }

   return adjacent
}

// Request deduplication map
const pendingRequests = new Map<string, Promise<SoundPinAPI[]>>()

/**
 * Fetches pins from API with ultra-optimized settings and request deduplication
 */
const fetchPinsFromAPI = async (
   bounds: MapBounds,
   limit = 50,
   categories?: string[],
): Promise<SoundPinAPI[]> => {
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

         const data = await response.json()
         return data.data || []
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
 * Hook for fetching nearby pins with ultra-optimized caching and prefetching
 */
export const useNearbyPins = ({
   bounds,
   limit = 50,
   categories,
}: UseNearbyPinsOptions): UseNearbyPinsResult => {
   const queryClient = useQueryClient()

   // Round bounds for better cache hits
   const roundedBounds = useMemo(() => roundBounds(bounds), [bounds])

   // Generate cache key
   const queryKey = useMemo(
      () => ["pins", "nearby", roundedBounds, limit, categories],
      [roundedBounds, limit, categories],
   )

   // Track prefetch status to avoid duplicate prefetches
   const prefetchStatusRef = useRef<Set<string>>(new Set())

   // Main query with ultra-aggressive caching
   const query = useQuery({
      queryKey,
      queryFn: () => fetchPinsFromAPI(roundedBounds, limit, categories),
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

   // Ultra-aggressive prefetching with intelligent deduplication
   const prefetchAdjacentAreas = useCallback(async () => {
      const adjacentBounds = generateAdjacentBounds(roundedBounds)

      // Filter out already prefetched areas
      const boundsToPreftch = adjacentBounds.filter((bound) => {
         const key = JSON.stringify(bound)
         return !prefetchStatusRef.current.has(key)
      })

      if (boundsToPreftch.length === 0) return

      // Mark as prefetching
      for (const bound of boundsToPreftch) {
         prefetchStatusRef.current.add(JSON.stringify(bound))
      }

      // Batch prefetch requests with smaller batches for better performance
      const batchSize = 2 // Smaller batch size for faster response
      for (let i = 0; i < boundsToPreftch.length; i += batchSize) {
         const batch = boundsToPreftch.slice(i, i + batchSize)

         // Process batch in parallel
         const prefetchPromises = batch.map(async (adjacentBound) => {
            const adjacentKey = [
               "pins",
               "nearby",
               adjacentBound,
               limit,
               categories,
            ]

            // Only prefetch if not already cached or stale
            const existingData = queryClient.getQueryData(adjacentKey)

            if (!existingData) {
               return queryClient.prefetchQuery({
                  queryKey: adjacentKey,
                  queryFn: () =>
                     fetchPinsFromAPI(adjacentBound, limit, categories),
                  staleTime: 5 * 60 * 1000,
                  gcTime: 20 * 60 * 1000,
               })
            }
            return Promise.resolve()
         })

         await Promise.allSettled(prefetchPromises)

         // Minimal delay between batches
         if (i + batchSize < boundsToPreftch.length) {
            await new Promise((resolve) => setTimeout(resolve, 25))
         }
      }

      // Clean up prefetch status after some time
      setTimeout(() => {
         for (const bound of boundsToPreftch) {
            prefetchStatusRef.current.delete(JSON.stringify(bound))
         }
      }, 60000) // 1分後にクリーンアップ
   }, [roundedBounds, limit, categories, queryClient])

   // Prefetch adjacent areas when bounds change (with minimal debouncing)
   const prefetchEvent = useEffectEvent(() => {
      const timer = setTimeout(() => {
         prefetchAdjacentAreas().catch(console.error)
      }, 100) // Reduced debounce time
      return () => clearTimeout(timer)
   })

   // biome-ignore lint/correctness/useExhaustiveDependencies(prefetchEvent): prefetchEvent は useEffectEvent でラップされているため依存配列に含めない（React公式ドキュメント推奨）
   useEffect(() => {
      // Only prefetch if main query is successful
      if (query.isSuccess) {
         const cleanup = prefetchEvent()
         return cleanup
      }
   }, [query.isSuccess])

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
