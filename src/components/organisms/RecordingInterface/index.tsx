'use client'

import { AnimatePresence, PanInfo, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { MdMic, MdStop } from 'react-icons/md'
import { WaveformDisplay } from '../../molecules/WaveformDisplay'
// 仮実装のモックを使用
import { useMediaRecorderMock } from '../RecordSection/hooks/useMediaRecorderMock'
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [status, setStatus] = useState<'idle' | 'recording' | 'completed'>(
    'idle',
  )
  const [recordingTime, setRecordingTime] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  // モック実装を使用
  const { startRecording, stopRecording } = useMediaRecorderMock()
  const constraintsRef = useRef(null)

  // 録音時間のカウント（requestAnimationFrameを使用）
  useEffect(() => {
    if (status !== 'recording') return

    let animationId: number
    let lastTime = performance.now()

    const updateTime = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000 // ミリ秒を秒に変換
      lastTime = currentTime

      setRecordingTime((prev) => {
        const newTime = prev + deltaTime
        return newTime >= 10 ? 10 : newTime
      })

      animationId = requestAnimationFrame(updateTime)
    }

    animationId = requestAnimationFrame(updateTime)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [status])

  // 10秒で自動停止
  useEffect(() => {
    if (recordingTime >= 10 && status === 'recording') {
      handleStop()
    }
  }, [recordingTime, status])

  // 波形データのシミュレーション（更新頻度を下げる）
  useEffect(() => {
    if (status === 'recording') {
      const interval = setInterval(() => {
        const newData = Array.from({ length: 3 }, () => Math.random() * 40 + 30)
        setWaveformData((prev) => [...prev.slice(-27), ...newData])
      }, 200) // 200msごとに更新
      return () => clearInterval(interval)
    }
  }, [status])

  // 展開状態が変更されたときに親コンポーネントに通知
  useEffect(() => {
    onExpandedChange?.(isExpanded && status !== 'idle')
  }, [isExpanded, status, onExpandedChange])

  const handleRecord = async () => {
    try {
      console.log('録音を開始します...')
      setStatus('recording')
      setRecordingTime(0)
      setWaveformData([])
      await startRecording()
      console.log('録音が開始されました')
    } catch (error) {
      console.error('録音の開始に失敗しました:', error)
      setStatus('idle')
      // モック実装なのでアラートは表示しない
    }
  }

  const handleStop = async () => {
    try {
      console.log('録音を停止します...', { currentStatus: status })
      setStatus('completed')
      await stopRecording()
      console.log('録音が停止されました', { newStatus: 'completed' })

      // デバッグ: 状態変更後の確認
      setTimeout(() => {
        console.log('Status after stop:', status)
      }, 100)

      setTimeout(() => {
        setStatus('idle')
        setRecordingTime(0)
        setWaveformData([])
        setIsExpanded(false)
      }, 2000)
    } catch (error) {
      console.error('録音の停止に失敗しました:', error)
      setStatus('idle')
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y < -50) {
      setIsExpanded(true)
    } else if (info.offset.y > 50) {
      setIsExpanded(false)
    }
  }

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
            <motion.button
              onClick={handleRecord}
              className="w-48 h-16 sm:w-20 sm:h-20 mb-5 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center shadow-2xl transition-all duration-300 touch-manipulation"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <MdMic className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </motion.button>
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

                      {/* 録音中のパルスエフェクト（will-changeで最適化） */}
                      {status === 'recording' && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-red-500 will-change-transform"
                          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
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
                      {/* ヘッダー部分 */}
                      <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-6 relative">
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
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
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

                      {/* メインコンテンツエリア */}
                      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 py-8">
                        {/* タイマー表示 */}
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="mb-12 sm:mb-16"
                        >
                          <div className="font-mono text-6xl sm:text-7xl lg:text-8xl font-light text-gray-900 tracking-wider">
                            {formatTime(recordingTime)}
                          </div>
                        </motion.div>

                        {/* 波形表示 */}
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="w-full max-w-2xl px-4"
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

                      {/* 下部のコントロール */}
                      <div className="pb-6 sm:pb-8 flex justify-center">
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.3,
                            type: 'spring',
                            stiffness: 200,
                          }}
                          onClick={() => {
                            if (status === 'recording') {
                              handleStop()
                            }
                          }}
                          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300 shadow-lg touch-manipulation"
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* 一時停止アイコン */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-8 sm:h-10 bg-gray-900 rounded-full" />
                            <div className="w-1 h-8 sm:h-10 bg-gray-900 rounded-full" />
                          </div>

                          {/* リップルエフェクト（will-changeで最適化） */}
                          {status === 'recording' && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-gray-400 will-change-transform"
                              animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                        </motion.button>
                      </div>
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
