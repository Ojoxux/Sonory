"use client"

import { motion } from "framer-motion"
import { WaveformPlayer } from "../../../molecules/WaveformPlayer"
import type { AudioReviewViewProps } from "./types"

/**
 * 録音確認画面コンポーネント
 *
 * @description
 * 録音した音声の確認と、続行またはキャンセルの選択を行う画面
 * 波形プレイヤーで音声を再生できる
 *
 * @param audioData 音声データ
 * @param formattedDate 録音日時のフォーマット済み文字列
 * @param onContinue 続けるボタンのクリックハンドラー
 * @param onCancel キャンセルボタンのクリックハンドラー
 * @param onWaveformReady 波形プレイヤーの準備完了時のコールバック
 * @param onWaveformFinish 波形プレイヤーの再生完了時のコールバック
 *
 * @example
 * ```tsx
 * <AudioReviewView
 *   audioData={audioData}
 *   formattedDate="2025/10/08 12:30:00"
 *   onContinue={handleContinue}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function AudioReviewView({
   audioData,
   onContinue,
   onCancel,
   onWaveformReady,
   onWaveformFinish,
}: AudioReviewViewProps) {
   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.1 }}
      >
         <div className="mb-6">
            <h3 className="mb-3 font-semibold text-lg text-white">録音音声</h3>
            <WaveformPlayer
               audioData={audioData}
               height={120}
               waveColor="#9ca3af"
               progressColor="#dc2626"
               className="w-full"
               onReady={onWaveformReady}
               onFinish={onWaveformFinish}
            />
         </div>

         <div className="flex gap-3">
            <motion.button
               onClick={onCancel}
               className="flex-1 touch-manipulation rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]"
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
            >
               キャンセル
            </motion.button>
            <motion.button
               onClick={onContinue}
               className="flex-1 touch-manipulation rounded-xl border border-blue-500/30 bg-blue-600/80 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)] backdrop-blur-sm transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_8px_32px_rgba(59,130,246,0.6)]"
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
            >
               続ける
            </motion.button>
         </div>
      </motion.div>
   )
}
