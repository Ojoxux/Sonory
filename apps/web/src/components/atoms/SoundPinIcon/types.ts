/**
 * SoundPinIconコンポーネントのProps型定義
 */
export interface SoundPinIconProps {
   /** アイコンのサイズ */
   size?: "small" | "medium" | "large"
   /** デザインバリエーション */
   variant?: "default" | "active" | "analyzing"
   /** 追加のCSSクラス */
   className?: string
   /** クリック時のコールバック関数 */
   onClick?: () => void
   /** アニメーション効果の有効/無効 */
   animated?: boolean
   /** 音分類の主要ラベル */
   primaryLabel?: string
   /** 音分類の信頼度 */
   primaryConfidence?: number
}

/**
 * 音分類に対応するSVGアイコン名
 */
export type SoundIconName =
   | "MapPin_default"
   | "MapPin_VehicleRelated"
   | "MapPin_RailwayRelated"
   | "MapPin_MusicRelated"
   | "MapPin_SoundsOfLife"
   | "MapPin_NatureSounds"
   | "MapPin_IndoorSound"
   | "MapPin_ConstructionNoise"
