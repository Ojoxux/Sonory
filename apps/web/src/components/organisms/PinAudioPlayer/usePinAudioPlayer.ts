import { useCallback, useEffect, useRef, useState } from "react"
import { useEffectEvent } from "use-effect-event"
import type { SoundPin } from "@/store/useSoundPinStore"
import { formatRecordedAt, formatTime } from "@/utils/dateFormat"
import type {
   AudioLoadingStatus,
   PlaybackState,
   UsePinAudioPlayerReturn,
} from "./types"

/**
 * PinAudioPlayerのカスタムフック
 *
 * @param pin 再生する音声ピン
 * @param onClose 閉じるボタンが押されたときのコールバック
 * @returns 音声プレイヤーの状態と操作関数
 */
export function usePinAudioPlayer(
   pin: SoundPin | null,
   onClose: () => void,
): UsePinAudioPlayerReturn {
   const [audioLoadingStatus, setAudioLoadingStatus] =
      useState<AudioLoadingStatus>("idle")
   const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
   const [audioLoadError, setAudioLoadError] = useState<string | null>(null)
   const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
      null,
   )
   const [currentTime, setCurrentTime] = useState<number>(0)
   const [duration, setDuration] = useState<number>(0)
   const isMounted = true
   const progressBarRef = useRef<HTMLDivElement>(null)
   const animationFrameRef = useRef<number | null>(null)

   /**
    * 音声を読み込み
    */
   const loadAudio = useCallback(
      async (audioUrl: string, suggestedDuration?: number): Promise<void> => {
         try {
            setAudioLoadingStatus("loading")
            setAudioLoadError(null)
            setCurrentTime(0)
            // suggestedDurationがあれば事前に設定
            if (
               suggestedDuration &&
               Number.isFinite(suggestedDuration) &&
               suggestedDuration > 0
            ) {
               setDuration(suggestedDuration)
            } else {
               setDuration(0)
            }

            const audio = new Audio(audioUrl)

            // 音声読み込み完了時の処理
            audio.onloadedmetadata = () => {
               const audioDuration = audio.duration
               // durationが有効な値かチェック
               if (Number.isFinite(audioDuration) && audioDuration > 0) {
                  setDuration(audioDuration)
                  setAudioLoadingStatus("ready")
                  console.log("✅ PinAudioPlayer: 音声読み込み成功", {
                     audioUrl,
                     duration: audioDuration,
                     readyState: audio.readyState,
                  })
               } else {
                  // durationが無効な場合は、suggestedDurationまたはデフォルト値を使用
                  const fallbackDuration = suggestedDuration || 10
                  setDuration(fallbackDuration)
                  setAudioLoadingStatus("ready")
                  console.log(
                     "ℹ️ PinAudioPlayer: audio要素からdurationを取得できませんでした。フォールバック値を使用します:",
                     {
                        audioUrl,
                        audioDuration,
                        usedDuration: fallbackDuration,
                        hasSuggestedDuration: !!suggestedDuration,
                     },
                  )
               }
            }

            // 音声データが利用可能になったときの処理
            audio.oncanplaythrough = () => {
               const audioDuration = audio.duration
               if (Number.isFinite(audioDuration) && audioDuration > 0) {
                  setDuration(audioDuration)
                  setAudioLoadingStatus("ready")
               }
            }

            // 音声再生時間更新（requestAnimationFrameで滑らかに）
            const updateTime = () => {
               if (audio && !audio.paused && !audio.ended) {
                  const currentTime = audio.currentTime
                  if (Number.isFinite(currentTime) && currentTime >= 0) {
                     setCurrentTime(currentTime)
                  }
                  animationFrameRef.current = requestAnimationFrame(updateTime)
               }
            }

            audio.ontimeupdate = () => {
               const currentTime = audio.currentTime
               if (Number.isFinite(currentTime) && currentTime >= 0) {
                  setCurrentTime(currentTime)
               }
            }

            // 再生開始時にアニメーションフレーム更新を開始
            audio.onplay = () => {
               if (animationFrameRef.current) {
                  cancelAnimationFrame(animationFrameRef.current)
               }
               animationFrameRef.current = requestAnimationFrame(updateTime)
            }

            // 一時停止・終了時にアニメーションフレーム更新を停止
            audio.onpause = () => {
               if (animationFrameRef.current) {
                  cancelAnimationFrame(animationFrameRef.current)
                  animationFrameRef.current = null
               }
            }

            // 音声再生終了時の処理
            audio.onended = () => {
               if (animationFrameRef.current) {
                  cancelAnimationFrame(animationFrameRef.current)
                  animationFrameRef.current = null
               }
               setPlaybackState("ended")
               setCurrentTime(0)
            }

            // 音声読み込みエラー時の処理
            audio.onerror = (error) => {
               console.error("🚨 PinAudioPlayer: 音声読み込みエラー:", {
                  error,
                  audioUrl,
                  audioSrc: audio.src,
                  audioReadyState: audio.readyState,
                  audioNetworkState: audio.networkState,
               })
               setAudioLoadingStatus("error")
               setAudioLoadError(`音声の読み込みに失敗しました: ${audioUrl}`)
            }

            setAudioElement(audio)
         } catch (error) {
            console.error("音声読み込み処理エラー:", error)
            setAudioLoadingStatus("error")
            setAudioLoadError(
               error instanceof Error
                  ? error.message
                  : "音声の読み込みに失敗しました",
            )
         }
      },
      [],
   )

   /**
    * 音声再生/一時停止のトグル
    */
   const togglePlayback = useCallback(async (): Promise<void> => {
      if (!audioElement) return

      try {
         if (playbackState === "playing") {
            audioElement.pause()
            setPlaybackState("paused")
         } else {
            await audioElement.play()
            setPlaybackState("playing")
         }
      } catch (error) {
         console.error("音声再生エラー:", error)
         setAudioLoadError("音声の再生に失敗しました")
      }
   }, [audioElement, playbackState])

   /**
    * 音声停止
    */
   const stopAudio = useCallback((): void => {
      if (audioElement) {
         audioElement.pause()
         audioElement.currentTime = 0
         setPlaybackState("idle")
         setCurrentTime(0)
      }
   }, [audioElement])

   /**
    * シークバーのクリック処理
    */
   const handleSeek = useCallback(
      (event: React.MouseEvent<HTMLDivElement>): void => {
         if (
            !audioElement ||
            !progressBarRef.current ||
            !Number.isFinite(duration) ||
            duration <= 0
         ) {
            return
         }

         const rect = progressBarRef.current.getBoundingClientRect()
         const clickX = event.clientX - rect.left
         const progressBarWidth = rect.width
         const clickRatio = Math.max(0, Math.min(1, clickX / progressBarWidth))
         const newTime = clickRatio * duration

         if (Number.isFinite(newTime) && newTime >= 0 && newTime <= duration) {
            audioElement.currentTime = newTime
            setCurrentTime(newTime)
         }
      },
      [audioElement, duration],
   )

   /**
    * 閉じるボタンのクリックハンドラー
    */
   const onCloseEvent = useEffectEvent(() => {
      onClose()
   })

   // biome-ignore lint/correctness/useExhaustiveDependencies(onCloseEvent): onCloseEvent は useEffectEvent でラップされているため依存配列に含めない（React公式ドキュメント推奨）
   const handleClose = useCallback((): void => {
      stopAudio()
      onCloseEvent()
   }, [stopAudio])

   // ピンが変更されたときに音声を読み込み
   useEffect(() => {
      if (pin?.audioData) {
         const audioUrl =
            pin.audioData.url ||
            (pin.audioData.blob
               ? URL.createObjectURL(pin.audioData.blob)
               : null)

         if (audioUrl) {
            console.log("🎵 PinAudioPlayer: 音声読み込み開始", {
               pinId: pin.id,
               audioUrl,
               hasUrl: !!pin.audioData.url,
               hasBlob: !!pin.audioData.blob,
               isPersisted: pin.isPersisted,
               primaryLabel: pin.primaryLabel,
               environment: pin.environment,
               classificationResults: pin.classificationResults,
               duration: pin.audioData.duration,
            })

            loadAudio(audioUrl, pin.audioData.duration)
         } else {
            console.warn("⚠️ PinAudioPlayer: 音声URLもBlobも見つかりません", {
               pin: {
                  id: pin.id,
                  hasAudioData: !!pin.audioData,
                  audioDataUrl: pin.audioData?.url,
                  hasBlob: !!pin.audioData?.blob,
                  primaryLabel: pin.primaryLabel,
                  environment: pin.environment,
               },
            })
         }
      }
   }, [pin, loadAudio])

   // audioElementのクリーンアップ
   useEffect(() => {
      return () => {
         if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
         }
         if (audioElement) {
            // エラーハンドラーを削除してからクリーンアップ
            audioElement.onerror = null
            audioElement.onended = null
            audioElement.onloadedmetadata = null
            audioElement.ontimeupdate = null
            audioElement.pause()
            audioElement.src = ""
         }
      }
   }, [audioElement])

   // コンポーネントがアンマウントされるときのクリーンアップ
   useEffect(() => {
      return () => {
         if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
         }
         if (audioElement) {
            // エラーハンドラーを削除してからクリーンアップ
            audioElement.onerror = null
            audioElement.onended = null
            audioElement.onloadedmetadata = null
            audioElement.ontimeupdate = null
            audioElement.pause()
            audioElement.src = ""
         }
      }
   }, [audioElement])

   // 安全な時間表示のための値
   const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
   const safeCurrentTime =
      Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0
   const progressPercentage =
      safeDuration > 0
         ? Math.min(100, (safeCurrentTime / safeDuration) * 100)
         : 0

   // その他の候補アコーディオンの開閉状態
   const [isOtherResultsOpen, setIsOtherResultsOpen] = useState(false)
   // その他の候補アコーディオンのトグル
   const toggleOtherResults = useCallback(() => {
      setIsOtherResultsOpen((prev) => !prev)
   }, [])
   // 信頼度をパーセンテージでフォーマット
   const formatConfidence = useCallback((confidence: number): string => {
      return `${Math.round(confidence * 100)}%`
   }, [])

   return {
      audioLoadingStatus,
      playbackState,
      audioLoadError,
      currentTime: safeCurrentTime,
      duration: safeDuration,
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
   }
}
