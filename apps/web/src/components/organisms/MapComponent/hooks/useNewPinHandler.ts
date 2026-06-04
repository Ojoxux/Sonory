"use client"

import { useQueryClient } from "@tanstack/react-query"
import type mapboxgl from "mapbox-gl"
import { useEffect, useRef } from "react"
import type { SoundPin } from "@/store/useSoundPinStore"

interface UseNewPinHandlerOptions {
   map: mapboxgl.Map | null
   mapStyleLoaded: boolean
   lastCreatedPinId: string | null
   allPins: SoundPin[]
}

/**
 * 新しいピンが作成された時のマップ移動とキャッシュ更新
 */
export function useNewPinHandler({
   map,
   mapStyleLoaded,
   lastCreatedPinId,
   allPins,
}: UseNewPinHandlerOptions): void {
   const handledCreatedPinIdRef = useRef<string | null>(null)
   const queryClient = useQueryClient()

   useEffect(() => {
      if (!lastCreatedPinId || !map || !mapStyleLoaded) return

      if (handledCreatedPinIdRef.current === lastCreatedPinId) return

      const newPin = allPins.find((p) => p.id === lastCreatedPinId)

      if (newPin && map) {
         map.flyTo({
            center: [newPin.longitude, newPin.latitude],
            zoom: 18,
            pitch: 50,
            bearing: -20,
            essential: true,
            duration: 1000,
         })

         handledCreatedPinIdRef.current = lastCreatedPinId
      }

      queryClient.invalidateQueries({
         queryKey: ["pins"],
         refetchType: "active",
      })
   }, [lastCreatedPinId, map, mapStyleLoaded, allPins, queryClient])
}
