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

import mapboxgl from 'mapbox-gl'
import { useEffect } from 'react'

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
   map,
   debugMode,
   onToggleDebugMode,
   onGeolocationRetry,
   onGeolocationReset,
   onDebugTimeChange,
   onUpdateLighting,
}: UseMapKeyboardShortcutsProps): void {
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent): void => {
         console.log('キーイベント:', { shift: e.shiftKey, key: e.key })

         // Shift + D でデバッグモード切り替え
         if (e.shiftKey && e.key === 'D') {
            console.log('デバッグモード切り替え')
            onToggleDebugMode()
         }

         // Shift + G で位置情報を再取得
         if (e.shiftKey && e.key === 'G') {
            console.log('位置情報再取得を実行')
            e.preventDefault()
            onGeolocationRetry()
         }

         // Shift + R で位置情報キャッシュをクリアして再取得
         if (e.shiftKey && e.key === 'R') {
            console.log('位置情報キャッシュをクリアして再取得します...')
            e.preventDefault()
            onGeolocationReset()
         }

         // デバッグモード時の時間帯変更ショートカット
         if (debugMode) {
            // Shift + 1-4 で時間帯を変更
            if (e.shiftKey && ['1', '2', '3', '4'].includes(e.key)) {
               e.preventDefault()
               const timeMap: Record<string, number> = {
                  '1': 6, // 朝 (dawn)
                  '2': 12, // 昼 (day)
                  '3': 18, // 夕方 (dusk)
                  '4': 22, // 夜 (night)
               }
               const newTime = timeMap[e.key]
               if (newTime !== undefined) {
                  onDebugTimeChange(newTime)
                  console.log(`デバッグ時間を${newTime}時に設定しました`)
                  onUpdateLighting()
               }
            }

            // Shift + 0 でデバッグ時間をリセット
            if (e.shiftKey && e.key === '0') {
               e.preventDefault()
               onDebugTimeChange(null)
               console.log('デバッグ時間をリセットしました')
               onUpdateLighting()
            }
         }
      }

      window.addEventListener('keydown', handleKeyDown)

      return () => {
         window.removeEventListener('keydown', handleKeyDown)
      }
   }, [
      map,
      debugMode,
      onToggleDebugMode,
      onGeolocationRetry,
      onGeolocationReset,
      onDebugTimeChange,
      onUpdateLighting,
   ])
}
