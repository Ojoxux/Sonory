'use client'

import { RecordButtonContent } from '@/components/molecules/RecordButtonContent'
import type { RecordButtonProps } from './type'

/**
 * 録音ボタンコンポーネント
 *
 * @description
 * 録音機能を持つボタンのMoleculeコンポーネント
 * 状態に応じてスタイルとコンテンツが変化
 * ニューモーフィズムとグラスモーフィズムを組み合わせたデザイン
 *
 * @param status 録音の状態
 * @param onClick 録音ボタンがクリックされた時のコールバック
 * @param disabled 録音ボタンが無効化されているかどうか
 *
 * @example
 * ```tsx
 * <RecordButton
 *   status="idle"
 *   onClick={() => console.log('録音ボタンがクリックされました')}
 *   disabled={false}
 * />
 * ```
 */
export function RecordButton({
   status,
   onClick,
   disabled = false,
}: RecordButtonProps) {
   // 状態に応じた背景グラデーションを取得
   const getBackgroundGradient = (): string => {
      switch (status) {
         case 'recording':
            return 'bg-gradient-to-br from-red-500 to-pink-500'
         case 'processing':
            return 'bg-gradient-to-br from-purple-500 to-indigo-500'
         case 'completed':
            return 'bg-gradient-to-br from-green-500 to-emerald-500'
         default:
            return 'bg-gradient-to-br from-purple-600 to-blue-600'
      }
   }

   // 状態に応じたアニメーションクラスを取得
   const getAnimationClass = (): string => {
      switch (status) {
         case 'recording':
            return 'animate-pulse-scale'
         case 'processing':
            return 'animate-spin-slow'
         case 'completed':
            return 'animate-bounce-once'
         default:
            return 'animate-float'
      }
   }

   // 状態に応じたリングエフェクトを取得
   const getRingEffect = (): string => {
      switch (status) {
         case 'recording':
            return 'ring-4 ring-red-400/30 ring-offset-4 ring-offset-transparent'
         case 'processing':
            return 'ring-4 ring-purple-400/30 ring-offset-4 ring-offset-transparent'
         default:
            return ''
      }
   }

   return (
      <div className="relative">
         {/* 背景の光彩エフェクト */}
         <div
            className={`absolute inset-0 ${getBackgroundGradient()} rounded-full blur-2xl opacity-50 ${getAnimationClass()}`}
         />

         {/* メインボタン */}
         <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
          relative w-32 h-32 rounded-full
          ${getBackgroundGradient()}
          shadow-2xl
          transition-all duration-300 ease-out
          hover:scale-105 hover:shadow-3xl
          active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getRingEffect()}
          ${getAnimationClass()}
          group
        `}
            aria-label="録音"
         >
            {/* グラスエフェクト */}
            <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm" />

            {/* 内部の光沢 */}
            <div className="absolute top-2 left-2 right-2 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-full" />

            {/* コンテンツ */}
            <div className="relative z-10">
               <RecordButtonContent status={status} />
            </div>
         </button>

         {/* 波紋エフェクト（録音中） */}
         {status === 'recording' && (
            <>
               <div className="absolute inset-0 rounded-full border-2 border-red-400/50 animate-ping-slow" />
               <div className="absolute inset-0 rounded-full border-2 border-red-400/30 animate-ping-slower" />
            </>
         )}
      </div>
   )
}
