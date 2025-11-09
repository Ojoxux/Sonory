/**
 * マップ制御フック
 *
 * @description
 * キーボードショートカットによるマップ操作を提供する
 * 位置復帰、ズーム、回転などの制御機能
 *
 * @param map Mapboxマップインスタンス
 * @param onReturnToLocationReady 位置復帰準備完了時のコールバック
 * @returns キーボード制御の状態
 */

import type mapboxgl from "mapbox-gl"
import { useEffect } from "react"

export type UseMapKeyboardShortcutsProps = {
   /** Mapboxマップインスタンス */
   map: mapboxgl.Map | null
   /** デバッグモードの状態 */
   debugMode: boolean
   /** デバッグモード切り替えのコールバック */
   onToggleDebugMode: () => void
   /** 位置情報再取得のコールバック */
   onGeolocationRetry: () => void
   /** 位置情報キャッシュクリア＆再取得のコールバック */
   onGeolocationReset: () => void
   /** デバッグ時間変更のコールバック */
   onDebugTimeChange: (time: number | null) => void
   /** ライティング更新のコールバック */
   onUpdateLighting: () => void
}

/**
 * マップ用キーボードショートカットフック
 */
export function useMapControls({
   map: _map,
   debugMode,
   onToggleDebugMode,
   onGeolocationRetry,
   onGeolocationReset,
   onDebugTimeChange,
   onUpdateLighting,
}: UseMapKeyboardShortcutsProps): void {
   useEffect(() => {
      /**
       * デバッグモードの時間帯変更を処理する
       */
      const handleDebugTimeChange = (e: KeyboardEvent): boolean => {
         if (!debugMode) {
            return false
         }

         // Shift + 1-4 で時間帯を変更
         if (e.shiftKey && ["1", "2", "3", "4"].includes(e.key)) {
            e.preventDefault()
            const timeMap: Record<string, number> = {
               "1": 6, // 朝 (dawn)
               "2": 12, // 昼 (day)
               "3": 18, // 夕方 (dusk)
               "4": 22, // 夜 (night)
            }
            const newTime = timeMap[e.key]
            if (newTime !== undefined) {
               onDebugTimeChange(newTime)
               onUpdateLighting()
            }
            return true
         }

         // Shift + 0 でデバッグ時間をリセット
         if (e.shiftKey && e.key === "0") {
            e.preventDefault()
            onDebugTimeChange(null)
            onUpdateLighting()
            return true
         }

         return false
      }

      /**
       * 位置情報関連のショートカットを処理する
       */
      const handleGeolocationShortcuts = (e: KeyboardEvent): boolean => {
         // Shift + G で位置情報を再取得
         if (e.shiftKey && e.key === "G") {
            e.preventDefault()
            onGeolocationRetry()
            return true
         }

         // Shift + R で位置情報キャッシュをクリアして再取得
         if (e.shiftKey && e.key === "R") {
            e.preventDefault()
            onGeolocationReset()
            return true
         }

         return false
      }

      /**
       * デバッグモード切り替えを処理する
       */
      const handleDebugModeToggle = (e: KeyboardEvent): boolean => {
         if (e.shiftKey && e.key === "D") {
            onToggleDebugMode()
            return true
         }
         return false
      }

      const handleKeyDown = (e: KeyboardEvent): void => {
         // 順番に処理を試み、処理された場合は早期リターン
         if (handleDebugModeToggle(e)) return
         if (handleGeolocationShortcuts(e)) return
         handleDebugTimeChange(e)
      }

      window.addEventListener("keydown", handleKeyDown)

      return () => {
         window.removeEventListener("keydown", handleKeyDown)
      }
   }, [
      debugMode,
      onToggleDebugMode,
      onGeolocationRetry,
      onGeolocationReset,
      onDebugTimeChange,
      onUpdateLighting,
   ])
}
