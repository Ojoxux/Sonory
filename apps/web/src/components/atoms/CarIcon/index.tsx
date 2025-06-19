'use client'

import type { ReactElement } from 'react'
import { MdDirectionsCar } from 'react-icons/md'
import type { CarIconProps } from './types'

/**
 * 道路音分類用の車アイコンコンポーネント
 *
 * @description
 * マップピンとして使用される車のアイコン。
 * 道路音（車、バイク、トラック等）の分類結果を視覚的に表現します。
 *
 * @param size - アイコンのサイズ（'small' | 'medium' | 'large'）
 * @param color - アイコンの色（Tailwind CSS色クラス）
 * @param className - 追加のCSSクラス
 * @param onClick - クリック時のコールバック関数
 *
 * @example
 * ```tsx
 * <CarIcon
 *   size="medium"
 *   color="text-blue-600"
 *   onClick={() => console.log('車アイコンがクリックされました')}
 * />
 * ```
 */
export function CarIcon({
  size = 'medium',
  color = 'text-blue-600',
  className = '',
  onClick,
}: CarIconProps): ReactElement {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  } as const

  const containerSizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  } as const

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${containerSizeClasses[size]}
        bg-white
        rounded-full
        shadow-lg
        border-2
        border-gray-200
        hover:border-blue-300
        hover:shadow-xl
        transition-all
        duration-200
        flex
        items-center
        justify-center
        cursor-pointer
        touch-manipulation
        ${className}
      `}
      aria-label="道路音の録音地点"
    >
      <MdDirectionsCar
        className={`${sizeClasses[size]} ${color}`}
        aria-hidden="true"
      />
    </button>
  )
}
