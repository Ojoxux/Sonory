'use client'

import { PanInfo } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useRecorderStore } from '../../../../store/useRecorderStore'
// 実際のMediaRecorder APIを使用
import { useMediaRecorder } from '../../RecordSection/hooks/useMediaRecorder'
import { useAsyncWaveform } from './useAsyncWaveform'

/**
 * RecordingInterfaceで使用する状態と機能をまとめたカスタムフック
 *
 * @param onExpandedChange 展開状態が変更されたときに呼び出されるコールバック関数
 * @returns 録音インターフェースで使用する状態と機能
 */
export function useRecordingInterface(
  onExpandedChange?: (isExpanded: boolean) => void,
) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [status, setStatus] = useState<'idle' | 'recording' | 'completed'>(
    'idle',
  )
  const [recordingTime, setRecordingTime] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showPlayback, setShowPlayback] = useState(false)
  const [isAgreed, setIsAgreed] = useState(false)
  const [showConfirmationComplete, setShowConfirmationComplete] =
    useState(false)

  // 実際のMediaRecorder APIを使用
  const {
    startRecording,
    stopRecording,
    error: recordingError,
  } = useMediaRecorder()
  const { audioData } = useRecorderStore()
  const constraintsRef = useRef(null)

  // 非同期波形データフック
  const waveformData = useAsyncWaveform(status === 'recording')

  // 外部クリック検知用のref
  const instructionsRef = useRef<HTMLDivElement>(null)

  // 外部クリック検知
  useEffect(() => {
    if (!showInstructions) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        instructionsRef.current &&
        !instructionsRef.current.contains(event.target as Node)
      ) {
        handleCloseInstructions()
      }
    }

    // イベントリスナーを追加（少し遅延させて、開くアニメーション中のクリックを無視）
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showInstructions])

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

  // 展開状態が変更されたときに親コンポーネントに通知
  useEffect(() => {
    onExpandedChange?.(isExpanded && status !== 'idle')
  }, [isExpanded, status, onExpandedChange])

  // 録音完了後、audioDataが設定されたら再生画面を表示
  useEffect(() => {
    console.log('useEffect triggered:', {
      status,
      hasAudioData: !!audioData,
      audioData,
    })
    if (status === 'completed' && audioData) {
      console.log('AudioData detected, showing playback screen')
      setShowPlayback(true)
      setStatus('idle')
      setRecordingTime(0)
      setIsExpanded(false)
      // 確認関連の状態をリセット
      setIsAgreed(false)
      setShowConfirmationComplete(false)
      setShowInstructions(false)
    }
  }, [status, audioData])

  const handleRecord = async () => {
    // 注意書きを表示
    setShowInstructions(true)
  }

  const handleStartRecording = async () => {
    try {
      console.log('録音を開始します...')
      setStatus('recording')
      setRecordingTime(0)
      setShowInstructions(false)
      // 確認関連の状態をリセット
      setIsAgreed(false)
      setShowConfirmationComplete(false)
      await startRecording()
      console.log('録音が開始されました')
    } catch (error) {
      console.error('録音の開始に失敗しました:', error)
      setStatus('idle')
      setShowInstructions(false)
      // エラーメッセージを表示（将来的にはUIで表示）
      alert(
        `録音の開始に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      )
    }
  }

  const handleAgree = () => {
    setIsAgreed(true)
    // 確認ボタンのアニメーション完了まで待ってから確認完了画面を表示
    setTimeout(() => {
      setShowConfirmationComplete(true)
    }, 1200)
  }

  const handleStop = async () => {
    try {
      console.log('録音を停止します...', { currentStatus: status })
      setStatus('completed')
      await stopRecording()
      console.log('録音が停止されました', { newStatus: 'completed' })
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

  const handleClosePlayback = () => {
    setShowPlayback(false)
    // 次回の録音のために確認関連の状態をリセット
    setIsAgreed(false)
    setShowConfirmationComplete(false)
    setShowInstructions(false)
    setIsClosing(false)
  }

  const handleCloseInstructions = () => {
    setIsClosing(true)
    // アニメーション完了後に状態をリセット
    setTimeout(() => {
      setShowInstructions(false)
      setIsClosing(false)
      setIsAgreed(false)
      setShowConfirmationComplete(false)
    }, 1200) // クローズアニメーションの時間に合わせる（0.6 + 0.6 = 1.2秒）
  }

  const instructionItems = [
    'マイクへのアクセス許可が必要です',
    '録音は最大10秒まで自動停止します',
    '録音中にもう一度ボタンを押すと録音を停止します',
    '周囲の雑音が多いと AI 分類の精度が低下する場合があります',
  ]

  return {
    isExpanded,
    setIsExpanded,
    status,
    setStatus,
    recordingTime,
    showInstructions,
    setShowInstructions,
    isClosing,
    setIsClosing,
    showPlayback,
    isAgreed,
    showConfirmationComplete,
    setShowConfirmationComplete,
    constraintsRef,
    instructionsRef,
    waveformData,
    audioData,
    handleRecord,
    handleStartRecording,
    handleAgree,
    handleStop,
    handleClosePlayback,
    handleCloseInstructions,
    formatTime,
    handleDragEnd,
    instructionItems,
    recordingError,
  }
}
