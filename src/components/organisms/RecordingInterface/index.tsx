'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { MdMic, MdStop } from 'react-icons/md'
import { BlinkingIndicator } from '../../atoms/BlinkingIndicator'
import { PulseEffect } from '../../atoms/PulseEffect'
import { RippleEffect } from '../../atoms/RippleEffect'
import { WaveformDisplay } from '../../molecules/WaveformDisplay'
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
    setShowInstructions,
    isClosing,
    setIsClosing,
    checkedItems,
    constraintsRef,
    waveformData,
    handleRecord,
    handleStartRecording,
    handleCheckboxChange,
    handleStop,
    formatTime,
    handleDragEnd,
    allItemsChecked,
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
                initial={{
                  width: '12rem',
                  height: '4rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  borderRadius: '2rem',
                  scale: 1,
                  rotateX: 0,
                  rotateY: 0,
                }}
                animate={
                  isClosing
                    ? {
                        // 閉じる時：高さから幅の順序で2段階アニメーション
                        height: ['26rem', '4rem'],
                        width: ['20rem', '12rem'],
                        backgroundColor: [
                          'rgba(30, 30, 30, 0.95)',
                          'rgba(0, 0, 0, 0.95)',
                        ],
                        borderRadius: ['2rem', '2rem'],
                        scale: [1, 1],
                        rotateX: [0, 0],
                        rotateY: [0, 0],
                      }
                    : {
                        // 開く時：幅から高さの順序で2段階アニメーション
                        width: ['12rem', '20rem'],
                        height: ['4rem', '26rem'],
                        backgroundColor: [
                          'rgba(0, 0, 0, 0.95)',
                          'rgba(30, 30, 30, 0.95)',
                        ],
                        borderRadius: ['2rem', '2rem'],
                        scale: [1, 1],
                        rotateX: [0, 0],
                        rotateY: [0, 0],
                      }
                }
                transition={
                  isClosing
                    ? {
                        // 閉じる時：高さを先に変化させてから幅を変化
                        height: {
                          duration: 0.6,
                          times: [0, 1],
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        width: {
                          duration: 0.6,
                          delay: 0.6, // 高さのアニメーション完了後に開始
                          times: [0, 1],
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        backgroundColor: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        borderRadius: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        scale: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        rotateX: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        rotateY: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                      }
                    : {
                        // 開く時：幅を先に変化させてから高さを変化
                        width: {
                          duration: 0.6,
                          times: [0, 1],
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        height: {
                          duration: 0.6,
                          delay: 0.6, // 幅のアニメーション完了後に開始
                          times: [0, 1],
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        backgroundColor: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        borderRadius: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        scale: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        rotateX: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                        rotateY: {
                          duration: 1.2,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        },
                      }
                }
                className="shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-neutral-600/30 p-4 mb-5 overflow-hidden flex flex-col relative"
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  perspective: '1000px',
                  transformStyle: 'preserve-3d',
                }}
              >
                ｓ{/* グロー効果 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.2, 1] }}
                  transition={{
                    duration: 1.5,
                    delay: 0.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-neutral-400/10 to-neutral-600/10 rounded-[2rem] blur-xl"
                />
                {/* ヘッダー */}
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
                {/* チェックボックスリスト */}
                <motion.div
                  className="space-y-2 mb-4 flex-1 relative z-10"
                  animate={
                    isClosing
                      ? { opacity: 0, scale: 0.9 }
                      : { opacity: 1, scale: 1 }
                  }
                  transition={
                    isClosing
                      ? { duration: 0.2 }
                      : { duration: 0.3, delay: 1.2 }
                  }
                >
                  {instructionItems.map((item, index) => (
                    <motion.div
                      key={item.key}
                      initial={{
                        opacity: 0,
                        x: -50,
                        rotateY: -90,
                        scale: 0.8,
                      }}
                      animate={
                        isClosing
                          ? { opacity: 0, x: -30, scale: 0.8 }
                          : {
                              opacity: 1,
                              x: 0,
                              rotateY: 0,
                              scale: 1,
                            }
                      }
                      transition={
                        isClosing
                          ? { duration: 0.2, delay: index * 0.05 }
                          : {
                              delay: 1.2 + index * 0.15,
                              duration: 0.8,
                              ease: [0.68, -0.55, 0.265, 1.55],
                            }
                      }
                      className="flex items-start gap-2.5 p-2 rounded-md bg-black/20 backdrop-blur-sm border border-neutral-700/50"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <motion.button
                        onClick={() => handleCheckboxChange(item.key)}
                        className={`
                          w-5 h-5 rounded-md flex items-center justify-center mt-0.5 flex-shrink-0 relative
                          transition-all duration-300 ease-out border-2
                          ${
                            checkedItems[item.key]
                              ? 'bg-white border-white shadow-[0_4px_12px_rgba(255,255,255,0.3)]'
                              : 'bg-transparent border-neutral-400 hover:border-neutral-300 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                          }
                        `}
                        whileTap={{
                          scale: 0.7,
                          rotate: 360,
                        }}
                        whileHover={{
                          scale: 1.2,
                          boxShadow: '0 8px 25px rgba(255,255,255,0.4)',
                        }}
                        animate={
                          checkedItems[item.key]
                            ? {
                                boxShadow: [
                                  '0 4px 12px rgba(255,255,255,0.3)',
                                  '0 8px 25px rgba(255,255,255,0.5)',
                                  '0 4px 12px rgba(255,255,255,0.3)',
                                ],
                              }
                            : {}
                        }
                        transition={{
                          boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          },
                        }}
                      >
                        {checkedItems[item.key] && (
                          <>
                            <motion.svg
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{
                                scale: [0, 1.3, 1],
                                rotate: [-180, 0, 360, 0],
                              }}
                              transition={{
                                duration: 0.8,
                                ease: [0.68, -0.55, 0.265, 1.55],
                              }}
                              className="w-3 h-3 text-black relative z-10"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </motion.svg>
                            {/* チェック時のパーティクル */}
                            {[...Array(6)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: [0, 1, 0],
                                  scale: [0, 1, 0],
                                  x: [0, (Math.random() - 0.5) * 40],
                                  y: [0, (Math.random() - 0.5) * 40],
                                }}
                                transition={{
                                  duration: 1,
                                  delay: i * 0.1,
                                  ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                                className="absolute w-1 h-1 bg-neutral-400 rounded-full"
                                style={{
                                  left: '50%',
                                  top: '50%',
                                  transform: 'translate(-50%, -50%)',
                                }}
                              />
                            ))}
                          </>
                        )}
                      </motion.button>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: 1.4 + index * 0.15,
                          duration: 0.6,
                        }}
                        className="text-neutral-100 text-sm leading-relaxed font-medium"
                      >
                        {item.text}
                      </motion.span>
                    </motion.div>
                  ))}
                </motion.div>
                {/* 録音開始ボタン */}
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={
                    isClosing
                      ? { opacity: 0, y: 30, scale: 0.8 }
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
                          delay: 2,
                          duration: 0.8,
                          ease: [0.68, -0.55, 0.265, 1.55],
                        }
                  }
                  className="flex gap-2.5 mt-auto relative z-10"
                >
                  <motion.button
                    onClick={() => {
                      setIsClosing(true)
                      // アニメーション完了後にshowInstructionsをfalseにする
                      setTimeout(() => {
                        setShowInstructions(false)
                        setIsClosing(false)
                      }, 1200) // 閉じるアニメーション時間と同じ
                    }}
                    className="flex-1 py-2.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.4)] relative overflow-hidden border border-neutral-600"
                    whileTap={{ scale: 0.95, rotateX: 5 }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-400/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                    キャンセル
                  </motion.button>
                  <motion.button
                    onClick={handleStartRecording}
                    disabled={!allItemsChecked}
                    className={`
                      flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all duration-300 relative overflow-hidden border
                      ${
                        allItemsChecked
                          ? 'bg-white hover:bg-neutral-50 text-black shadow-[0_8px_24px_rgba(255,255,255,0.4)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.5)] border-white'
                          : 'bg-neutral-700 text-neutral-400 cursor-not-allowed shadow-[0_2px_8px_rgba(0,0,0,0.3)] border-neutral-600'
                      }
                    `}
                    whileTap={
                      allItemsChecked ? { scale: 0.95, rotateX: 5 } : {}
                    }
                    whileHover={
                      allItemsChecked
                        ? {
                            scale: 1.05,
                            boxShadow: '0 15px 35px rgba(255,255,255,0.6)',
                          }
                        : {}
                    }
                    animate={
                      allItemsChecked
                        ? {
                            boxShadow: [
                              '0 8px 24px rgba(255,255,255,0.4)',
                              '0 12px 32px rgba(255,255,255,0.6)',
                              '0 8px 24px rgba(255,255,255,0.4)',
                            ],
                          }
                        : {}
                    }
                    transition={{
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }}
                  >
                    {allItemsChecked && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-600/20 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      />
                    )}
                    録音開始
                  </motion.button>
                </motion.div>
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
    </div>
  )
}
