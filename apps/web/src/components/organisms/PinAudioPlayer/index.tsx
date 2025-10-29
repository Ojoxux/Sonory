"use client"

import { AnimatePresence, motion } from "framer-motion"
import { MdPause, MdPlayArrow } from "react-icons/md"
import { Sheet } from "react-modal-sheet"
import { SoundWaveBackground } from "../../atoms/SoundWaveBackground"
import type { PinAudioPlayerProps } from "./types"
import { usePinAudioPlayer } from "./usePinAudioPlayer"

/**
 * ピンクリック時の音声再生コンポーネント（BottomSheet版）
 *
 * @description
 * 永続化されたピンの音声を再生するためのコンポーネントです。
 * 音声URLから直接再生し、再生状態を管理します。
 * Sonoryらしい音響的なUIエフェクトを含みます。
 * react-modal-sheet を使用してボトムシートとして表示します。
 *
 * @param pin 再生する音声ピン
 * @param onClose 閉じるボタンが押されたときのコールバック
 *
 * @example
 * ```tsx
 * <PinAudioPlayer
 *   pin={selectedPin}
 *   onClose={() => setSelectedPin(null)}
 * />
 * ```
 */
export function PinAudioPlayer({
   pin,
   onClose,
}: PinAudioPlayerProps) {
   const {
      audioLoadingStatus,
      playbackState,
      audioLoadError,
      currentTime,
      duration,
      isMounted,
      progressBarRef,
      formatRecordedAt,
      formatTime,
      togglePlayback,
      handleSeek,
      handleClose,
      progressPercentage,
      isOtherResultsOpen,
      toggleOtherResults,
      formatConfidence,
   } = usePinAudioPlayer(pin, onClose)

   if (!pin || !isMounted) {
      return null
   }

   return (
      <Sheet
         isOpen={true}
         onClose={handleClose}
         detent="content"
         snapPoints={[0, 1]}
         initialSnap={1}
      >
         <Sheet.Container className="!bg-black/95 !backdrop-blur-xl !border-t !border-white/10 !shadow-2xl">
            {/* 音波背景パターン */}
            <SoundWaveBackground
               opacity={0.01}
               animated={playbackState === "playing"}
            />

            <Sheet.Header className="!bg-transparent">
               <div className="flex flex-col items-center px-6 pt-4 pb-2">
                  <div className="mb-2 h-1 w-12 rounded-full bg-white/20" />
                  <div className="w-full text-center">
                     <motion.h2
                        className="font-bold text-white text-xl"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                     >
                        音声ピン再生
                     </motion.h2>
                     <motion.p
                        className="mt-1 text-neutral-300 text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                     >
                        {formatRecordedAt(pin.recordedAt)}
                     </motion.p>
                  </div>
               </div>
            </Sheet.Header>

            <Sheet.Content className="!bg-transparent">
               {/* メインコンテンツ */}
               <div className="relative px-6 pb-6">
               {/* ピン情報 */}
               <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-lg text-white">
                     音声分類結果
                  </h3>

                  {/* デバッグ情報 */}
                  {process.env.NODE_ENV === "development" && (
                     <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/20 p-3 text-xs">
                        <div className="mb-2 font-medium text-purple-300">
                           デバッグ情報:
                        </div>
                        <div className="space-y-1 text-purple-200">
                           <div>Pin ID: {pin.id}</div>
                           <div>Primary Label: {pin.primaryLabel}</div>
                           <div>Environment: {pin.environment}</div>
                           <div>
                              Classification Results Count:{" "}
                              <span
                                 className={`font-semibold ${
                                    pin.classificationResults.length > 1
                                       ? "text-green-300"
                                       : "text-yellow-300"
                                 }`}
                              >
                                 {pin.classificationResults.length}件
                              </span>
                              {pin.classificationResults.length > 1
                                 ? " (複数の結果あり)"
                                 : " (単一結果)"}
                           </div>
                           <div>
                              Classification Results:{" "}
                              {JSON.stringify(
                                 pin.classificationResults,
                                 null,
                                 2,
                              )}
                           </div>
                        </div>
                     </div>
                  )}

                  {pin.classificationResults.length > 0 ? (
                     <div className="mb-4 space-y-3">
                        {/* 最も可能性の高い結果 */}
                        <motion.div
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: 0.1 }}
                           className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 backdrop-blur-sm"
                        >
                           <div className="mb-1.5 flex items-center justify-between">
                              <span className="font-semibold text-base text-green-300">
                                 {pin.classificationResults[0].label ===
                                 "unknown"
                                    ? "未分類"
                                    : pin.classificationResults[0].label}
                              </span>
                              <span className="font-mono font-semibold text-green-400 text-sm">
                                 {formatConfidence(
                                    pin.classificationResults[0].confidence,
                                 )}
                              </span>
                           </div>
                           <div className="flex items-center gap-1.5 text-green-300/60 text-xs">
                              <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-green-400" />
                              最も可能性が高い
                           </div>
                        </motion.div>

                        {/* その他の候補 */}
                        {pin.classificationResults.length > 1 && (
                           <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                              <button
                                 type="button"
                                 onClick={toggleOtherResults}
                                 className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-white/5"
                              >
                                 <span className="font-medium text-white/60 text-xs">
                                    その他の候補 (
                                    {pin.classificationResults.length - 1}
                                    件)
                                 </span>
                                 <motion.span
                                    animate={{
                                       rotate: isOtherResultsOpen ? 180 : 0,
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm text-white/60"
                                 >
                                    ▼
                                 </motion.span>
                              </button>

                              <AnimatePresence initial={false}>
                                 {isOtherResultsOpen && (
                                    <motion.div
                                       initial={{ height: 0, opacity: 0 }}
                                       animate={{
                                          height: "auto",
                                          opacity: 1,
                                       }}
                                       exit={{ height: 0, opacity: 0 }}
                                       transition={{
                                          duration: 0.2,
                                          ease: "easeInOut",
                                       }}
                                       className="overflow-hidden"
                                    >
                                       <div className="space-y-2 px-3 pb-3">
                                          {pin.classificationResults
                                             .slice(1)
                                             .map((result, index) => (
                                                <div
                                                   key={`${result.label}-${index + 1}`}
                                                   className="flex items-center justify-between py-1"
                                                >
                                                   <span className="text-neutral-300 text-sm">
                                                      {result.label ===
                                                      "unknown"
                                                         ? "未分類"
                                                         : result.label}
                                                   </span>
                                                   <span className="font-mono text-neutral-400 text-xs">
                                                      {formatConfidence(
                                                         result.confidence,
                                                      )}
                                                   </span>
                                                </div>
                                             ))}
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </div>
                        )}
                     </div>
                  ) : (
                     <div className="mb-4">
                        <motion.div
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/20 p-3 backdrop-blur-sm"
                        >
                           <span className="font-medium text-yellow-300">
                              {pin.environment === "unknown"
                                 ? "未分類"
                                 : pin.environment}
                           </span>
                           <span className="text-sm text-yellow-400">
                              {Math.round(pin.primaryConfidence * 100)}%
                           </span>
                        </motion.div>
                     </div>
                  )}

                  {pin.environment && (
                     <motion.div
                        className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/20 p-4 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                     >
                        <span className="font-medium text-blue-300">
                           環境: {pin.environment}
                        </span>
                     </motion.div>
                  )}
               </div>

               {/* 音声再生エラー */}
               {audioLoadError && (
                  <motion.div
                     className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                  >
                     <span className="font-medium text-red-300">
                        エラー: {audioLoadError}
                     </span>
                  </motion.div>
               )}

               {/* 音声再生コントロール */}
               <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-lg text-white">
                     音声再生
                  </h3>

                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                     {/* 再生ボタン */}
                     <div className="mb-4 flex items-center justify-center">
                        <motion.button
                           onClick={togglePlayback}
                           disabled={audioLoadingStatus !== "ready"}
                           className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${
                              audioLoadingStatus === "ready"
                                 ? "bg-blue-600 text-white hover:bg-blue-700"
                                 : "cursor-not-allowed bg-gray-600 text-gray-400"
                           }`}
                           whileHover={
                              audioLoadingStatus === "ready"
                                 ? { scale: 1.05 }
                                 : {}
                           }
                           whileTap={
                              audioLoadingStatus === "ready"
                                 ? { scale: 0.95 }
                                 : {}
                           }
                        >
                           {audioLoadingStatus === "loading" ? (
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                           ) : playbackState === "playing" ? (
                              <MdPause className="h-8 w-8" />
                           ) : (
                              <MdPlayArrow className="h-8 w-8" />
                           )}
                        </motion.button>
                     </div>

                     {/* 再生時間表示 */}
                     <div className="text-center text-neutral-300 text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                     </div>

                     {/* 進捗バー（クリック可能） */}
                     <div
                        ref={progressBarRef}
                        className="mt-2 h-2 w-full cursor-pointer rounded-full bg-white/10"
                        onClick={handleSeek}
                        onKeyDown={(e) => {
                           if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              // キーボードイベントの場合は中央位置にシーク
                              if (progressBarRef.current) {
                                 const rect =
                                    progressBarRef.current.getBoundingClientRect()
                                 const centerX = rect.left + rect.width / 2
                                 const mockEvent = {
                                    clientX: centerX,
                                    preventDefault: () => {
                                       // キーボードイベント用の空実装
                                    },
                                 } as React.MouseEvent<HTMLDivElement>
                                 handleSeek(mockEvent)
                              }
                           }
                        }}
                        tabIndex={0}
                        role="slider"
                        aria-label="再生位置"
                        aria-valuemin={0}
                        aria-valuemax={duration}
                        aria-valuenow={currentTime}
                     >
                        <div
                           className="h-2 rounded-full bg-blue-500"
                           style={{
                              width: `${progressPercentage}%`,
                              transition:
                                 playbackState === "playing"
                                    ? "none"
                                    : "width 0.2s ease-out",
                           }}
                        />
                     </div>
                  </div>
               </div>

               {/* 閉じるボタン */}
               <motion.button
                  onClick={handleClose}
                  className="w-full touch-manipulation rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(255,255,255,0.1)] backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
               >
                  閉じる
               </motion.button>
            </div>
            </Sheet.Content>
         </Sheet.Container>

         <Sheet.Backdrop className="!bg-black/50 !backdrop-blur-sm" />
      </Sheet>
   )
}
