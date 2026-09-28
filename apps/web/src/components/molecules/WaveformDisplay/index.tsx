"use client"

import { useCallback, useEffect, useEffectEvent, useRef } from "react"
import { BAR_GAP, BAR_WIDTH, IDLE_BAR_ALPHA } from "./constants"
import type { WaveformDisplayProps } from "./types"
import { barCount, barValues, slotCount } from "./utils"

/**
 * 波形表示コンポーネント
 *
 * @description
 * 幅いっぱいを録音時間の全体として描く。バー1本は一定の時間を受け持ち、
 * その区間で実際に録れた音量になる。まだ録音していない位置は薄いバーで示す。
 * バーは `currentColor` で塗る（`className` の `text-*` で色を決める）。背景は透過。
 * 録音位置の線は canvas ではなく `record` の要素を `transform` で動かす
 *
 * @param isRecording 録音中かどうか
 * @param recordingTime 録音時間
 * @param maxDuration 最大録音時間
 * @param height 波形の高さ
 * @param levels 区間ごとの音量（0〜1）
 * @param className クラス名
 * @param isCompleted 録音完了かどうか
 *
 * @example
 * ```tsx
 * <WaveformDisplay
 *   isRecording={true}
 *   recordingTime={5.5}
 *   levels={[0.2, 0.6, 0.4]}
 *   className="text-white"
 * />
 * ```
 */
export function WaveformDisplay({
   isRecording,
   recordingTime,
   maxDuration = 10,
   height = 128,
   levels = [],
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

      const bars = barCount(width)
      const values = barValues(levels, bars, slotCount(maxDuration))

      values.forEach((value, index) => {
         const barHeight =
            value === undefined
               ? canvasHeight * 0.1
               : Math.max(2, value * canvasHeight * 0.8)

         ctx.globalAlpha = value === undefined ? IDLE_BAR_ALPHA : 1
         ctx.fillRect(
            index * (BAR_WIDTH + BAR_GAP),
            (canvasHeight - barHeight) / 2,
            BAR_WIDTH,
            barHeight,
         )
      })
      ctx.globalAlpha = 1
   }, [levels, maxDuration])

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
            !isCompleted &&
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
