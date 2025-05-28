import { useCallback, useState } from 'react'

/**
 * 音声録音機能を提供するフック
 *
 * MediaRecorder APIを使用して音声録音を制御する
 * 現在はモック実装
 *
 * @returns 録音関連の関数と状態
 */
export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  /**
   * 録音を開始する関数
   *
   * 現在はモック実装のため、実際の録音は行わない
   */
  const startRecording = useCallback(async (): Promise<void> => {
    console.log('Recording started (mock)')
    setIsRecording(true)

    // 実際の実装ではここでMediaRecorder APIを使用して録音を開始する
    return Promise.resolve()
  }, [])

  /**
   * 録音を停止する関数
   *
   * 現在はモック実装のため、ダミーデータを生成
   */
  const stopRecording = useCallback(async (): Promise<void> => {
    console.log('Recording stopped (mock)')
    setIsRecording(false)

    // モックの音声データを作成
    const mockAudioBlob = new Blob([], { type: 'audio/webm' })
    setAudioBlob(mockAudioBlob)

    // 実際の実装ではここでMediaRecorder APIを停止し、録音データを取得する
    return new Promise((resolve) => {
      // 処理を少し遅延させて実際の挙動を模倣
      setTimeout(() => {
        resolve()
      }, 1000)
    })
  }, [])

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
  }
}
