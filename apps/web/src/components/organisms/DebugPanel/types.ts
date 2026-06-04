import type { LocationData } from "@/components/organisms/MapComponent/mapbox.types"
import type { LightingConfig } from "@/components/organisms/MapComponent/utils/sunCalculations"
import type { UseRealtimeReturn } from "@/hooks/useRealtime"
import type { SoundPin } from "@/store/useSoundPinStore"

/**
 * DebugPanelコンポーネントのProps
 */
export type DebugPanelProps = {
   /** 位置情報データ */
   position: LocationData | null
   /** 位置情報の権限状態 */
   permissionStatus: string
   /** 現在のライティング設定 */
   currentLighting: LightingConfig | null
   /** Mapboxから取得した位置情報かどうか */
   isMapboxPosition: boolean
   /** 位置情報取得の初期化状態 */
   geolocateInitialized: boolean
   /** 位置情報取得の試行状態 */
   geolocateAttempted: boolean
   /** デバッグ時間のオーバーライド値 */
   debugTimeOverride: number | null
   /** 時間変更時のコールバック */
   onTimeChange: (time: number | null) => void
   /** ライティング更新のコールバック */
   onUpdateLighting: () => void
   /** マップインスタンス */
   map?: mapboxgl.Map | null
   /** マップスタイル読み込み状態 */
   mapStyleLoaded?: boolean
   /** 音声ピンデータ */
   pins?: SoundPin[]
   /** リアルタイム接続状態 */
   realtime?: UseRealtimeReturn
}

/**
 * デバッグログの型定義
 */
export type DebugLog = {
   /** ログの一意ID */
   id: string
   /** ログレベル */
   level: "info" | "warn" | "error"
   /** ログメッセージ */
   message: string
   /** タイムスタンプ */
   timestamp: string
}

/**
 * パフォーマンスデータの型定義
 */
export type PerformanceData = {
   /** メモリ使用量（MB） */
   memoryUsage: number
   /** 最後のAI処理時間（ms） */
   lastAIProcessingTime: number
   /** フレームレート（fps） */
   frameRate: number
}

/**
 * DebugPanelのタブ定義
 */
export const DEBUG_TABS = [
   { id: "main", label: "Main" },
   { id: "map", label: "Map" },
   { id: "yamnet", label: "YAMNet" },
   { id: "orb", label: "Orb" },
] as const

/**
 * DebugPanelのタブタイプ
 */
export type TabType = (typeof DEBUG_TABS)[number]["id"]

/**
 * AIAnalysisOrbの設定状態
 */
export type OrbState = {
   /** 色相（0-360度） */
   hue: number
   /** ホバー時の強度（0-1） */
   hoverIntensity: number
   /** ホバー時に回転するかどうか */
   rotateOnHover: boolean
   /** 強制的にホバー状態にするかどうか */
   forceHoverState: boolean
   /** 色相をサイクルするかどうか */
   cycleHue: boolean
   /** 色相サイクルの速度（度/秒） */
   hueCycleSpeed: number
   /** Orbのサイズ（px） */
   size: number
}
