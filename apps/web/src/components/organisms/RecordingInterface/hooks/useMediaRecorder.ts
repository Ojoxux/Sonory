"use client"

import { useCallback, useRef, useState } from "react"
import type { AudioData } from "../../../../store/types"
import { isStreamLive, requestMicrophoneStream } from "@/utils/microphone"
import { RECORDING_DURATION_SECONDS } from "../constants"
import { useRecorderStore } from "../../../../store/useRecorderStore"

/**
 * 経過時間を計算
 */
function calculateElapsedTime(
   recordingStartTimeRef: React.MutableRefObject<number | null>,
): number {
   if (!recordingStartTimeRef.current) {
      return 0
   }
   const currentTime = performance.now()
   return (currentTime - recordingStartTimeRef.current) / 1000
}

/**
 * タイマーをクリア
 */
function clearAutoStopTimer(
   autoStopTimerRef: React.MutableRefObject<NodeJS.Timeout | null>,
): void {
   if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current)
      autoStopTimerRef.current = null
   }
}

/**
 * 音声Blobを作成
 */
function createAudioBlob(chunks: Blob[], mimeType: string): Blob {
   return new Blob(chunks, { type: mimeType })
}

/**
 * 音声データを検証
 */
function validateAudioBlob(audioBlob: Blob): void {
   if (audioBlob.size < 1000) {
      console.warn("録音データが小さすぎます（1KB未満）")
   }
}

/**
 * AudioDataを作成
 */
function createAudioData(audioBlob: Blob, elapsedTime: number): AudioData {
   return {
      blob: audioBlob,
      recordedAt: new Date(),
      id: crypto.randomUUID(),
      duration: elapsedTime,
   }
}

/**
 * ストリームを停止
 */
function stopStream(
   streamRef: React.MutableRefObject<MediaStream | null>,
): void {
   if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
         track.stop()
      }
      streamRef.current = null
   }
}

/**
 * 録音停止処理
 */
function handleRecordingStop(
   mediaRecorder: MediaRecorder,
   chunksRef: React.MutableRefObject<Blob[]>,
   autoStopTimerRef: React.MutableRefObject<NodeJS.Timeout | null>,
   recordingStartTimeRef: React.MutableRefObject<number | null>,
   streamRef: React.MutableRefObject<MediaStream | null>,
   setAudioData: (data: AudioData) => void,
   setIsRecording: (recording: boolean) => void,
   setStream: (stream: MediaStream | null) => void,
): void {
   const elapsedTime = calculateElapsedTime(recordingStartTimeRef)

   clearAutoStopTimer(autoStopTimerRef)
   recordingStartTimeRef.current = null

   const audioBlob = createAudioBlob(chunksRef.current, mediaRecorder.mimeType)

   validateAudioBlob(audioBlob)

   const audioData = createAudioData(audioBlob, elapsedTime)
   setAudioData(audioData)
   setIsRecording(false)
   stopStream(streamRef)
   setStream(null)
}

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
   // 波形を描くために、録音中だけストリームを外へ渡す
   const [stream, setStream] = useState<MediaStream | null>(null)

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
    * @param grantedStream 確認画面で開いたストリーム。渡すと開き直さない
    *
    * @throws {Error} マイクアクセス許可が得られない場合
    * @throws {Error} MediaRecorderがサポートされていない場合
    */
   const startRecording = useCallback(
      async (grantedStream?: MediaStream | null): Promise<void> => {
         try {
            setError(null)

            // MediaRecorderのサポート確認
            if (typeof window === "undefined" || !window.MediaRecorder) {
               throw new Error("MediaRecorderがサポートされていません")
            }

            // 確認画面で開いたものがあれば使い回す。開き直すと Firefox が
            // もう一度許可ダイアログを出す
            const existing = grantedStream ?? null
            const stream = isStreamLive(existing)
               ? existing
               : await requestMicrophoneStream()

            streamRef.current = stream
            setStream(stream)
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
               if (event.data.size > 0) {
                  chunksRef.current.push(event.data)
               }
            }

            // 録音停止イベント
            mediaRecorder.onstop = (): void => {
               handleRecordingStop(
                  mediaRecorder,
                  chunksRef,
                  autoStopTimerRef,
                  recordingStartTimeRef,
                  streamRef,
                  setAudioData,
                  setIsRecording,
                  setStream,
               )
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

               if (
                  mediaRecorderRef.current &&
                  mediaRecorderRef.current.state === "recording"
               ) {
                  // 10秒に満たない場合は、10秒まで待つ
                  if (elapsedTime < RECORDING_DURATION_SECONDS) {
                     const remainingTime =
                        (RECORDING_DURATION_SECONDS - elapsedTime) * 1000
                     autoStopTimerRef.current = setTimeout(
                        stopRecordingAtTime,
                        remainingTime,
                     )
                     return
                  }

                  mediaRecorderRef.current.stop()
               }
            }

            autoStopTimerRef.current = setTimeout(
               stopRecordingAtTime,
               RECORDING_DURATION_SECONDS * 1000,
            )
         } catch (err) {
            const error =
               err instanceof Error
                  ? err
                  : new Error("録音の開始に失敗しました")
            setError(error)
            setIsRecording(false)
            throw error
         }
      },
      [setAudioData, storeStartRecording],
   )

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
      setStream(null)
      setIsRecording(false)
      setError(null)
   }, [])

   return {
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      cleanup,
      stream,
      isRecording,
      error,
      isSupported: typeof window !== "undefined" && !!window.MediaRecorder,
   }
}
