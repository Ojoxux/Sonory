/**
 * マップ状態管理フック
 */

import { useState } from "react"
import type mapboxgl from "mapbox-gl"
import type { MapBounds } from "../types"

export interface UseMapStateReturn {
	map: mapboxgl.Map | null
	setMap: (map: mapboxgl.Map | null) => void
	mapStyleLoaded: boolean
	setMapStyleLoaded: (loaded: boolean) => void
	mapBounds: MapBounds | null
	setMapBounds: (bounds: MapBounds | null) => void
	geolocateInitialized: boolean
	setGeolocateInitialized: (initialized: boolean) => void
}

/**
 * マップの基本状態を管理するフック
 * @returns マップ状態とsetter群
 */
export const useMapState = (): UseMapStateReturn => {
	const [map, setMap] = useState<mapboxgl.Map | null>(null)
	const [mapStyleLoaded, setMapStyleLoaded] = useState<boolean>(false)
	const [geolocateInitialized, setGeolocateInitialized] =
		useState<boolean>(false)
	const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)

	return {
		map,
		setMap,
		mapStyleLoaded,
		setMapStyleLoaded,
		mapBounds,
		setMapBounds,
		geolocateInitialized,
		setGeolocateInitialized,
	}
}
