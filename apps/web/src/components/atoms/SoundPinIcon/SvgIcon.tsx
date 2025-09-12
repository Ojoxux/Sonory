import type { ReactElement } from "react"
import type { SoundIconName } from "./types"

/**
 * SVGアイコンコンポーネントのプロパティ型定義
 */
interface SvgIconProps {
   /** アイコン名 */
   iconName: SoundIconName
   /** 追加のCSSクラス */
   className?: string
   /** アイコンのサイズ */
   size?: "small" | "medium" | "large"
}

/**
 * SVGアイコンを表示するコンポーネント
 *
 * @description
 * 音声ピンに表示するSVGアイコンを管理します。
 *
 * @param iconName - 表示するアイコン名
 * @param className - 追加のCSSクラス
 * @param size - アイコンのサイズ
 * @returns SVGアイコン要素
 */
export function SvgIcon({
   iconName,
   className = "",
   size = "medium",
}: SvgIconProps): ReactElement {
   const sizeClasses = {
      small: "w-5 h-5", // 3x3 → 4x4 (16px)
      medium: "w-11 h-11", // 4x4 → 6x6 (24px)
      large: "w-12 h-12", // 5x5 → 7x7 (28px)
   }

   return (
      <img
         src={`/icons/${iconName}.svg`}
         alt=""
         className={`${sizeClasses[size]} ${className}`}
         aria-hidden="true"
      />
   )
}
