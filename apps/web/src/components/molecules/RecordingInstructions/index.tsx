"use client"

import { motion } from "motion/react"
import { ConfirmButton } from "../../atoms/ConfirmButton"
import { MicPermissionToggle } from "../../atoms/MicPermissionToggle"
import { ConfirmationComplete } from "../ConfirmationComplete"
import { InstructionsList } from "../InstructionsList"
import { SlideToStart } from "../SlideToStart"
import { CARD_VARIANTS, revealDelay } from "./constants"
import type { RecordingInstructionsProps } from "./types"

/**
 * 録音前の説明・確認コンポーネント
 *
 * @description
 * 録音前に表示する説明と確認事項を表示するコンポーネント。
 * カード自体の出入りは motion、中身の段階表示は CSS の `reveal` が受け持つ。
 * 閉じるアニメーションは親の `AnimatePresence` が `exit` で流す
 *
 * @param instructionItems 説明項目の配列
 * @param isAgreed 同意済みかどうか
 * @param showConfirmationComplete 確認完了画面を表示するかどうか
 * @param microphonePermission マイク権限の状態
 * @param hasPosition 現在位置が取得できているかどうか
 * @param onRequestMicrophonePermission マイク許可トグル押下時のコールバック
 * @param onAgree 同意ボタンクリック時のコールバック
 * @param onStartRecording 録音開始時のコールバック
 * @param instructionsRef 外部クリック検知用のref
 */
export function RecordingInstructions({
   instructionItems,
   isAgreed,
   showConfirmationComplete,
   microphonePermission,
   hasPosition,
   onRequestMicrophonePermission,
   onAgree,
   onStartRecording,
   instructionsRef,
}: RecordingInstructionsProps) {
   return (
      <motion.div
         ref={instructionsRef}
         variants={CARD_VARIANTS}
         initial="hidden"
         animate="shown"
         exit="exit"
         className="glass relative flex w-full max-w-sm origin-bottom flex-col overflow-hidden rounded-4xl border p-4 text-white shadow-2xl sm:p-6"
      >
         {!showConfirmationComplete ? (
            <>
               <div className="reveal mb-4 text-center" style={revealDelay(0)}>
                  <h3 className="mb-2 font-bold text-lg tracking-tight">
                     録音前の確認
                  </h3>
                  <p className="text-base text-neutral-200 leading-relaxed">
                     以下の項目をご確認ください
                  </p>
               </div>

               <InstructionsList items={instructionItems} startStep={1} />

               <div
                  className="reveal flex flex-col gap-4"
                  style={revealDelay(instructionItems.length + 1)}
               >
                  {/* 位置情報が無いとピンを配置できない。録音し終えてから気づかせない */}
                  {!hasPosition && (
                     <div className="rounded-xl border border-warn-500/30 bg-warn-500/10 px-4 py-3">
                        <span className="text-sm text-warn-300 leading-relaxed">
                           位置情報を取得できていません。録音はできますが、ピンは配置できません
                        </span>
                     </div>
                  )}

                  <MicPermissionToggle
                     state={microphonePermission}
                     onRequest={onRequestMicrophonePermission}
                  />

                  <ConfirmButton
                     onClick={onAgree}
                     isConfirmed={isAgreed}
                     isDisabled={microphonePermission !== "granted"}
                  />
               </div>
            </>
         ) : (
            <>
               <ConfirmationComplete />

               <div className="reveal" style={revealDelay(2)}>
                  <SlideToStart onComplete={onStartRecording} text="録音開始" />
               </div>
            </>
         )}
      </motion.div>
   )
}
