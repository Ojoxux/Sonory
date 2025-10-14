"use client"

import { motion } from "framer-motion"
import { Sheet } from "react-modal-sheet"
import { AIAnalysisOrb } from "../../../atoms/AIAnalysisOrb"
import type { AIAnalyzingViewProps } from "./types"

/**
 * AI分析中画面コンポーネント（BottomSheet版）
 *
 * @description
 * AI分析が実行中であることを視覚的に示す画面
 * AIAnalysisOrb を使用したアニメーションと進行状況メッセージを表示
 * react-modal-sheet を使用してボトムシートとして表示
 *
 * @param isOpen シートの開閉状態
 * @param message 分析状況を示すメッセージ
 * @param onClose シートを閉じるハンドラー（オプション）
 *
 * @example
 * ```tsx
 * <AIAnalyzingView
 *   isOpen={true}
 *   message="音を聴いています..."
 * />
 * ```
 */
export function AIAnalyzingView({
   isOpen,
   message,
   onClose,
}: AIAnalyzingViewProps) {
   return (
      <Sheet
         isOpen={isOpen}
         onClose={onClose || (() => {
            // 閉じる処理が指定されていない場合は何もしない
         })}
         detent="content"
         snapPoints={[0, 1]}
         initialSnap={1}
      >
         <Sheet.Container className="!bg-black/95 !backdrop-blur-xl !border-t !border-white/10 !shadow-2xl">
            <Sheet.Header className="!bg-transparent">
               <div className="flex flex-col items-center px-6 pt-4 pb-2">
                  <div className="mb-2 h-1 w-12 rounded-full bg-white/20" />
               </div>
            </Sheet.Header>

            <Sheet.Content className="!bg-transparent">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center px-6 pb-6"
               >
                  <AIAnalysisOrb
                     hue={0}
                     cycleHue={true}
                     hueCycleSpeed={60}
                     forceHoverState={true}
                     rotateOnHover={true}
                     hoverIntensity={0.4}
                     size={280}
                  />
                  <div className="mt-8 mb-5 flex flex-col items-center space-y-2 text-center">
                     <p className="font-bold text-white text-xl tracking-wide">
                        {message}
                     </p>
                     <p className="text-gray-400 text-sm tracking-wide">
                        この音が何を伝えているか、感じています
                     </p>
                  </div>
               </motion.div>
            </Sheet.Content>
         </Sheet.Container>

         <Sheet.Backdrop className="!bg-black/50 !backdrop-blur-sm" />
      </Sheet>
   )
}
