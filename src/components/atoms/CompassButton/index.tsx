'use client'

import { CompassIcon } from '@/components/atoms/CompassIcon'
import { useState } from 'react'
import type { CompassButtonProps } from './type'

/**
 * コンパスボタンコンポーネント
 *
 * @description
 * 現在地に戻るためのコンパスボタンのAtomコンポーネント
 * コンパスらしいデザインで、マップの回転に合わせてコンパスの方向も変化する
 *
 * @param onClick クリックハンドラー
 * @param mapBearing マップのbearing（回転角度）
 * @param className 追加のCSSクラス
 * @param isDarkMode ダークモードかどうか
 *
 * @example
 * ```tsx
 * <CompassButton
 *   onClick={() => console.log('コンパスボタンがクリックされました')}
 *   mapBearing={45}
 * />
 * ```
 */
export function CompassButton({
  onClick,
  mapBearing = 0,
  className = '',
  isDarkMode = false,
}: CompassButtonProps) {
  // ホバー状態を管理
  const [isHovered, setIsHovered] = useState(false)
  // アクティブ状態を管理
  const [isActive, setIsActive] = useState(false)

  // 色の設定
  const baseColor = isDarkMode ? 'text-white' : 'text-gray-900'
  const bgColor = isDarkMode
    ? 'bg-white/10 hover:bg-white/20'
    : 'bg-black/10 hover:bg-black/20'

  // マップのbearingに応じて回転状態を管理
  const hasRotation = mapBearing !== 0

  return (
    <div className="relative">
      {/* マップが回転している場合のみ表示される外側のインジケーター */}
      {hasRotation && (
        <span
          className="absolute inset-0 rounded-full border-2 border-blue-500/40 animate-pulse"
          style={{ transform: 'scale(1.15)' }}
        />
      )}

      <button
        aria-label="現在位置に戻る"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsActive(false)
        }}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        className={`
          w-12 h-12 rounded-full
          transition-all duration-200 ease-in-out
          flex items-center justify-center
          backdrop-blur-sm
          ${bgColor}
          ${baseColor}
          ${isHovered ? 'scale-105 -translate-y-px shadow-md' : ''}
          ${isActive ? 'scale-[1.02] translate-y-0 shadow-sm' : ''}
          ${className}
        `}
      >
        {/* コンパスアイコン */}
        <CompassIcon className="w-6 h-6" mapBearing={mapBearing} />
      </button>
    </div>
  )
}
