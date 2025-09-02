import type { ReactElement } from "react"

interface SvgIconProps {
   iconName: string
   className?: string
   size?: "small" | "medium" | "large"
}

/**
 * SVGアイコンを表示するコンポーネント
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
