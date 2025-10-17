/**
 * マップデバッグ機能管理フック
 */

import { useEffect } from "react"
import { useDebugStore } from "@/store/useDebugStore"

export interface UseMapDebugReturn {
   debugMode: boolean
   debugTimeOverride: number | null
   toggleDebugMode: () => void
   setDebugTimeOverride: (time: number | null) => void
   setDebugMode: (mode: boolean) => void
}

/**
 * マップのデバッグ機能を管理するフック
 * @returns デバッグ状態と制御関数
 */
export const useMapDebug = (): UseMapDebugReturn => {
   const {
      debugMode,
      toggleDebugMode,
      debugTimeOverride,
      setDebugTimeOverride,
      setDebugMode,
   } = useDebugStore()

   // HACK: 初期化時にdebugModeをfalseに強制設定 (デバッグモードがデフォルトで出てしまうため)
   useEffect(() => {
      setDebugMode(false)
      if (process.env.NODE_ENV === "development") {
         console.log("[MapComponent] debugModeをfalseにリセット")
      }
   }, [setDebugMode])

   return {
      debugMode,
      toggleDebugMode,
      debugTimeOverride,
      setDebugTimeOverride,
      setDebugMode,
   }
}
