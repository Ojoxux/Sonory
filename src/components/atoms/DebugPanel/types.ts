import type { LocationData } from '@/components/organisms/MapComponent/type'
import type { LightingConfig } from '@/components/organisms/MapComponent/utils/sunCalculations'

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
}
