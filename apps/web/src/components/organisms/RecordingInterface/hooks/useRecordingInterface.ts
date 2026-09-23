"use client"

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react"
import { useRecorderStore } from "../../../../store/useRecorderStore"
import { CONFIRM_HOLD_MS } from "../../../molecules/RecordingInstructions/constants"
import { toast } from "sonner"
import { useMicrophonePermission } from "@/hooks/useMicrophonePermission"
// 実際のMediaRecorder APIを使用
import { RECORDING_DURATION_SECONDS } from "../constants"
import { useMediaRecorder } from "./useMediaRecorder"
import { useMicrophoneLevels } from "./useMicrophoneLevels"

/**
 * マイク周りの失敗をユーザーに伝わる文言に変換する
 *
 * 権限拒否（NotAllowedError）だけは「何をすればよいか」が分かる文言にする
 */
function getMicrophoneErrorMessage(
   error: unknown,
   fallbackPrefix: string,
): string {
   if (error instanceof Error && error.name === "NotAllowedError") {
      return "マイクへのアクセスが許可されていません。ブラウザの設定でマイクを許可してください。"
   }
   const detail = error instanceof Error ? error.message : "不明なエラー"
   return `${fallbackPrefix}: ${detail}`
}

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
   const [showPlayback, setShowPlayback] = useState(false)
   const [isAgreed, setIsAgreed] = useState(false)
   const [showConfirmationComplete, setShowConfirmationComplete] =
      useState(false)

   // 実際のMediaRecorder APIを使用
   const {
      startRecording,
      stopRecording,
      stream,
      error: recordingError,
   } = useMediaRecorder()
   const { audioData } = useRecorderStore()
   const {
      state: microphonePermission,
      request: requestMicrophonePermission,
      takeStream: takeMicrophoneStream,
      release: releaseMicrophoneStream,
   } = useMicrophonePermission()

   // マイク入力から実際の音量を集める
   const levels = useMicrophoneLevels(stream, RECORDING_DURATION_SECONDS)

   // 外部クリック検知用のref
   const instructionsRef = useRef<HTMLDivElement>(null)

   // 確認済み → 確認完了の切り替え待ち。閉じたときに取り消す
   const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

   // 閉じるアニメーションは AnimatePresence の exit が受け持つので、状態は即座に戻す
   const handleCloseInstructions = useCallback(() => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
      // 録音せずに閉じたらマイクを閉じる。使用中の表示を残さない
      releaseMicrophoneStream()
      setShowInstructions(false)
      setIsAgreed(false)
      setShowConfirmationComplete(false)
   }, [releaseMicrophoneStream])

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

      // 開いたタップの mousedown / touchstart は click より前に済んでいるので、すぐ登録してよい
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)

      return () => {
         document.removeEventListener("mousedown", handleClickOutside)
         document.removeEventListener("touchstart", handleClickOutside)
      }
   }, [showInstructions, handleCloseInstructions])

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
         setRecordingTime(Math.min(elapsedTime, RECORDING_DURATION_SECONDS))

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
         setStatus("completed")
      }
   }, [audioData, status])

   const handleRecord = async () => {
      // 注意書きを表示
      setShowInstructions(true)
   }

   const handleStartRecording = async () => {
      try {
         // 前回のaudioDataをクリア（新しい録音のため）
         const { resetRecording } = useRecorderStore.getState()
         resetRecording()

         // マイクが開くまで画面を録音中にしない。許可を求めている間に
         // 録音が始まったように見せない。確認画面で開いたストリームがあれば待ちは無い
         await startRecording(takeMicrophoneStream())

         setRecordingTime(0)
         setStatus("recording")
         setShowInstructions(false)
         // 確認関連の状態をリセット
         setIsAgreed(false)
         setShowConfirmationComplete(false)

         // MediaRecorderレベルで10秒タイマーが設定されているため、
         // ここでは追加のタイマーは不要
      } catch (error) {
         console.error("録音の開始に失敗しました:", error)
         setStatus("idle")
         setShowInstructions(false)
         toast.error(
            getMicrophoneErrorMessage(error, "録音の開始に失敗しました"),
         )
      }
   }

   // 権限は確認画面のトグルで取る。録音開始の直前だと許可ダイアログがスライド操作に
   // 割り込み、拒否された場合もスライドし終わるまで分からない
   const handleRequestMicrophonePermission = async () => {
      try {
         await requestMicrophonePermission()
      } catch (error) {
         toast.error(
            getMicrophoneErrorMessage(error, "マイクを準備できませんでした"),
         )
      }
   }

   const handleAgree = () => {
      setIsAgreed(true)
      // 「確認済み」を一瞬見せてから確認完了画面に切り替える
      confirmTimerRef.current = setTimeout(() => {
         setShowConfirmationComplete(true)
      }, CONFIRM_HOLD_MS)
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

   const handleClosePlayback = () => {
      setShowPlayback(false)
      // 次回の録音のために確認関連の状態をリセット
      setIsAgreed(false)
      setShowConfirmationComplete(false)
      setShowInstructions(false)
   }

   const instructionItems = [
      "録音した場所が地図上に公開されます",
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
      showPlayback,
      isAgreed,
      showConfirmationComplete,
      setShowConfirmationComplete,
      instructionsRef,
      levels,
      audioData,
      microphonePermission,
      handleRecord,
      handleStartRecording,
      handleRequestMicrophonePermission,
      handleAgree,
      handleStop,
      handleClosePlayback,
      handleCloseInstructions,
      formatTime,
      instructionItems,
      recordingError,
   }
}
