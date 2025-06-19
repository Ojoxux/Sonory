'use client'

import { CompassIcon } from '@/components/atoms/CompassIcon'
import { motion } from 'framer-motion'
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
   // マップのbearingに応じて回転状態を管理
   const hasRotation = mapBearing !== 0

   // カラーテーマの設定 - モノクロベース
   const baseColor = isDarkMode ? 'text-white' : 'text-gray-800'
   const bgBase = isDarkMode
      ? 'bg-white/10 hover:bg-white/15'
      : 'bg-white/70 hover:bg-white/80'
   const borderColor = isDarkMode
      ? 'border border-white/20'
      : 'border border-black/5'
   const shadowColor = isDarkMode
      ? 'shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
      : 'shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
   const rotationIndicator = isDarkMode ? 'border-white/30' : 'border-black/20'

   // 回転インジケーターのバリアント
   const pulseVariants = {
      pulse: {
         scale: [1.12, 1.18, 1.12],
         opacity: [0.5, 0.7, 0.5],
         transition: {
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
         },
      },
   }

   return (
      <div className="relative">
         {/* マップが回転している場合のみ表示される外側のインジケーター */}
         {hasRotation && (
            <>
               {/* モノクロの背景リング */}
               <motion.span
                  className={`absolute inset-0 rounded-full ${
                     isDarkMode ? 'bg-white/20' : 'bg-black/10'
                  }`}
                  style={{ filter: 'blur(1px)' }}
                  initial="pulse"
                  animate="pulse"
                  variants={pulseVariants}
               />

               {/* 外側の薄いリング */}
               <motion.span
                  className={`absolute inset-0 rounded-full border-2 ${rotationIndicator}`}
                  style={{ transform: 'scale(1.25)' }}
                  animate={{
                     rotate: [0, 360],
                  }}
                  transition={{
                     duration: 8,
                     repeat: Number.POSITIVE_INFINITY,
                     ease: 'linear',
                  }}
               />
            </>
         )}

         <motion.button
            aria-label="現在位置に戻る"
            onClick={onClick}
            className={`
          w-14 h-14 rounded-full
          flex items-center justify-center
          backdrop-blur-md
          ${bgBase}
          ${borderColor}
          ${baseColor}
          ${shadowColor}
          ${className}
        `}
            whileHover={{
               scale: 1.05,
               y: -2,
               boxShadow: isDarkMode
                  ? '0 8px 16px rgba(0,0,0,0.4)'
                  : '0 8px 16px rgba(0,0,0,0.15)',
            }}
            whileTap={{
               scale: 0.98,
               y: 0,
               boxShadow: isDarkMode
                  ? '0 3px 6px rgba(0,0,0,0.3)'
                  : '0 3px 6px rgba(0,0,0,0.1)',
            }}
            transition={{
               type: 'spring',
               stiffness: 400,
               damping: 17,
            }}
         >
            {/* コンパスアイコン - より大きく */}
            <CompassIcon
               className={`w-10 h-10 ${hasRotation ? 'opacity-90' : 'opacity-80'}`}
               mapBearing={mapBearing}
            />
         </motion.button>
      </div>
   )
}
