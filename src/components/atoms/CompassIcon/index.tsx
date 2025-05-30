'use client'

import type { CompassIconProps } from './type'

/**
 * コンパスアイコンコンポーネント
 *
 * @description
 * 北を指すコンパスアイコンを表示するAtomコンポーネント
 * マップのbearing（回転角度）に基づいて常に北を指すように回転
 *
 * @param className 追加のCSSクラス
 * @param size アイコンのサイズ（デフォルト: 20）
 * @param mapBearing マップのbearing（回転角度）
 *
 * @example
 * ```tsx
 * <CompassIcon className="text-white" size={24} mapBearing={45} />
 * ```
 */
export function CompassIcon({
  className = '',
  size = 20,
  mapBearing = 0,
}: CompassIconProps) {
  // マップのbearingに基づいて北を指すように回転角度を計算
  // マップが時計回りに回転している場合、コンパスは反時計回りに回転して北を指す
  const compassRotation = -mapBearing

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        transform: `rotate(${compassRotation}deg)`,
        transition: 'transform 0.3s ease-out',
      }}
    >
      {/* コンパスの外枠 */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* 北を指す針（赤色） */}
      <path d="M12 4 L10 8 L12 7 L14 8 Z" fill="currentColor" opacity="0.9" />

      {/* 南を指す針（白色/透明） */}
      <path
        d="M12 20 L14 16 L12 17 L10 16 Z"
        fill="currentColor"
        opacity="0.3"
      />

      {/* 中心点 */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.8" />

      {/* 北の文字 */}
      <text
        x="12"
        y="6"
        textAnchor="middle"
        fontSize="6"
        fontWeight="bold"
        fill="currentColor"
        opacity="0.7"
      >
        N
      </text>
    </svg>
  )
}
