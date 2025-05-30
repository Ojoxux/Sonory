'use client'

import { useEffect, useState } from 'react'

/**
 * 非同期波形データ更新フック
 *
 * @description
 * 独立したタイミングで波形データを更新する
 * 他のアニメーションと同期しないように設計
 */
export function useAsyncWaveform(isRecording: boolean) {
  const [waveformData, setWaveformData] = useState<number[]>([])

  // 各インスタンス独自のランダムタイミング
  const [initialDelay] = useState(() => 100 + Math.random() * 100) // 100-200msの初期遅延
  const [baseInterval] = useState(() => 180 + Math.random() * 40) // 180-220msの基本間隔

  useEffect(() => {
    if (isRecording) {
      let timeoutId: NodeJS.Timeout

      // 初回更新を遅延実行
      const startUpdates = () => {
        const updateWaveform = () => {
          const newData = Array.from(
            { length: 3 },
            () => Math.random() * 40 + 30,
          )
          setWaveformData((prev) => [...prev.slice(-27), ...newData])

          // 次の更新を可変間隔でスケジュール
          const nextDelay = baseInterval + Math.random() * 40 // 基本間隔 + ランダム要素
          timeoutId = setTimeout(updateWaveform, nextDelay)
        }

        updateWaveform()
      }

      const initialTimer = setTimeout(startUpdates, initialDelay)

      return () => {
        clearTimeout(initialTimer)
        if (timeoutId) clearTimeout(timeoutId)
      }
    } else {
      // 録音停止時はデータをクリア
      setWaveformData([])
    }
  }, [isRecording, initialDelay, baseInterval])

  return waveformData
}
