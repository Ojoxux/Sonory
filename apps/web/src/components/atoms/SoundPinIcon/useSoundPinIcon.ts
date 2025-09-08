import type { SoundIconName } from "./types"

/**
 * アイコンのサイズ設定
 */
const sizeConfig = {
   small: {
      container: "w-10 h-10", // 8x8 → 10x10
      icon: "w-4 h-4", // 3x3 → 4x4
      ripple: "w-16 h-16", // 12x12 → 16x16
   },
   medium: {
      container: "w-14 h-14", // 10x10 → 14x14
      icon: "w-6 h-6", // 4x4 → 6x6
      ripple: "w-20 h-20", // 16x16 → 20x20
   },
   large: {
      container: "w-16 h-16", // 12x12 → 16x16
      icon: "w-7 h-7", // 5x5 → 7x7
      ripple: "w-24 h-24", // 20x20 → 24x24
   },
} as const

/**
 * バリアントのスタイル設定
 */
const variantConfig = {
   default: {
      bg: "",
      border: "",
      shadow: "",
      icon: "text-gray-800",
   },
   active: {
      bg: "",
      border: "border-2 border-green-400",
      shadow: "",
      icon: "text-green-600",
   },
   analyzing: {
      bg: "",
      border: "",
      shadow: "",
      icon: "text-orange-600",
   },
} as const

/**
 * 音分類結果に応じたアイコンを決定する
 *
 * @param primaryLabel - 音分類の主要ラベル
 * @returns 分類に対応するアイコン名を含むオブジェクト
 */
function getClassificationStyle(primaryLabel?: string): {
   iconName: SoundIconName
} {
   const label = primaryLabel?.toLowerCase() || ""

   // 車両・交通関連
   if (
      label.includes("車の音") ||
      label.includes("car") ||
      label.includes("vehicle") ||
      label.includes("バイクの音") ||
      label.includes("motorcycle") ||
      label.includes("bike") ||
      label.includes("トラックの音") ||
      label.includes("truck") ||
      label.includes("バスの音") ||
      label.includes("bus")
   ) {
      return {
         iconName: "MapPin_VehicleRelated",
      }
   }

   // 鉄道関連
   if (
      label.includes("電車の音") ||
      label.includes("train") ||
      label.includes("Rail transport") ||
      label.includes("Train horn") ||
      label.includes("Railroad car, train wagon")
   ) {
      return {
         iconName: "MapPin_RailwayRelated",
      }
   }

   // 音楽関連
   if (
      label.includes("音楽") ||
      label.includes("music") ||
      label.includes("song") ||
      label.includes("楽器") ||
      label.includes("instrument")
   ) {
      return {
         iconName: "MapPin_MusicRelated",
      }
   }

   // 生活音・人の声
   if (
      label.includes("人の声") ||
      label.includes("speech") ||
      label.includes("voice") ||
      label.includes("話し声") ||
      label.includes("会話") ||
      label.includes("生活") ||
      label.includes("life")
   ) {
      return {
         iconName: "MapPin_SoundsOfLife",
      }
   }

   // 自然音
   if (
      label.includes("鳥の鳴き声") ||
      label.includes("bird") ||
      label.includes("Chirp, tweet") ||
      label.includes("雨音") ||
      label.includes("rain") ||
      label.includes("風の音") ||
      label.includes("wind") ||
      label.includes("Wind noise (microphone)") ||
      label.includes("水の音") ||
      label.includes("Water") ||
      label.includes("Stream") ||
      label.includes("雷の音") ||
      label.includes("Thunder") ||
      label.includes("Thunderstorm")
   ) {
      return {
         iconName: "MapPin_NatureSounds",
      }
   }

   // 室内・建物音
   if (
      label.includes("建物") ||
      label.includes("building") ||
      label.includes("室内") ||
      label.includes("indoor") ||
      label.includes("オフィス") ||
      label.includes("office") ||
      label.includes("家") ||
      label.includes("home")
   ) {
      return {
         iconName: "MapPin_IndoorSound",
      }
   }

   // 工事・作業音
   if (
      label.includes("工事") ||
      label.includes("construction") ||
      label.includes("建設") ||
      label.includes("作業") ||
      label.includes("work") ||
      label.includes("機械") ||
      label.includes("machine")
   ) {
      return {
         iconName: "MapPin_ConstructionNoise",
      }
   }

   // デフォルト
   return {
      iconName: "MapPin_default",
   }
}

/**
 * 指定されたサイズに対応する設定を取得する
 *
 * @param size - アイコンのサイズ
 * @returns サイズに対応する設定オブジェクト
 */
function getCurrentSize(size: string) {
   return sizeConfig[size as keyof typeof sizeConfig]
}

/**
 * 指定されたバリアントに対応する設定を取得する
 *
 * @param variant - アイコンのバリアント
 * @returns バリアントに対応する設定オブジェクト
 */
function getCurrentVariant(variant: string) {
   return variantConfig[variant as keyof typeof variantConfig]
}

/**
 * 音声ピンアイコンのロジックを提供するカスタムフック
 *
 * @description
 * 音分類結果に応じたアイコンスタイルを決定する機能と、
 * アイコンのサイズ設定、バリアントのスタイル設定を提供します。
 *
 * @returns アイコンスタイルを決定する関数と設定オブジェクト
 *
 * @example
 * ```tsx
 * const { getClassificationStyle, getCurrentSize, getCurrentVariant } = useSoundPinIcon()
 * const iconStyle = getClassificationStyle("車の音")
 * const currentSize = getCurrentSize(size)
 * const currentVariant = getCurrentVariant(variant)
 * ```
 */
export function useSoundPinIcon(): {
   getClassificationStyle: (primaryLabel?: string) => {
      iconName: SoundIconName
   }
   sizeConfig: typeof sizeConfig
   variantConfig: typeof variantConfig
   getCurrentSize: (
      size: string,
   ) => (typeof sizeConfig)[keyof typeof sizeConfig]
   getCurrentVariant: (
      variant: string,
   ) => (typeof variantConfig)[keyof typeof variantConfig]
} {
   return {
      getClassificationStyle,
      sizeConfig,
      variantConfig,
      getCurrentSize,
      getCurrentVariant,
   }
}
