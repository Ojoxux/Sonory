'use client'

import { useCallback, useState } from 'react'

/**
 * メディアレコーダーのモック実装
 *
 * @description
 * 実際の録音機能が実装されるまでの仮実装
 * UIの動作確認用にダミーの録音状態を提供する
 */
export function useMediaRecorderMock() {
  const [isRecording, setIsRecording] = useState(false)

  const startRecording = useCallback(async (): Promise<void> => {
    console.log('モック: 録音を開始します')
    setIsRecording(true)
    // 実際の録音は行わない
  }, [])

  const stopRecording = useCallback(async (): Promise<void> => {
    console.log('モック: 録音を停止します')
    setIsRecording(false)
    // 実際の録音データは生成しない
  }, [])

  return {
    startRecording,
    stopRecording,
    isRecording,
  }
}
