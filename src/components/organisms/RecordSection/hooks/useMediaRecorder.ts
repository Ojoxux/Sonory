'use client'

import { useCallback, useRef, useState } from 'react'
import type { AudioData } from '../../../../store/types'
import { useRecorderStore } from '../../../../store/useRecorderStore'

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
      if (typeof window === 'undefined' || !window.MediaRecorder) {
        throw new Error('MediaRecorderがサポートされていません')
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
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/webm',
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
        const audioBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        })

        const audioUrl = URL.createObjectURL(audioBlob)
        const audioData: AudioData = {
          blob: audioBlob,
          url: audioUrl,
          recordedAt: new Date(),
          id: crypto.randomUUID(),
        }

        setAudioData(audioData)
        setIsRecording(false)

        // ストリームを停止
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => {
            track.stop()
          })
          streamRef.current = null
        }
      }

      // エラーイベント
      mediaRecorder.onerror = (event: Event): void => {
        const errorEvent = event as ErrorEvent
        setError(new Error(`録音エラー: ${errorEvent.message}`))
        setIsRecording(false)
      }

      // 録音開始
      mediaRecorder.start(100) // 100msごとにデータを取得
      setIsRecording(true)
      storeStartRecording()
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('録音の開始に失敗しました')
      setError(error)
      setIsRecording(false)
      throw error
    }
  }, [setAudioData, storeStartRecording])

  /**
   * 録音を停止します
   */
  const stopRecording = useCallback(async (): Promise<void> => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        storeStopRecording()
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('録音の停止に失敗しました')
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
      mediaRecorderRef.current.state === 'recording'
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
      mediaRecorderRef.current.state === 'paused'
    ) {
      mediaRecorderRef.current.resume()
    }
  }, [])

  /**
   * リソースのクリーンアップ
   */
  const cleanup = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
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
    isSupported: typeof window !== 'undefined' && !!window.MediaRecorder,
  }
}
