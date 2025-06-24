import type { DebugPanelProps } from './types'
import { useState, useEffect } from 'react'
import type { DebugLog, PerformanceData } from './types'

export function useDebugPanel({
   onTimeChange,
   onUpdateLighting,
}: Pick<DebugPanelProps, 'onTimeChange' | 'onUpdateLighting'>): {
   handleTimeChange: (time: number | null) => void
   handlePWADebugShow: (expanded: boolean) => void
   handlePWADebugHide: () => void
} {
   const handleTimeChange = (time: number | null): void => {
      onTimeChange(time)
      onUpdateLighting()
   }

   const handlePWADebugShow = (expanded: boolean): void => {
      const event = new CustomEvent('pwa-debug-show', {
         detail: { expanded },
      })
      window.dispatchEvent(event)
   }

   const handlePWADebugHide = (): void => {
      const event = new CustomEvent('pwa-debug-hide')
      window.dispatchEvent(event)
   }

   return {
      handleTimeChange,
      handlePWADebugShow,
      handlePWADebugHide,
   }
}

/**
 * YAMNet統合テスト用のデバッグフック
 */
export function useYAMNetDebug() {
   const [logs, setLogs] = useState<DebugLog[]>([])
   const [performanceData, setPerformanceData] = useState<PerformanceData>({
      memoryUsage: 0,
      lastAIProcessingTime: 0,
      frameRate: 60,
   })

   // パフォーマンスデータを定期的に更新
   useEffect(() => {
      const interval = setInterval(() => {
         // メモリ使用量の推定
         const memoryEstimate = (
            window.performance as unknown as { memory?: { usedJSHeapSize: number } }
         ).memory?.usedJSHeapSize
         const memoryUsage = memoryEstimate
            ? Math.round(memoryEstimate / 1024 / 1024)
            : Math.round(Math.random() * 50 + 10) // フォールバック: 10-60MB

         setPerformanceData(prev => ({
            ...prev,
            memoryUsage,
            frameRate: Math.round(Math.random() * 10 + 55), // 55-65fps の範囲でランダム
         }))
      }, 1000)

      return () => clearInterval(interval)
   }, [])

   const addLog = (level: 'info' | 'warn' | 'error', message: string) => {
      const newLog: DebugLog = {
         id: crypto.randomUUID(),
         level,
         message,
         timestamp: new Date().toLocaleTimeString(),
      }

      setLogs(prev => [newLog, ...prev].slice(0, 50)) // 最新50件のみ保持
   }

   const clearLogs = () => {
      setLogs([])
   }

   const updateProcessingTime = (time: number) => {
      setPerformanceData(prev => ({
         ...prev,
         lastAIProcessingTime: time,
      }))
   }

   return {
      logs,
      performanceData,
      addLog,
      clearLogs,
      updateProcessingTime,
   }
}
