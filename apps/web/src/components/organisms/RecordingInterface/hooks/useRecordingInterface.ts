"use client"

import type { PanInfo } from "framer-motion"
import { useEffect, useRef, useState } from "react"
// TODO: Next.js が React 19 の useEffectEvent に対応したら削除する
import { useEffectEvent } from "use-effect-event"
import { useRecorderStore } from "../../../../store/useRecorderStore"
// 実際のMediaRecorder APIを使用
import { useMediaRecorder } from "../../RecordSection/hooks/useMediaRecorder"
import { useAsyncWaveform } from "./useAsyncWaveform"

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
   const [status, setStatus] = useState<"idle" | "recording" | "completed">(
      "idle",
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
   const constraintsRef = useRef<HTMLDivElement>(null)

   // 非同期波形データフック
   const waveformData = useAsyncWaveform(status === "recording")

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
         document.addEventListener("mousedown", handleClickOutside)
         document.addEventListener("touchstart", handleClickOutside)
      }, 300)

      return () => {
         clearTimeout(timeoutId)
         document.removeEventListener("mousedown", handleClickOutside)
         document.removeEventListener("touchstart", handleClickOutside)
      }
   }, [showInstructions])

   // 録音開始時刻を記録
   const recordingStartTimeRef = useRef<number | null>(null)
   // 10秒タイマーのref
   const tenSecondTimerRef = useRef<NodeJS.Timeout | null>(null)

   // 録音時間のカウント（requestAnimationFrameを使用）
   useEffect(() => {
      if (status !== "recording") return

      recordingStartTimeRef.current = performance.now()
      let animationId: number

      const updateTime = (currentTime: number) => {
         if (recordingStartTimeRef.current === null) return

         const elapsedTime =
            (currentTime - recordingStartTimeRef.current) / 1000

         // 時間表示は最大10秒でクリップ
         setRecordingTime(Math.min(elapsedTime, 10))

         // MediaRecorderが自動的に10秒で停止するため、
         // ここでの手動停止は不要

         animationId = requestAnimationFrame(updateTime)
      }

      animationId = requestAnimationFrame(updateTime)

      return () => {
         cancelAnimationFrame(animationId)
         recordingStartTimeRef.current = null
      }
   }, [status])

   // 展開状態が変更されたときに親コンポーネントに通知
   // isExpandedとstatusはhookの内部ロジックに密接に関連しており、親に持ち上げるのは過度に複雑
   // 親が展開状態を知る必要がある場合（例：他のUIの調整）にこのコールバックが使用される
   const onExpandedChangeEvent = useEffectEvent((expanded: boolean) => {
      onExpandedChange?.(expanded)
   })

   useEffect(() => {
      onExpandedChangeEvent(isExpanded && status !== "idle")
   }, [isExpanded, status])

   // 録音完了後、audioDataが設定されたら再生画面を表示
   useEffect(() => {
      if (status === "completed" && audioData) {
         setShowPlayback(true)
         setStatus("idle")
         setRecordingTime(0)
         setIsExpanded(false)
         // 確認関連の状態をリセット
         setIsAgreed(false)
         setShowConfirmationComplete(false)
         setShowInstructions(false)
      }
   }, [status, audioData])

   // MediaRecorderの自動停止を検知
   useEffect(() => {
      if (audioData && status === "recording") {
         // MediaRecorderが停止してaudioDataが設定された場合、
         // 自動的に録音完了状態に遷移
         console.log("🎵 録音完了を検知:", { audioData: audioData.id, status })
         setStatus("completed")
      }
   }, [audioData, status])

   const handleRecord = async () => {
      // 注意書きを表示
      setShowInstructions(true)
   }

   const handleStartRecording = async () => {
      try {
         setStatus("recording")
         setRecordingTime(0)
         setShowInstructions(false)
         // 確認関連の状態をリセット
         setIsAgreed(false)
         setShowConfirmationComplete(false)

         // 前回のaudioDataをクリア（新しい録音のため）
         const { resetRecording } = useRecorderStore.getState()
         resetRecording()

         await startRecording()

         // MediaRecorderレベルで10秒タイマーが設定されているため、
         // ここでは追加のタイマーは不要
      } catch (error) {
         console.error("録音の開始に失敗しました:", error)
         setStatus("idle")
         setShowInstructions(false)
         // エラーメッセージを表示（将来的にはUIで表示）
         alert(
            `録音の開始に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
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
         setStatus("completed")
         // 10秒タイマーをクリア
         if (tenSecondTimerRef.current) {
            clearTimeout(tenSecondTimerRef.current)
            tenSecondTimerRef.current = null
         }
         await stopRecording()
      } catch (error) {
         console.error("録音の停止に失敗しました:", error)
         setStatus("idle")
      }
   }

   const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      const milliseconds = Math.floor((time % 1) * 100)
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
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
      "マイクへのアクセス許可が必要です",
      "録音は最大10秒まで自動停止します",
      "録音中にもう一度ボタンを押すと録音を停止します",
      "周囲の雑音が多いと AI 分類の精度が低下する場合があります",
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
