"use client"

import type { Dispatch, ReactElement, SetStateAction } from "react"
import { AIAnalysisOrb } from "@/components/atoms/AIAnalysisOrb"
import type { OrbState } from "../types"

type OrbTabProps = {
   readonly orbState: OrbState
   readonly setOrbState: Dispatch<SetStateAction<OrbState>>
   readonly onResetDefault: () => void
   readonly onResetAnalyzing: () => void
   readonly onResetError: () => void
   readonly onResetComplete: () => void
}

export function OrbTab({
   orbState,
   setOrbState,
   onResetDefault,
   onResetAnalyzing,
   onResetError,
   onResetComplete,
}: OrbTabProps): ReactElement {
   return (
      <div className="pointer-events-auto space-y-4">
         <div className="flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-slate-900 to-slate-950">
            <AIAnalysisOrb
               hue={orbState.hue}
               hoverIntensity={orbState.hoverIntensity}
               rotateOnHover={orbState.rotateOnHover}
               forceHoverState={orbState.forceHoverState}
               cycleHue={orbState.cycleHue}
               hueCycleSpeed={orbState.hueCycleSpeed}
               size={orbState.size}
            />
            <div className="mt-6 flex flex-col items-center space-y-2 text-center">
               <p className="font-bold text-white text-xl tracking-wide">
                  音を聴いています...
               </p>
               <p className="text-gray-400 text-sm tracking-wide">
                  この音が何を伝えているか、感じています
               </p>
            </div>
         </div>

         <div className="space-y-3">
            <div>
               <label className="mb-1 block text-gray-300 text-xs">
                  Hue (色相): {orbState.hue}°
               </label>
               <input
                  type="range"
                  min="0"
                  max="360"
                  value={orbState.hue}
                  onChange={(e) =>
                     setOrbState((prev) => ({
                        ...prev,
                        hue: Number(e.target.value),
                     }))
                  }
                  className="w-full"
               />
            </div>

            <div>
               <label className="mb-1 block text-gray-300 text-xs">
                  Hover Intensity: {orbState.hoverIntensity.toFixed(2)}
               </label>
               <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={orbState.hoverIntensity}
                  onChange={(e) =>
                     setOrbState((prev) => ({
                        ...prev,
                        hoverIntensity: Number(e.target.value),
                     }))
                  }
                  className="w-full"
               />
            </div>

            <ToggleRow
               label="Rotate On Hover"
               value={orbState.rotateOnHover}
               onToggle={() =>
                  setOrbState((prev) => ({
                     ...prev,
                     rotateOnHover: !prev.rotateOnHover,
                  }))
               }
            />

            <ToggleRow
               label="Force Hover State"
               value={orbState.forceHoverState}
               onToggle={() =>
                  setOrbState((prev) => ({
                     ...prev,
                     forceHoverState: !prev.forceHoverState,
                  }))
               }
            />

            <ToggleRow
               label="Cycle Hue (色相サイクル)"
               value={orbState.cycleHue}
               onToggle={() =>
                  setOrbState((prev) => ({
                     ...prev,
                     cycleHue: !prev.cycleHue,
                  }))
               }
            />

            {orbState.cycleHue && (
               <div>
                  <label className="mb-1 block text-gray-300 text-xs">
                     Cycle Speed: {orbState.hueCycleSpeed}°/s
                  </label>
                  <input
                     type="range"
                     min="10"
                     max="120"
                     step="10"
                     value={orbState.hueCycleSpeed}
                     onChange={(e) =>
                        setOrbState((prev) => ({
                           ...prev,
                           hueCycleSpeed: Number(e.target.value),
                        }))
                     }
                     className="w-full"
                  />
               </div>
            )}

            <div>
               <label className="mb-1 block text-gray-300 text-xs">
                  Size: {orbState.size}px
               </label>
               <input
                  type="range"
                  min="160"
                  max="400"
                  step="20"
                  value={orbState.size}
                  onChange={(e) =>
                     setOrbState((prev) => ({
                        ...prev,
                        size: Number(e.target.value),
                     }))
                  }
                  className="w-full"
               />
            </div>

            <div className="grid grid-cols-2 gap-2">
               <button
                  type="button"
                  onClick={onResetDefault}
                  className="rounded bg-blue-500/20 px-2 py-1 text-blue-300 text-xs transition-colors hover:bg-blue-500/30"
               >
                  デフォルト (青)
               </button>
               <button
                  type="button"
                  onClick={onResetAnalyzing}
                  className="rounded bg-purple-500/20 px-2 py-1 text-purple-300 text-xs transition-colors hover:bg-purple-500/30"
               >
                  分析中 (虹色)
               </button>
               <button
                  type="button"
                  onClick={onResetError}
                  className="rounded bg-red-500/20 px-2 py-1 text-red-300 text-xs transition-colors hover:bg-red-500/30"
               >
                  エラー (赤)
               </button>
               <button
                  type="button"
                  onClick={onResetComplete}
                  className="rounded bg-green-500/20 px-2 py-1 text-green-300 text-xs transition-colors hover:bg-green-500/30"
               >
                  完了 (緑)
               </button>
            </div>
         </div>
      </div>
   )
}

type ToggleRowProps = {
   readonly label: string
   readonly value: boolean
   readonly onToggle: () => void
}

function ToggleRow({ label, value, onToggle }: ToggleRowProps): ReactElement {
   return (
      <div className="flex items-center justify-between">
         <label className="text-gray-300 text-xs">{label}</label>
         <button
            type="button"
            onClick={onToggle}
            className={`rounded px-3 py-1 text-xs transition-colors ${
               value
                  ? "bg-green-500/50 text-white"
                  : "bg-gray-600 text-gray-300"
            }`}
         >
            {value ? "ON" : "OFF"}
         </button>
      </div>
   )
}
