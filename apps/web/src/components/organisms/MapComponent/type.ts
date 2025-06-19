/**
 * MapComponentのプロパティ型定義
 */
export type MapComponentProps = {
   /** 位置情報取得関数への参照を受け取るコールバック */
   onGeolocationReady?: (triggerGeolocation: () => void) => void
   /** 現在位置に戻る関数への参照を受け取るコールバック */
   onReturnToLocationReady?: (returnToLocation: () => void) => void
   /** マップのbearing（回転角度）が変更された時のコールバック */
   onBearingChange?: (bearing: number) => void
}

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
 * Mapboxマップ初期化時のconfig型定義
 */
export type MapboxMapConfig = {
   config: MapboxStandardStyleConfig
}

/**
 * Mapboxマップ初期化オプションの型定義
 */
export type MapboxMapOptions = {
   container: HTMLElement
   style: string
   center: [number, number]
   zoom: number
   pitch: number
   bearing: number
   antialias: boolean
   config: MapboxStandardStyleConfig
}

/**
 * MapboxのsetStyleメソッドのオプション型定義
 */
export type MapboxSetStyleOptions = {
   config: MapboxStandardStyleConfig
}

/**
 * Mapboxの拡張メソッドを持つMap型
 */
export type MapboxExtendedMap = mapboxgl.Map & {
   setConfigProperty?: (
      namespace: string,
      property: string,
      value: unknown,
   ) => void
   setTerrain?: (config: Record<string, unknown>) => void
   setLight?: (config: MapboxLightConfig) => void
   setFog?: (config: Record<string, unknown>) => void
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
