/**
 * MapComponentのプロパティ型定義
 */
export type MapComponentProps = Record<string, never>

/**
 * 位置情報の型定義
 */
export type LocationData = {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

/**
 * Mapbox Standard Style設定プロパティの型定義
 */
export type MapboxStandardStyleConfig = {
  basemap: {
    lightPreset: 'day' | 'dawn' | 'dusk' | 'night'
    showPlaceLabels: boolean
    showPointOfInterestLabels: boolean
    showRoadLabels: boolean
    showTransitLabels: boolean
  }
}

/**
 * Mapbox Light設定の型定義
 */
export type MapboxLightConfig = {
  anchor: 'map' | 'viewport'
  position: [number, number, number]
  color: string
  intensity: number
}

/**
 * GeoJSONソースのデータ型
 */
export type GeoJSONLineStringFeature = {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: {
    type: 'LineString'
    coordinates: Array<[number, number]>
  }
}

/**
 * Mapboxの非標準メソッドを安全に呼び出すためのヘルパー型
 */
export type MapboxNonStandardMethods = {
  setConfigProperty: (
    map: mapboxgl.Map,
    namespace: keyof MapboxStandardStyleConfig,
    property: string,
    value: unknown,
  ) => void
  setTerrain: (map: mapboxgl.Map, config: Record<string, unknown>) => void
  setLight: (map: mapboxgl.Map, config: MapboxLightConfig) => void
  setFog: (map: mapboxgl.Map, config: Record<string, unknown>) => void
}
