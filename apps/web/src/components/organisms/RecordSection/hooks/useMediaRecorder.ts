"use client"

import { useCallback, useRef, useState } from "react"
import type { AudioData } from "../../../../store/types"
import { useRecorderStore } from "../../../../store/useRecorderStore"

/**
 * MediaRecorder APIを使用した録音機能フック
 *
 * @description
 * ブラウザ標準のMediaRecorder APIを使用して音声録音を行います。
 * PWAでも問題なく動作し、録音データをBlobとして取得できます。
 *
 * @example
 * ```tsx
 * const { startRecording, stopRecording, isRecording, error } = useMediaRecorder()
 *
 * // 録音開始
 * await startRecording()
 *
 * // 録音停止
 * await stopRecording()
 * ```
 */
export function useMediaRecorder() {
   const [isRecording, setIsRecording] = useState<boolean>(false)
   const [error, setError] = useState<Error | null>(null)

   const mediaRecorderRef = useRef<MediaRecorder | null>(null)
   const streamRef = useRef<MediaStream | null>(null)
   const chunksRef = useRef<Blob[]>([])
   const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null)
   const recordingStartTimeRef = useRef<number | null>(null)

   const {
      setAudioData,
      startRecording: storeStartRecording,
      stopRecording: storeStopRecording,
   } = useRecorderStore()

   /**
    * 録音を開始します
    *
    * @throws {Error} マイクアクセス許可が得られない場合
    * @throws {Error} MediaRecorderがサポートされていない場合
    */
   const startRecording = useCallback(async (): Promise<void> => {
      try {
         setError(null)

         // MediaRecorderのサポート確認
         if (typeof window === "undefined" || !window.MediaRecorder) {
            throw new Error("MediaRecorderがサポートされていません")
         }

         // マイクアクセス許可を取得
         const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
               echoCancellation: true,
               noiseSuppression: true,
               autoGainControl: true,
               sampleRate: 44100,
            },
         })

         streamRef.current = stream
         chunksRef.current = []

         // MediaRecorderを初期化
         const mediaRecorder = new MediaRecorder(stream, {
            mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
               ? "audio/webm;codecs=opus"
               : MediaRecorder.isTypeSupported("audio/mp4")
                 ? "audio/mp4"
                 : "audio/webm",
         })

         mediaRecorderRef.current = mediaRecorder

         // データ取得イベント
         mediaRecorder.ondataavailable = (event: BlobEvent): void => {
            console.log("📊 MediaRecorder data available:", {
               size: event.data.size,
               type: event.data.type,
               chunksCount: chunksRef.current.length + 1,
            })
            if (event.data.size > 0) {
               chunksRef.current.push(event.data)
            }
         }

         // 録音停止イベント
         mediaRecorder.onstop = (): void => {
            const currentTime = performance.now()
            const elapsedTime = recordingStartTimeRef.current
               ? (currentTime - recordingStartTimeRef.current) / 1000
               : 0

            console.log("🎵 MediaRecorder停止イベント発火", { elapsedTime })

            // 自動停止タイマーをクリア
            if (autoStopTimerRef.current) {
               clearTimeout(autoStopTimerRef.current)
               autoStopTimerRef.current = null
            }

            // 録音開始時刻をクリア
            recordingStartTimeRef.current = null

            const audioBlob = new Blob(chunksRef.current, {
               type: mediaRecorder.mimeType,
            })

            console.log("🎤 最終録音データ:", {
               chunks: chunksRef.current.length,
               totalSize: audioBlob.size,
               mimeType: audioBlob.type,
               duration: elapsedTime,
            })

            // 音声データの検証
            if (audioBlob.size < 1000) {
               console.warn("⚠️ 録音データが小さすぎます（1KB未満）")
            }

            const audioData: AudioData = {
               blob: audioBlob,
               recordedAt: new Date(),
               id: crypto.randomUUID(),
               duration: elapsedTime,
            }

            setAudioData(audioData)
            setIsRecording(false)

            // ストリームを停止
            if (streamRef.current) {
               for (const track of streamRef.current.getTracks()) {
                  track.stop()
               }
               streamRef.current = null
            }
         }

         // エラーイベント
         mediaRecorder.onerror = (event: Event): void => {
            const errorEvent = event as ErrorEvent
            setError(new Error(`録音エラー: ${errorEvent.message}`))
            setIsRecording(false)
         }

         // 録音開始時刻を記録
         recordingStartTimeRef.current = performance.now()

         // 録音開始（1秒ごとにデータを取得）
         mediaRecorder.start(1000) // 1000msごとにデータを取得
         setIsRecording(true)
         storeStartRecording()

         // 確実に10秒後に停止するタイマー（少し余裕を持たせる）
         const stopRecordingAtTime = () => {
            const currentTime = performance.now()
            const elapsedTime = recordingStartTimeRef.current
               ? (currentTime - recordingStartTimeRef.current) / 1000
               : 0

            console.log("🔴 MediaRecorder自動停止タイマー実行", {
               mediaRecorderExists: !!mediaRecorderRef.current,
               state: mediaRecorderRef.current?.state,
               isRecording: isRecording,
               elapsedTime: elapsedTime,
            })

            if (
               mediaRecorderRef.current &&
               mediaRecorderRef.current.state === "recording"
            ) {
               // 10秒に満たない場合は、10秒まで待つ
               if (elapsedTime < 10) {
                  const remainingTime = (10 - elapsedTime) * 1000
                  console.log("⏳ 10秒まで待機", { remainingTime })
                  autoStopTimerRef.current = setTimeout(
                     stopRecordingAtTime,
                     remainingTime,
                  )
                  return
               }

               console.log("🛑 MediaRecorder自動停止実行", { elapsedTime })
               mediaRecorderRef.current.stop()
            }
         }

         autoStopTimerRef.current = setTimeout(stopRecordingAtTime, 10000) // 10秒 = 10000ms
      } catch (err) {
         const error =
            err instanceof Error ? err : new Error("録音の開始に失敗しました")
         setError(error)
         setIsRecording(false)
         throw error
      }
   }, [setAudioData, storeStartRecording, isRecording])

   /**
    * 録音を停止します
    */
   const stopRecording = useCallback(async (): Promise<void> => {
      try {
         // 自動停止タイマーをクリア
         if (autoStopTimerRef.current) {
            clearTimeout(autoStopTimerRef.current)
            autoStopTimerRef.current = null
         }

         if (mediaRecorderRef.current && isRecording) {
            const currentTime = performance.now()
            const elapsedTime = recordingStartTimeRef.current
               ? (currentTime - recordingStartTimeRef.current) / 1000
               : 0

            console.log("🛑 手動停止実行", { elapsedTime })
            mediaRecorderRef.current.stop()
            storeStopRecording()
         }
      } catch (err) {
         const error =
            err instanceof Error ? err : new Error("録音の停止に失敗しました")
         setError(error)
         throw error
      }
   }, [isRecording, storeStopRecording])

   /**
    * 一時停止機能（MediaRecorderは一時停止をサポート）
    */
   const pauseRecording = useCallback((): void => {
      if (
         mediaRecorderRef.current &&
         mediaRecorderRef.current.state === "recording"
      ) {
         mediaRecorderRef.current.pause()
      }
   }, [])

   /**
    * 録音再開機能
    */
   const resumeRecording = useCallback((): void => {
      if (
         mediaRecorderRef.current &&
         mediaRecorderRef.current.state === "paused"
      ) {
         mediaRecorderRef.current.resume()
      }
   }, [])

   /**
    * リソースのクリーンアップ
    */
   const cleanup = useCallback((): void => {
      if (streamRef.current) {
         for (const track of streamRef.current.getTracks()) {
            track.stop()
         }
         streamRef.current = null
      }

      if (mediaRecorderRef.current) {
         mediaRecorderRef.current = null
      }

      chunksRef.current = []
      setIsRecording(false)
      setError(null)
   }, [])

   return {
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      cleanup,
      isRecording,
      error,
      isSupported: typeof window !== "undefined" && !!window.MediaRecorder,
   }
}
