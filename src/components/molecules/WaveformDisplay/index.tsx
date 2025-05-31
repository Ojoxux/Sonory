'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { WaveformDisplayProps } from './type'

/**
 * 波形表示コンポーネント
 *
 * @description
 * Canvas APIを使用したリアルタイム波形表示
 * 録音中の波形をプログレスバーと共に表示
 *
 * @param isRecording 録音中かどうか
 * @param recordingTime 録音時間
 * @param maxDuration 最大録音時間
 * @param height 波形の高さ
 * @param waveColor 波形の色
 * @param progressColor プログレスバーの色
 * @param backgroundColor 背景色
 * @param waveformData 波形データ
 * @param className クラス名
 * @param isCompleted 録音完了かどうか
 *
 * @example
 * ```tsx
 * <WaveformDisplay
 *   isRecording={true}
 *   recordingTime={5.5}
 *   waveformData={[50, 60, 45, 70]}
 * />
 * ```
 */
export function WaveformDisplay({
  isRecording,
  recordingTime,
  maxDuration = 10,
  height = 128,
  waveColor = '#1f2937',
  progressColor = '#dc2626',
  backgroundColor = '#f3f4f6',
  waveformData = [],
  className = '',
  isCompleted = false,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 固定のバー設定
  const FIXED_BAR_WIDTH = 4
  const FIXED_BAR_GAP = 2
  const TOTAL_BAR_WIDTH = FIXED_BAR_WIDTH + FIXED_BAR_GAP

  /**
   * Canvas のサイズを更新
   */
  const updateCanvasSize = useCallback((): void => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const width = container.offsetWidth
    const dpr = window.devicePixelRatio || 1

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }, [height])

  /**
   * 波形を描画
   */
  const draw = useCallback((): void => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const canvasHeight = canvas.height / dpr

    // 背景をクリア
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, canvasHeight)

    // 表示可能な最大バー数
    const maxBars = Math.floor(width / TOTAL_BAR_WIDTH)

    // プログレスの計算
    const progress = Math.min(recordingTime / maxDuration, 1)

    // 録音完了の判定
    const isRecordingComplete =
      isCompleted || (!isRecording && recordingTime > 0)

    // バーを描画
    for (let i = 0; i < maxBars; i++) {
      const x = i * TOTAL_BAR_WIDTH
      const dataIndex = Math.max(0, waveformData.length - maxBars + i)
      const hasData = dataIndex < waveformData.length

      // バーの高さを決定
      const value = hasData ? waveformData[dataIndex] : 0
      const barHeight = hasData
        ? Math.max(2, (value / 100) * canvasHeight * 0.8)
        : canvasHeight * 0.1

      const y = (canvasHeight - barHeight) / 2

      // バーの色を決定
      let barColor = '#e5e7eb' // デフォルト（未録音）

      if (isRecordingComplete && hasData) {
        // 録音完了時は全てのデータを録音済みの色に
        barColor = waveColor
      } else if (isRecording && hasData) {
        // 録音中はプログレスに基づいて色を決定
        const barPosition = (x + FIXED_BAR_WIDTH / 2) / width
        if (barPosition <= progress) {
          barColor = waveColor
        }
      }

      ctx.fillStyle = barColor
      ctx.fillRect(x, y, FIXED_BAR_WIDTH, barHeight)
    }

    // 録音位置インジケーター（録音中のみ）
    if (isRecording && recordingTime > 0) {
      const progressX = progress * width
      ctx.strokeStyle = progressColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(progressX, 0)
      ctx.lineTo(progressX, canvasHeight)
      ctx.stroke()
    }
  }, [
    backgroundColor,
    waveColor,
    progressColor,
    waveformData,
    recordingTime,
    maxDuration,
    isRecording,
    isCompleted,
    TOTAL_BAR_WIDTH,
    FIXED_BAR_WIDTH,
  ])

  // 初期化とリサイズ処理
  useEffect(() => {
    updateCanvasSize()
    draw()

    const handleResize = (): void => {
      updateCanvasSize()
      draw()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [updateCanvasSize, draw])

  // データ変更時の再描画
  useEffect(() => {
    draw()
  }, [draw])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}
