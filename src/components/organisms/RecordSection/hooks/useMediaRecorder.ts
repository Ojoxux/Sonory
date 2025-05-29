'use client'

import { useRecorderStore } from '@/store/useRecorderStore'
import { useCallback, useRef, useState } from 'react'

/**
 * メディアレコーダーカスタムフック
 *
 * @description
 * 音声録音機能を提供するカスタムフック
 * MediaRecorder APIを使用して音声を録音し、状態管理を行う
 *
 * @returns 録音開始・停止関数と録音状態
 *
 * @example
 * ```tsx
 * const { startRecording, stopRecording, isRecording } = useMediaRecorder()
 *
 * const handleRecord = async () => {
 *   if (!isRecording) {
 *     await startRecording()
 *   } else {
 *     await stopRecording()
 *   }
 * }
 * ```
 */
export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const { setAudioData } = useRecorderStore()

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(blob)

        // 録音データをストアに保存
        setAudioData({
          id: Date.now().toString(),
          url: audioUrl,
          blob,
          recordedAt: new Date(),
        })

        // クリーンアップ
        chunksRef.current = []
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('録音の開始に失敗しました:', error)
      throw error
    }
  }, [setAudioData])

  const stopRecording = useCallback(async (): Promise<void> => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  return {
    startRecording,
    stopRecording,
    isRecording,
  }
}
