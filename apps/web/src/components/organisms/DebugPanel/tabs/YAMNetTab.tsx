"use client"

import type { ReactElement } from "react"
import type { AudioData, InferenceResult } from "@/store/types"
import type { DebugLog, PerformanceData } from "../types"
import { formatRecordedAt } from "../utils"

type YAMNetTabProps = {
   readonly selectedTab: string
   readonly isExpanded: boolean
   readonly isInferring: boolean
   readonly results: readonly InferenceResult[]
   readonly error: { message: string } | null
   readonly audioData: AudioData | null
   readonly performanceData: PerformanceData
   readonly logs: readonly DebugLog[]
   readonly onClearLogs: () => void
}

export function YAMNetTab({
   selectedTab,
   isExpanded,
   isInferring,
   results,
   error,
   audioData,
   performanceData,
   logs,
   onClearLogs,
}: YAMNetTabProps): ReactElement {
   return (
      <div className="pointer-events-auto max-h-80 space-y-2 overflow-y-auto">
         <div className="rounded border border-yellow-500/30 bg-yellow-500/20 p-2">
            <div className="font-bold text-xs text-yellow-300">Debug Info</div>
            <div className="text-xs text-yellow-200">
               Selected Tab: {selectedTab} | Expanded:{" "}
               {isExpanded ? "Yes" : "No"}
            </div>
         </div>

         <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-white/5 p-2">
               <div className="text-gray-400">AI Analysis</div>
               <div
                  className={isInferring ? "text-yellow-400" : "text-green-400"}
               >
                  {isInferring ? "Running" : "Idle"}
               </div>
            </div>
            <div className="rounded bg-white/5 p-2">
               <div className="text-gray-400">Results Count</div>
               <div>{results.length}</div>
            </div>
         </div>

         <div className="rounded bg-white/5 p-2">
            <div className="text-gray-400">Audio Data</div>
            <div>
               {audioData
                  ? `${audioData.id.substring(0, 8)}... (${formatRecordedAt(audioData.recordedAt)})`
                  : "None"}
            </div>
         </div>

         <div className="rounded bg-white/5 p-2">
            <div className="text-gray-400">Memory Usage</div>
            <div>{performanceData.memoryUsage}MB</div>
         </div>
         <div className="rounded bg-white/5 p-2">
            <div className="text-gray-400">Last AI Processing</div>
            <div>{performanceData.lastAIProcessingTime}ms</div>
         </div>

         {error && (
            <div className="rounded border border-red-500/30 bg-red-500/20 p-2">
               <div className="text-red-400">Error</div>
               <div className="text-red-300 text-xs">{error.message}</div>
            </div>
         )}

         {results.length > 0 && (
            <div className="rounded bg-white/5 p-2">
               <div className="mb-1 text-gray-400">Latest Results</div>
               {results.slice(0, 3).map((result, index) => (
                  <div key={`${result.label}-${index}`} className="text-xs">
                     {result.label}: {Math.round(result.confidence * 100)}%
                  </div>
               ))}
            </div>
         )}

         <div className="rounded bg-white/5 p-2">
            <div className="mb-1 flex items-center justify-between">
               <span className="text-gray-400">Recent Logs</span>
               <button
                  type="button"
                  onClick={onClearLogs}
                  className="rounded bg-red-500/20 px-1 py-0.5 text-red-300 text-xs transition-colors hover:bg-red-500/30"
               >
                  Clear
               </button>
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto">
               {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="text-xs">
                     <span className="text-gray-500">{log.timestamp}</span>:{" "}
                     {log.message}
                  </div>
               ))}
            </div>
         </div>

         <button
            type="button"
            onClick={() => {
               alert("YAMNet Test Button Clicked!")
            }}
            className="w-full rounded bg-blue-500/20 p-2 text-blue-300 transition-colors hover:bg-blue-500/30"
         >
            Test YAMNet Button
         </button>
      </div>
   )
}
