'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { MdMic, MdStop } from 'react-icons/md'
import { BlinkingIndicator } from '../../atoms/BlinkingIndicator'
import { ConfirmButton } from '../../atoms/ConfirmButton'
import { PulseEffect } from '../../atoms/PulseEffect'
import { RippleEffect } from '../../atoms/RippleEffect'
import { ConfirmationComplete } from '../../molecules/ConfirmationComplete'
import { InstructionsList } from '../../molecules/InstructionsList'
import { SlideToStart } from '../../molecules/SlideToStart'
import { WaveformDisplay } from '../../molecules/WaveformDisplay'
import { AudioPlayback } from '../AudioPlayback'
import { useRecordingInterface } from './hooks/useRecordingInterface'
import type { RecordingInterfaceProps } from './type'

/**
 * 録音インターフェースコンポーネント
 *
 * @description
 * モバイルファーストのPWA向け録音UI
 * タッチ操作に最適化されたデザイン
 *
 * @param className クラス名
 * @param onExpandedChange 展開状態が変更されたときに呼び出されるコールバック関数
 * @param currentPosition 現在の位置
 */
export function RecordingInterface({
   className = '',
   onExpandedChange,
   currentPosition,
}: RecordingInterfaceProps) {
   const {
      isExpanded,
      setIsExpanded,
      status,
      recordingTime,
      showInstructions,
      isClosing,
      showPlayback,
      isAgreed,
      showConfirmationComplete,
      constraintsRef,
      instructionsRef,
      waveformData,
      audioData,
      handleRecord,
      handleStartRecording,
      handleAgree,
      handleStop,
      handleClosePlayback,
      formatTime,
      handleDragEnd,
      instructionItems,
   } = useRecordingInterface(onExpandedChange)

   return (
      <div
         className={`pointer-events-auto fixed right-0 bottom-0 left-0 ${className}`}
         style={{ zIndex: status !== 'idle' && isExpanded ? 110 : 50 }}
      >
         {/* 初期状態の録音ボタン（録音していない時のみ表示） */}
         <AnimatePresence>
            {status === 'idle' && (
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="-translate-x-1/2 safe-bottom absolute bottom-6 left-1/2 transform"
               >
                  {!showInstructions ? (
                     <motion.button
                        onClick={handleRecord}
                        className="mb-5 flex h-16 w-48 touch-manipulation items-center justify-center rounded-full bg-black shadow-2xl transition-all duration-300 hover:bg-gray-800 sm:h-20 sm:w-20"
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                     >
                        <MdMic className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                     </motion.button>
                  ) : (
                     <motion.div
                        ref={instructionsRef}
                        initial={{
                           width: '12rem',
                           height:
                              typeof window !== 'undefined' &&
                              window.innerWidth >= 640
                                 ? '5rem'
                                 : '4rem',
                           backgroundColor: 'rgba(0, 0, 0, 0.95)',
                           borderRadius: '2rem',
                           scale: 1,
                        }}
                        animate={
                           isClosing
                              ? {
                                   // 閉じる時：高さから幅の順序で2段階アニメーション
                                   height: [
                                      'auto',
                                      typeof window !== 'undefined' &&
                                      window.innerWidth >= 640
                                         ? '5rem'
                                         : '4rem',
                                   ],
                                   width: ['90vw', '12rem'],
                                   backgroundColor: [
                                      'rgba(30, 30, 30, 0.95)',
                                      'rgba(0, 0, 0, 0.95)',
                                   ],
                                   borderRadius: ['2rem', '2rem'],
                                   scale: [1, 0.98, 1],
                                }
                              : {
                                   // 開く時：幅から高さの順序で2段階アニメーション
                                   width: ['12rem', '90vw'],
                                   height: [
                                      typeof window !== 'undefined' &&
                                      window.innerWidth >= 640
                                         ? '5rem'
                                         : '4rem',
                                      'auto',
                                   ],
                                   backgroundColor: [
                                      'rgba(0, 0, 0, 0.95)',
                                      'rgba(20, 20, 20, 0.96)',
                                      'rgba(30, 30, 30, 0.95)',
                                   ],
                                   borderRadius: ['2rem', '1.9rem', '2rem'],
                                   scale: [1, 1.02, 1],
                                }
                        }
                        transition={
                           isClosing
                              ? {
                                   // 閉じる時：高さを先に変化させてから幅を変化
                                   height: {
                                      duration: 0.6,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                   width: {
                                      duration: 0.6,
                                      delay: 0.6,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                   backgroundColor: {
                                      duration: 1.2,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                   borderRadius: {
                                      duration: 1.2,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                   scale: {
                                      duration: 1.2,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                }
                              : {
                                   // 開く時：幅を先に変化させてから高さを変化
                                   width: {
                                      duration: 0.5,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                   height: {
                                      duration: 0.5,
                                      delay: 0.5,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                   backgroundColor: {
                                      duration: 1.0,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                   borderRadius: {
                                      duration: 1.0,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                   scale: {
                                      duration: 1.0,
                                      ease: [0.4, 0, 0.2, 1],
                                   },
                                }
                        }
                        className="relative mx-auto mb-5 flex max-w-sm flex-col overflow-hidden border border-neutral-600/30 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6"
                        style={{
                           backdropFilter: 'blur(20px)',
                           WebkitBackdropFilter: 'blur(20px)',
                           maxHeight: '80vh',
                           willChange:
                              'transform, width, height, background-color',
                           transform: 'translate3d(0, 0, 0)',
                           backfaceVisibility: 'hidden',
                           WebkitFontSmoothing: 'antialiased',
                        }}
                     >
                        {/* シンプルなグロー効果 */}
                        <motion.div
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={
                              isClosing
                                 ? { opacity: 0, scale: 0.95 }
                                 : {
                                      opacity: [0, 0.3, 0.1],
                                      scale: [0.95, 1.05, 1],
                                   }
                           }
                           transition={{
                              duration: isClosing ? 0.3 : 1.0,
                              delay: isClosing ? 0 : 0.1,
                              ease: [0.4, 0, 0.2, 1],
                           }}
                           className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-neutral-400/10 to-neutral-600/10 blur-xl"
                           style={{
                              willChange: 'transform, opacity',
                              transform: 'translate3d(0, 0, 0)',
                           }}
                        />

                        {/* ヘッダー（確認事項表示時のみ） */}
                        {!showConfirmationComplete && (
                           <motion.div
                              initial={{ opacity: 0, y: -30, scale: 0.8 }}
                              animate={
                                 isClosing
                                    ? { opacity: 0, scale: 0.8 }
                                    : {
                                         opacity: 1,
                                         y: 0,
                                         scale: [0.8, 1.1, 1],
                                      }
                              }
                              transition={
                                 isClosing
                                    ? { duration: 0.2 }
                                    : {
                                         delay: 0.8,
                                         duration: 0.8,
                                         ease: [0.68, -0.55, 0.265, 1.55],
                                      }
                              }
                              className="relative z-10 mb-4 text-center"
                           >
                              <motion.h3
                                 initial={{ letterSpacing: '0.1em' }}
                                 animate={{
                                    letterSpacing: ['0.1em', '0.2em', '0.05em'],
                                 }}
                                 transition={{ duration: 1, delay: 1 }}
                                 className="mb-2 font-bold text-lg text-white tracking-tight"
                              >
                                 録音前の確認
                              </motion.h3>
                              <motion.p
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: [0, 1] }}
                                 transition={{ delay: 1.2, duration: 0.6 }}
                                 className="font-normal text-base text-neutral-200 leading-relaxed"
                              >
                                 以下の項目をご確認ください
                              </motion.p>
                           </motion.div>
                        )}
                        {/* 確認事項リスト */}
                        {!showConfirmationComplete ? (
                           <>
                              <InstructionsList
                                 items={instructionItems}
                                 isClosing={isClosing}
                              />

                              {/* 確認ボタン */}
                              <ConfirmButton
                                 onClick={handleAgree}
                                 isConfirmed={isAgreed}
                                 isClosing={isClosing}
                              />
                           </>
                        ) : (
                           <>
                              {/* 確認完了画面 */}
                              <ConfirmationComplete isClosing={isClosing} />

                              {/* スライドバー（確認完了後のみ表示） */}
                              <motion.div
                                 initial={{ opacity: 0, y: 50, scale: 0.8 }}
                                 animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: [0.8, 1.1, 1],
                                 }}
                                 transition={{
                                    delay: 1.2,
                                    duration: 0.8,
                                    ease: [0.68, -0.55, 0.265, 1.55],
                                 }}
                                 className="relative z-10 w-full"
                              >
                                 <SlideToStart
                                    onComplete={handleStartRecording}
                                    disabled={false}
                                    text="録音開始"
                                    className="px-0"
                                 />
                              </motion.div>
                           </>
                        )}
                     </motion.div>
                  )}
               </motion.div>
            )}
         </AnimatePresence>

         {/* 録音中のUI */}
         <AnimatePresence>
            {status !== 'idle' && (
               <motion.div
                  ref={constraintsRef}
                  initial={{ y: '100%' }}
                  animate={{ y: isExpanded ? '5vh' : 'calc(100% - 110px)' }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed inset-x-0 bottom-0"
                  style={{ height: isExpanded ? '95vh' : 'auto' }}
               >
                  <motion.div
                     drag="y"
                     dragConstraints={constraintsRef}
                     dragElastic={0.2}
                     onDragEnd={handleDragEnd}
                     className="h-full overflow-hidden rounded-t-3xl bg-white/98 shadow-2xl backdrop-blur-xl sm:rounded-t-[2rem]"
                  >
                     {/* ドラッグハンドル */}
                     <button
                        type="button"
                        onClick={(e) => {
                           e.preventDefault()
                           e.stopPropagation()
                           setIsExpanded(!isExpanded)
                        }}
                        className="flex w-full cursor-grab touch-manipulation justify-center py-3 transition-colors hover:bg-gray-50/50 active:cursor-grabbing"
                        aria-label={isExpanded ? '収縮' : '展開'}
                     >
                        <div className="h-1 w-10 rounded-full bg-gray-300" />
                     </button>

                     {/* メインコンテンツ */}
                     <div
                        className={`${isExpanded ? 'flex h-full flex-col' : 'px-4 pb-6 sm:px-6'}`}
                     >
                        {/* ミニマム表示（非展開時のみ表示） */}
                        {!isExpanded && (
                           <div className="flex h-16 items-center justify-between">
                              {/* 録音ボタン */}
                              <motion.button
                                 onClick={() => {
                                    if (status === 'recording') {
                                       handleStop()
                                    }
                                 }}
                                 className={`relative flex h-14 w-14 touch-manipulation items-center justify-center rounded-full shadow-lg transition-all duration-300 sm:h-16 sm:w-16 ${
                                    status === 'recording'
                                       ? 'bg-red-600 hover:bg-red-700'
                                       : status === 'completed'
                                         ? 'cursor-not-allowed bg-gray-400'
                                         : 'bg-gray-600 hover:bg-gray-700'
                                 }
                    `}
                                 style={{
                                    cursor:
                                       status === 'completed'
                                          ? 'not-allowed'
                                          : 'pointer',
                                 }}
                                 whileTap={
                                    status !== 'completed'
                                       ? { scale: 0.95 }
                                       : {}
                                 }
                                 whileHover={
                                    status !== 'completed'
                                       ? { scale: 1.05 }
                                       : {}
                                 }
                                 disabled={status === 'completed'}
                              >
                                 {status === 'recording' ? (
                                    <MdStop className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                                 ) : status === 'completed' ? (
                                    <motion.div
                                       className="h-6 w-6 rounded-full border-3 border-white border-t-transparent sm:h-8 sm:w-8"
                                       animate={{ rotate: 360 }}
                                       transition={{
                                          duration: 1,
                                          repeat: Number.POSITIVE_INFINITY,
                                          ease: 'linear',
                                       }}
                                    />
                                 ) : (
                                    <motion.div
                                       initial={{ scale: 0 }}
                                       animate={{ scale: 1 }}
                                       className="h-5 w-5 rounded-full bg-white sm:h-6 sm:w-6"
                                    />
                                 )}

                                 {/* 録音中のパルスエフェクト */}
                                 <PulseEffect
                                    isActive={status === 'recording'}
                                    borderColor="border-red-500"
                                 />
                              </motion.button>

                              {/* 波形表示 */}
                              <div className="mx-3 flex-1 sm:mx-6">
                                 <WaveformDisplay
                                    isRecording={status === 'recording'}
                                    isCompleted={status === 'completed'}
                                    recordingTime={recordingTime}
                                    waveformData={waveformData}
                                    height={48}
                                    className="h-12"
                                    waveColor="#000000"
                                    backgroundColor="#f3f4f6"
                                    key={`mini-${status}-${recordingTime}`}
                                 />
                              </div>

                              {/* タイマー */}
                              <motion.div
                                 initial={{ opacity: 0, scale: 0.8 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="min-w-[90px] text-right sm:min-w-[100px]"
                              >
                                 <div className="font-medium font-mono text-gray-900 text-xl sm:text-2xl">
                                    {formatTime(recordingTime)}
                                 </div>
                                 <div className="text-gray-500 text-xs">
                                    {status === 'recording' ? '録音中' : '完了'}
                                 </div>
                              </motion.div>
                           </div>
                        )}

                        {/* 展開時のコンテンツ */}
                        <AnimatePresence>
                           {isExpanded && (
                              <motion.div
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                                 transition={{ duration: 0.3 }}
                                 className="flex flex-1 flex-col"
                              >
                                 {/* ヘッダー部分 - 下部のpadding調整 */}
                                 <div className="relative flex items-center justify-between px-6 py-4 pb-2 sm:px-8 sm:pb-3">
                                    <button
                                       type="button"
                                       onClick={() => {
                                          handleStop()
                                          setIsExpanded(false)
                                       }}
                                       className="touch-manipulation font-medium text-base text-gray-600 transition-colors hover:text-gray-900 sm:text-lg"
                                    >
                                       キャンセル
                                    </button>

                                    <div className="-translate-x-1/2 absolute left-1/2 flex transform items-center gap-2">
                                       <BlinkingIndicator
                                          isActive={status === 'recording'}
                                          size="w-2 h-2"
                                          color="bg-red-500"
                                       />
                                       <span className="font-medium text-base text-gray-900 sm:text-lg">
                                          録音中
                                       </span>
                                    </div>

                                    <button
                                       type="button"
                                       onClick={() => {
                                          handleStop()
                                       }}
                                       className="touch-manipulation font-medium text-base text-gray-900 transition-colors hover:text-gray-700 sm:text-lg"
                                    >
                                       次へ
                                    </button>
                                 </div>

                                 {/* メインコンテンツエリア - コンテンツを上部寄りに配置 */}
                                 <div className="flex flex-1 flex-col items-center justify-start px-6 pt-4 sm:px-8">
                                    {/* タイマー表示 - 上部マージンを削除 */}
                                    <motion.div
                                       initial={{ scale: 0.8, opacity: 0 }}
                                       animate={{ scale: 1, opacity: 1 }}
                                       transition={{ delay: 0.1 }}
                                       className="mt-8 mb-8 sm:mt-10 sm:mb-10"
                                    >
                                       <div className="font-light font-mono text-6xl text-gray-900 tracking-wider sm:text-7xl lg:text-8xl">
                                          {formatTime(recordingTime)}
                                       </div>
                                    </motion.div>

                                    {/* 波形表示 - 余白を調整 */}
                                    <motion.div
                                       initial={{ scale: 0.9, opacity: 0 }}
                                       animate={{ scale: 1, opacity: 1 }}
                                       transition={{ delay: 0.2 }}
                                       className="mb-4 w-full max-w-2xl px-4"
                                    >
                                       <WaveformDisplay
                                          isRecording={status === 'recording'}
                                          isCompleted={status === 'completed'}
                                          recordingTime={recordingTime}
                                          waveformData={waveformData}
                                          height={160}
                                          className="h-32 sm:h-40"
                                          waveColor="#000000"
                                          backgroundColor="#f3f4f6"
                                          key={`expanded-${status}-${recordingTime}`}
                                       />
                                    </motion.div>
                                 </div>

                                 {/* 一時停止ボタン - 画面下部に固定配置 */}
                                 <motion.div
                                    className="fixed right-0 bottom-20 left-0 flex justify-center sm:bottom-10 md:bottom-12"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                       delay: 0.3,
                                       type: 'spring',
                                       stiffness: 200,
                                    }}
                                 >
                                    <motion.button
                                       onClick={() => {
                                          if (status === 'recording') {
                                             handleStop()
                                          }
                                       }}
                                       className="relative z-50 flex h-20 w-20 touch-manipulation items-center justify-center rounded-full bg-gray-100 shadow-lg transition-all duration-300 hover:bg-gray-200 sm:h-24 sm:w-24"
                                       whileTap={{ scale: 0.95 }}
                                    >
                                       {/* 一時停止アイコン */}
                                       <div className="flex items-center gap-1.5">
                                          <div className="h-8 w-1 rounded-full bg-gray-900 sm:h-10" />
                                          <div className="h-8 w-1 rounded-full bg-gray-900 sm:h-10" />
                                       </div>

                                       {/* リップルエフェクト */}
                                       <RippleEffect
                                          isActive={status === 'recording'}
                                          borderColor="border-gray-400"
                                       />
                                    </motion.button>
                                 </motion.div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* 音声再生モーダル */}
         <AnimatePresence>
            {showPlayback && audioData && (
               <AudioPlayback
                  audioData={audioData}
                  onClose={handleClosePlayback}
                  currentPosition={currentPosition}
               />
            )}
         </AnimatePresence>
      </div>
   )
}
