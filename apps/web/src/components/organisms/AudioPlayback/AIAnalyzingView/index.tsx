"use client"

import { motion } from "framer-motion"
import { AIAnalysisOrb } from "../../../atoms/AIAnalysisOrb"
import type { AIAnalyzingViewProps } from "./types"

/**
 * AI分析中画面コンポーネント
 *
 * @description
 * AI分析が実行中であることを視覚的に示す画面
 * AIAnalysisOrb を使用したアニメーションと進行状況メッセージを表示
 *
 * @param message 分析状況を示すメッセージ
 *
 * @example
 * ```tsx
 * <AIAnalyzingView message="音を聴いています..." />
 * ```
 */
export function AIAnalyzingView({ message }: AIAnalyzingViewProps) {
   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="-mt-5 flex flex-col items-center justify-center"
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
   )
}
