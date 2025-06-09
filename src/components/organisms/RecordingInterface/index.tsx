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
 */
export function RecordingInterface({
  className = '',
  onExpandedChange,
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
      className={`fixed bottom-0 left-0 right-0 pointer-events-auto ${className}`}
      style={{ zIndex: status !== 'idle' && isExpanded ? 110 : 50 }}
    >
      {/* 初期状態の録音ボタン（録音していない時のみ表示） */}
      <AnimatePresence>
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 safe-bottom"
          >
            {!showInstructions ? (
              <motion.button
                onClick={handleRecord}
                className="w-48 h-16 sm:w-20 sm:h-20 mb-5 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center shadow-2xl transition-all duration-300 touch-manipulation"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <MdMic className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </motion.button>
            ) : (
              <motion.div
                ref={instructionsRef}
                initial={{
                  width: '12rem',
                  height:
                    typeof window !== 'undefined' && window.innerWidth >= 640
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
                className="shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-neutral-600/30 p-4 sm:p-6 mb-5 overflow-hidden flex flex-col relative max-w-sm mx-auto"
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  maxHeight: '80vh',
                  willChange: 'transform, width, height, background-color',
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
                  className="absolute inset-0 bg-gradient-to-br from-neutral-400/10 to-neutral-600/10 rounded-[2rem] blur-xl"
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
                    className="text-center mb-4 relative z-10"
                  >
                    <motion.h3
                      initial={{ letterSpacing: '0.1em' }}
                      animate={{ letterSpacing: ['0.1em', '0.2em', '0.05em'] }}
                      transition={{ duration: 1, delay: 1 }}
                      className="text-white text-lg font-bold mb-2 tracking-tight"
                    >
                      録音前の確認
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1] }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                      className="text-neutral-200 text-base font-normal leading-relaxed"
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
              className="h-full bg-white/98 backdrop-blur-xl rounded-t-3xl sm:rounded-t-[2rem] shadow-2xl overflow-hidden"
            >
              {/* ドラッグハンドル */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="w-full flex justify-center py-3 hover:bg-gray-50/50 transition-colors cursor-grab active:cursor-grabbing touch-manipulation"
                aria-label={isExpanded ? '収縮' : '展開'}
              >
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </button>

              {/* メインコンテンツ */}
              <div
                className={`${isExpanded ? 'h-full flex flex-col' : 'px-4 sm:px-6 pb-6'}`}
              >
                {/* ミニマム表示（非展開時のみ表示） */}
                {!isExpanded && (
                  <div className="flex items-center justify-between h-16">
                    {/* 録音ボタン */}
                    <motion.button
                      onClick={() => {
                        console.log('録音ボタンがクリックされました', {
                          status,
                        })
                        if (status === 'recording') {
                          handleStop()
                        }
                      }}
                      className={`
                      relative rounded-full flex items-center justify-center
                      transition-all duration-300 shadow-lg touch-manipulation
                      w-14 h-14 sm:w-16 sm:h-16
                      ${
                        status === 'recording'
                          ? 'bg-red-600 hover:bg-red-700'
                          : status === 'completed'
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gray-600 hover:bg-gray-700'
                      }
                    `}
                      style={{
                        cursor:
                          status === 'completed' ? 'not-allowed' : 'pointer',
                      }}
                      whileTap={status !== 'completed' ? { scale: 0.95 } : {}}
                      whileHover={status !== 'completed' ? { scale: 1.05 } : {}}
                      disabled={status === 'completed'}
                    >
                      {status === 'recording' ? (
                        <MdStop className="text-white w-6 h-6 sm:w-8 sm:h-8" />
                      ) : status === 'completed' ? (
                        <motion.div
                          className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      ) : (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-white rounded-full w-5 h-5 sm:w-6 sm:h-6"
                        />
                      )}

                      {/* 録音中のパルスエフェクト */}
                      <PulseEffect
                        isActive={status === 'recording'}
                        borderColor="border-red-500"
                      />
                    </motion.button>

                    {/* 波形表示 */}
                    <div className="flex-1 mx-3 sm:mx-6">
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
                      className="text-right min-w-[90px] sm:min-w-[100px]"
                    >
                      <div className="font-mono font-medium text-gray-900 text-xl sm:text-2xl">
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
                      className="flex-1 flex flex-col"
                    >
                      {/* ヘッダー部分 - 下部のpadding調整 */}
                      <div className="flex justify-between items-center px-6 sm:px-8 py-4 pb-2 sm:pb-3 relative">
                        <button
                          onClick={() => {
                            handleStop()
                            setIsExpanded(false)
                          }}
                          className="text-gray-600 hover:text-gray-900 font-medium text-base sm:text-lg transition-colors touch-manipulation"
                        >
                          キャンセル
                        </button>

                        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                          <BlinkingIndicator
                            isActive={status === 'recording'}
                            size="w-2 h-2"
                            color="bg-red-500"
                          />
                          <span className="text-gray-900 font-medium text-base sm:text-lg">
                            録音中
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            handleStop()
                          }}
                          className="text-gray-900 hover:text-gray-700 font-medium text-base sm:text-lg transition-colors touch-manipulation"
                        >
                          次へ
                        </button>
                      </div>

                      {/* メインコンテンツエリア - コンテンツを上部寄りに配置 */}
                      <div className="flex-1 flex flex-col items-center justify-start pt-4 px-6 sm:px-8">
                        {/* タイマー表示 - 上部マージンを削除 */}
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="mt-8 sm:mt-10 mb-8 sm:mb-10"
                        >
                          <div className="font-mono text-6xl sm:text-7xl lg:text-8xl font-light text-gray-900 tracking-wider">
                            {formatTime(recordingTime)}
                          </div>
                        </motion.div>

                        {/* 波形表示 - 余白を調整 */}
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="w-full max-w-2xl px-4 mb-4"
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
                        className="fixed left-0 right-0 bottom-20 sm:bottom-10 md:bottom-12 flex justify-center"
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
                          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300 shadow-lg touch-manipulation z-50"
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* 一時停止アイコン */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-8 sm:h-10 bg-gray-900 rounded-full" />
                            <div className="w-1 h-8 sm:h-10 bg-gray-900 rounded-full" />
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
          <AudioPlayback audioData={audioData} onClose={handleClosePlayback} />
        )}
      </AnimatePresence>
    </div>
  )
}
