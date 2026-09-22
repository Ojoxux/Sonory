"use client"

import { useCallback, useEffect, useEffectEvent, useRef } from "react"
import type { WaveformDisplayProps } from "./types"

// 固定のバー設定（定数）
const FIXED_BAR_WIDTH = 4
const FIXED_BAR_GAP = 2
const TOTAL_BAR_WIDTH = FIXED_BAR_WIDTH + FIXED_BAR_GAP
/** まだ録音していない位置のバーの濃さ */
const IDLE_BAR_ALPHA = 0.2

/**
 * 波形表示コンポーネント
 *
 * @description
 * Canvas APIを使用したリアルタイム波形表示。
 * バーは `currentColor` で塗る（`className` の `text-*` で色を決める）。背景は透過。
 * 録音位置の線は canvas ではなく `record` の要素を `transform` で動かす
 *
 * @param isRecording 録音中かどうか
 * @param recordingTime 録音時間
 * @param maxDuration 最大録音時間
 * @param height 波形の高さ
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
 *   className="text-white"
 * />
 * ```
 */
export function WaveformDisplay({
   isRecording,
   recordingTime,
   maxDuration = 10,
   height = 128,
   waveformData = [],
   className = "",
   isCompleted = false,
}: WaveformDisplayProps) {
   const canvasRef = useRef<HTMLCanvasElement>(null)
   const containerRef = useRef<HTMLDivElement>(null)
   // getComputedStyle を毎フレーム呼ばないよう、サイズ更新時にだけ読む
   const barColorRef = useRef("currentColor")

   const progress = Math.min(recordingTime / maxDuration, 1)

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
      barColorRef.current = getComputedStyle(container).color

      const ctx = canvas.getContext("2d")
      if (ctx) {
         ctx.scale(dpr, dpr)
      }
   }, [height])

   const draw = useCallback((): void => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const canvasHeight = canvas.height / dpr

      ctx.clearRect(0, 0, width, canvasHeight)
      ctx.fillStyle = barColorRef.current

      const maxBars = Math.floor(width / TOTAL_BAR_WIDTH)
      const isRecordingComplete =
         isCompleted || (!isRecording && recordingTime > 0)

      for (let i = 0; i < maxBars; i++) {
         const x = i * TOTAL_BAR_WIDTH
         const dataIndex = Math.max(0, waveformData.length - maxBars + i)
         const value = waveformData[dataIndex]
         const hasData = value !== undefined

         const barHeight = hasData
            ? Math.max(2, (value / 100) * canvasHeight * 0.8)
            : canvasHeight * 0.1
         const y = (canvasHeight - barHeight) / 2
         const barPosition = (x + FIXED_BAR_WIDTH / 2) / width
         const isFilled =
            hasData &&
            (isRecordingComplete || (isRecording && barPosition <= progress))

         ctx.globalAlpha = isFilled ? 1 : IDLE_BAR_ALPHA
         ctx.fillRect(x, y, FIXED_BAR_WIDTH, barHeight)
      }
      ctx.globalAlpha = 1
   }, [waveformData, isRecording, isCompleted, recordingTime, progress])

   const redraw = useEffectEvent(draw)

   useEffect(() => {
      const handleResize = (): void => {
         updateCanvasSize()
         redraw()
      }

      handleResize()
      window.addEventListener("resize", handleResize)
      return () => {
         window.removeEventListener("resize", handleResize)
      }
   }, [updateCanvasSize])

   useEffect(() => {
      draw()
   }, [draw])

   return (
      <div
         ref={containerRef}
         className={`relative w-full overflow-hidden ${className}`}
      >
         <canvas
            ref={canvasRef}
            className="block w-full"
            style={{ height: `${height}px` }}
         />
         {isRecording &&
            recordingTime > 0 && (
               // 全幅の枠ごと進捗ぶん右へずらし、左端の線を録音位置に合わせる
               <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{ transform: `translateX(${progress * 100}%)` }}
               >
                  <div className="h-full w-0.5 bg-record-500" />
               </div>
            )}
      </div>
   )
}
