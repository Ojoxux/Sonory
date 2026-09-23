"use client"

import { useEffect, useState } from "react"
import { SLOT_MS } from "@/components/molecules/WaveformDisplay/constants"
import {
   sampleLevel,
   slotCount,
} from "@/components/molecules/WaveformDisplay/utils"

/**
 * 録音中のマイク入力から、区間ごとの音量を集める
 *
 * @description
 * `AnalyserNode` を毎フレーム読み、`SLOT_MS` の区間ごとに最大値を1つ残す。
 * 毎フレーム描き直すと音量の山を取りこぼすうえ再描画も増えるため、区間の変わり目だけ state を更新する。
 * 出力には繋がない（マイクの音が再生されてしまうため）
 *
 * @param stream 録音中のマイクのストリーム。停止後は null
 * @param maxDuration 最大録音時間（秒）
 * @returns 先頭から順に並んだ音量（0〜1）。録音が終わっても最後の結果を保つ
 */
export function useMicrophoneLevels(
   stream: MediaStream | null,
   maxDuration: number,
): readonly number[] {
   const [levels, setLevels] = useState<readonly number[]>([])

   useEffect(() => {
      // 停止時は次の録音まで結果を残す（完了直後の波形を見せるため）
      if (!stream) return

      const context = new AudioContext()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)

      // ユーザー操作を経ていても Safari では suspended で始まることがある
      void context.resume()

      const samples = new Float32Array(analyser.fftSize)
      const totalSlots = slotCount(maxDuration)
      const startedAt = performance.now()
      const collected: number[] = []
      let peak = 0
      let frameId = 0

      const read = (): void => {
         analyser.getFloatTimeDomainData(samples)
         peak = Math.max(peak, sampleLevel(samples))

         const elapsedSlots = Math.min(
            totalSlots,
            Math.floor((performance.now() - startedAt) / SLOT_MS),
         )
         if (elapsedSlots > collected.length) {
            while (collected.length < elapsedSlots) {
               collected.push(peak)
            }
            peak = 0
            setLevels([...collected])
         }

         frameId = requestAnimationFrame(read)
      }

      setLevels([])
      frameId = requestAnimationFrame(read)

      return () => {
         cancelAnimationFrame(frameId)
         source.disconnect()
         void context.close()
      }
   }, [stream, maxDuration])

   return levels
}
