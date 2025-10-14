"use client"

import { motion } from "framer-motion"
import { Sheet } from "react-modal-sheet"
import { WaveformPlayer } from "../../../molecules/WaveformPlayer"
import type { AudioReviewViewProps } from "./types"

/**
 * 録音確認画面コンポーネント（BottomSheet版）
 *
 * @description
 * 録音した音声の確認と、続行またはキャンセルの選択を行う画面
 * 波形プレイヤーで音声を再生できる
 * react-modal-sheet を使用してボトムシートとして表示
 *
 * @param isOpen シートの開閉状態
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
 *   isOpen={true}
 *   audioData={audioData}
 *   formattedDate="2025/10/08 12:30:00"
 *   onContinue={handleContinue}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function AudioReviewView({
   isOpen,
   audioData,
   formattedDate,
   onContinue,
   onCancel,
   onWaveformReady,
   onWaveformFinish,
}: AudioReviewViewProps) {
   return (
      <Sheet
         isOpen={isOpen}
         onClose={onCancel}
         detent="content"
         snapPoints={[0, 1]}
         initialSnap={1}
      >
         <Sheet.Container className="!bg-black/95 !backdrop-blur-xl !border-t !border-white/10 !shadow-2xl">
            <Sheet.Header className="!bg-transparent">
               <div className="flex flex-col items-center px-6 pt-4 pb-2">
                  <div className="mb-2 h-1 w-12 rounded-full bg-white/20" />
                  <div className="w-full text-center">
                     <h2 className="font-bold text-white text-xl">録音完了</h2>
                     <p className="mt-1 text-neutral-300 text-sm">
                        {formattedDate}
                     </p>
                  </div>
               </div>
            </Sheet.Header>

            <Sheet.Content className="!bg-transparent">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="px-6 pb-6"
               >
                  <div className="mb-6">
                     <h3 className="mb-3 font-semibold text-lg text-white">
                        録音音声
                     </h3>
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
            </Sheet.Content>
         </Sheet.Container>

         <Sheet.Backdrop className="!bg-black/50 !backdrop-blur-sm" />
      </Sheet>
   )
}
