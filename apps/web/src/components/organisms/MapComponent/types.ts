/**
 * MapComponent型定義
 */

import type { SoundPin } from "@/store/useSoundPinStore"
import type mapboxgl from "mapbox-gl"
import type { RefObject } from "react"
import type { LocationData } from "./mapbox.types"
import type { LightingConfig } from "./utils/sunCalculations"

export interface MapBounds {
   north: number
   south: number
   east: number
   west: number
}

export type UseMapComponentProps = {
   /** 位置情報取得準備完了時のコールバック */
   onGeolocationReady?: (attemptGeolocation: () => void) => void
   /** 位置に戻る機能準備完了時のコールバック */
   onReturnToLocationReady?: (returnToLocation: () => void) => void
   /** マップ回転時のコールバック */
   onBearingChange?: (bearing: number) => void
}

export type UseMapComponentReturn = {
   /** マップコンテナのref */
   mapContainerRef: RefObject<HTMLDivElement | null>
   /** Mapboxマップインスタンス */
   map: mapboxgl.Map | null
   /** マップスタイルの読み込み状態 */
   mapStyleLoaded: boolean
   /** 統合された位置情報 */
   position: LocationData | null
   /** 現在のライティング設定 */
   currentLighting: LightingConfig | null
   /** デバッグモードの状態 */
   debugMode: boolean
   /** 音声ピンの配列 */
   pins: SoundPin[]
   /** 選択中のピンID */
   selectedPinId: string | null
   /** 位置情報の権限状態 */
   permissionStatus: string
   /** 位置情報取得の初期化状態 */
   geolocateInitialized: boolean
   /** 位置情報取得の試行状態 */
   geolocateAttempted: boolean
   /** デバッグ時間のオーバーライド値 */
   debugTimeOverride: number | null
   /** Mapboxから取得した位置情報かどうか */
   isMapboxPosition: boolean
   /** ピン選択関数 */
   selectPin: (pinId: string | null) => void
   /** デバッグ時間設定関数 */
   setDebugTimeOverride: (time: number | null) => void
   /** ライティング更新関数 */
   updateLightingAndShadows: () => void
}
