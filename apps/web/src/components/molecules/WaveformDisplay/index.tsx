"use client"

import { useCallback, useEffect, useRef } from "react"
import type { WaveformDisplayProps } from "./types"

// 固定のバー設定（定数）
const FIXED_BAR_WIDTH = 4
const FIXED_BAR_GAP = 2
const TOTAL_BAR_WIDTH = FIXED_BAR_WIDTH + FIXED_BAR_GAP

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
   waveColor = "#1f2937",
   progressColor = "#dc2626",
   backgroundColor = "#f3f4f6",
   waveformData = [],
   className = "",
   isCompleted = false,
}: WaveformDisplayProps) {
   const canvasRef = useRef<HTMLCanvasElement>(null)
   const containerRef = useRef<HTMLDivElement>(null)

   /**
    * Canvas のサイズを更新
    */
   const updateCanvasSize = useCallback((): void => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const width = container.offsetWidth
      const dpr =
         typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext("2d")
      if (ctx) {
         ctx.scale(dpr, dpr)
      }
   }, [height])

   /**
    * バーの色を決定する
    */
   const getBarColor = useCallback(
      (
         hasData: boolean,
         isRecordingComplete: boolean,
         isRecording: boolean,
         barPosition: number,
         progress: number,
      ): string => {
         if (!hasData) {
            return "#e5e7eb" // デフォルト（未録音）
         }

         if (isRecordingComplete) {
            return waveColor
         }

         if (isRecording && barPosition <= progress) {
            return waveColor
         }

         return "#e5e7eb"
      },
      [waveColor],
   )

   /**
    * バーを描画する
    */
   const drawBars = useCallback(
      (
         ctx: CanvasRenderingContext2D,
         width: number,
         canvasHeight: number,
         maxBars: number,
         progress: number,
         isRecordingComplete: boolean,
      ): void => {
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
            const barPosition = (x + FIXED_BAR_WIDTH / 2) / width

            // バーの色を決定
            const barColor = getBarColor(
               hasData,
               isRecordingComplete,
               isRecording,
               barPosition,
               progress,
            )

            ctx.fillStyle = barColor
            ctx.fillRect(x, y, FIXED_BAR_WIDTH, barHeight)
         }
      },
      [waveformData, isRecording, getBarColor],
   )

   /**
    * プログレスインジケーターを描画する
    */
   const drawProgressIndicator = useCallback(
      (
         ctx: CanvasRenderingContext2D,
         width: number,
         canvasHeight: number,
         progress: number,
      ): void => {
         if (!isRecording || recordingTime <= 0) {
            return
         }

         const progressX = progress * width
         ctx.strokeStyle = progressColor
         ctx.lineWidth = 2
         ctx.beginPath()
         ctx.moveTo(progressX, 0)
         ctx.lineTo(progressX, canvasHeight)
         ctx.stroke()
      },
      [isRecording, recordingTime, progressColor],
   )

   /**
    * 波形を描画
    */
   const draw = useCallback((): void => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const dpr =
         typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
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
      drawBars(ctx, width, canvasHeight, maxBars, progress, isRecordingComplete)

      // 録音位置インジケーター（録音中のみ）
      drawProgressIndicator(ctx, width, canvasHeight, progress)
   }, [
      backgroundColor,
      recordingTime,
      maxDuration,
      isRecording,
      isCompleted,
      drawBars,
      drawProgressIndicator,
   ])

   // 初期化とリサイズ処理
   useEffect(() => {
      updateCanvasSize()
      draw()

      const handleResize = (): void => {
         updateCanvasSize()
         draw()
      }

      window.addEventListener("resize", handleResize)
      return () => {
         window.removeEventListener("resize", handleResize)
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
            className="block w-full"
            style={{ height: `${height}px` }}
         />
      </div>
   )
}
