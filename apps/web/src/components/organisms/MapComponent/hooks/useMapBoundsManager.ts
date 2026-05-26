"use client"

import type mapboxgl from "mapbox-gl"
import { useEffect } from "react"
import type { MapBounds } from "../types"

interface UseMapBoundsManagerOptions {
   map: mapboxgl.Map | null
   mapStyleLoaded: boolean
   setMapBounds: (bounds: MapBounds) => void
}

/**
 * マップ境界の管理（moveend/zoomendイベントでの自動更新）
 */
export function useMapBoundsManager({
   map,
   mapStyleLoaded,
   setMapBounds,
}: UseMapBoundsManagerOptions): void {
   useEffect(() => {
      if (!map || !mapStyleLoaded) return

      let lastBounds: MapBounds | null = null

      const isSignificantChange = (
         oldBounds: MapBounds | null,
         newBounds: MapBounds,
      ): boolean => {
         if (!oldBounds) return true

         const threshold = 0.001
         return (
            Math.abs(oldBounds.north - newBounds.north) > threshold ||
            Math.abs(oldBounds.south - newBounds.south) > threshold ||
            Math.abs(oldBounds.east - newBounds.east) > threshold ||
            Math.abs(oldBounds.west - newBounds.west) > threshold
         )
      }

      const handleMapMove = (): void => {
         const bounds = map.getBounds()
         if (!bounds) return

         const newBounds: MapBounds = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
         }

         if (!isSignificantChange(lastBounds, newBounds)) return

         lastBounds = newBounds
         setMapBounds(newBounds)
      }

      map.on("moveend", handleMapMove)
      map.on("zoomend", handleMapMove)

      setTimeout(() => {
         handleMapMove()
      }, 100)

      return () => {
         map.off("moveend", handleMapMove)
         map.off("zoomend", handleMapMove)
      }
   }, [map, mapStyleLoaded, setMapBounds])
}
