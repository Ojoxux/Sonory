"use client"

import { motion } from "framer-motion"
import type { RecordingContainerProps } from "./types"

/**
 * 録音コンテナコンポーネント
 *
 * @description
 * 録音中のUIをラップするコンテナコンポーネント
 *
 * @param children 子要素
 * @param isExpanded 展開されているかどうか
 * @param constraintsRef ドラッグ制約用のref
 * @param onDragEnd ドラッグ終了時のコールバック
 * @param onToggleExpand 展開/折りたたみ切り替え時のコールバック
 */
export function RecordingContainer({
   children,
   isExpanded,
   constraintsRef,
   onDragEnd,
   onToggleExpand,
}: RecordingContainerProps) {
   return (
      <motion.div
         ref={constraintsRef}
         initial={{ y: "100%" }}
         animate={{ y: isExpanded ? "5vh" : "calc(100% - 110px)" }}
         exit={{ y: "100%" }}
         transition={{ type: "spring", stiffness: 300, damping: 30 }}
         className="fixed inset-x-0 bottom-0"
         style={{ height: isExpanded ? "95vh" : "auto" }}
      >
         <motion.div
            drag="y"
            dragConstraints={constraintsRef}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            className="h-full overflow-hidden rounded-t-3xl bg-white/98 shadow-2xl backdrop-blur-xl sm:rounded-t-[2rem]"
         >
            {/* ドラッグハンドル */}
            <button
               type="button"
               onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpand()
               }}
               className="flex w-full cursor-grab touch-manipulation justify-center py-3 transition-colors hover:bg-gray-50/50 active:cursor-grabbing"
               aria-label={isExpanded ? "収縮" : "展開"}
            >
               <div className="h-1 w-10 rounded-full bg-gray-300" />
            </button>

            {/* メインコンテンツ */}
            <div
               className={`${isExpanded ? "flex h-full flex-col" : "px-4 pb-6 sm:px-6"}`}
            >
               {children}
            </div>
         </motion.div>
      </motion.div>
   )
}
