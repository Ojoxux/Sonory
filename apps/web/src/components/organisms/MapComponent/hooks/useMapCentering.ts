"use client"

import type mapboxgl from "mapbox-gl"
import { useCallback, useEffect, useRef } from "react"
import type { GeoJSONLineStringFeature, LocationData } from "../mapbox.types"

interface UseMapCenteringOptions {
   map: mapboxgl.Map | null
   position: LocationData | null
   mapStyleLoaded: boolean
}

interface UseMapCenteringResult {
   resetAutoCentering: () => void
}

/**
 * 位置情報に基づくマップの自動センタリングとユーザーパスの管理
 */
export function useMapCentering({
   map,
   position,
   mapStyleLoaded,
}: UseMapCenteringOptions): UseMapCenteringResult {
   const hasInitialPositionSet = useRef<boolean>(false)
   const userInteractionRef = useRef<boolean>(false)
   const lastInteractionTimeRef = useRef<number>(0)

   const resetAutoCentering = useCallback((): void => {
      userInteractionRef.current = false
      lastInteractionTimeRef.current = 0
   }, [])

   useEffect(() => {
      if (!map) return

      const handleUserInteraction = (): void => {
         userInteractionRef.current = true
         lastInteractionTimeRef.current = Date.now()
      }

      const eventTypes = [
         "dragstart",
         "zoomstart",
         "rotatestart",
         "pitchstart",
         "touchstart",
      ] as const

      for (const eventType of eventTypes) {
         map.on(eventType, handleUserInteraction)
      }

      return () => {
         for (const eventType of eventTypes) {
            map.off(eventType, handleUserInteraction)
         }
         hasInitialPositionSet.current = false
         resetAutoCentering()
      }
   }, [map, resetAutoCentering])

   useEffect(() => {
      if (!map || !position || !mapStyleLoaded) return

      const now = Date.now()
      const timeSinceLastInteraction = now - lastInteractionTimeRef.current
      const shouldAutoCenter =
         !userInteractionRef.current || timeSinceLastInteraction > 30000

      if (!hasInitialPositionSet.current) {
         map.jumpTo({
            center: [position.longitude, position.latitude],
            zoom: 18,
            pitch: 50,
         })
         hasInitialPositionSet.current = true
      } else if (shouldAutoCenter) {
         map.flyTo({
            center: [position.longitude, position.latitude],
            zoom: 18,
            pitch: 50,
            essential: true,
            duration: 2000,
         })
      }

      if (map.getSource("user-path")) {
         const source = map.getSource("user-path") as mapboxgl.GeoJSONSource

         const newCoord: [number, number] = [
            position.longitude,
            position.latitude,
         ]

         const pathData: GeoJSONLineStringFeature = {
            type: "Feature",
            properties: {},
            geometry: {
               type: "LineString",
               coordinates: [newCoord],
            },
         }

         source.setData(pathData)
      }
   }, [map, position, mapStyleLoaded])

   return { resetAutoCentering }
}
