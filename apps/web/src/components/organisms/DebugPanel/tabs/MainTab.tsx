"use client"

import type { ReactElement } from "react"

type MainTabProps = {
   readonly debugTimeOverride: number | null
   readonly onTimeChange: (time: number | null) => void
   readonly onPWADebugShow: (expanded: boolean) => void
   readonly onPWADebugHide: () => void
}

const TIME_PRESETS: readonly {
   readonly hour: number
   readonly label: string
   readonly activeClass: string
}[] = [
   { hour: 5, label: "早朝暗め (5時)", activeClass: "bg-indigo-600" },
   { hour: 7, label: "朝自然 (7時)", activeClass: "bg-blue-400" },
   { hour: 12, label: "昼 (12時)", activeClass: "bg-yellow-500" },
   { hour: 17, label: "夕方初期 (17時)", activeClass: "bg-orange-600" },
   { hour: 20, label: "夕方後期 (20時)", activeClass: "bg-red-600" },
   { hour: 22, label: "夜 (22時)", activeClass: "bg-blue-900" },
   { hour: 2, label: "深夜 (2時)", activeClass: "bg-indigo-900" },
] as const

export function MainTab({
   debugTimeOverride,
   onTimeChange,
   onPWADebugShow,
   onPWADebugHide,
}: MainTabProps): ReactElement {
   return (
      <div className="pointer-events-auto">
         <div className="mb-2 font-semibold text-white text-xs">
            時間帯変更:
         </div>
         <div className="mb-2 grid grid-cols-2 gap-1">
            {TIME_PRESETS.slice(0, 4).map((preset) => (
               <button
                  key={preset.hour}
                  type="button"
                  onClick={() => onTimeChange(preset.hour)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                     debugTimeOverride === preset.hour
                        ? `${preset.activeClass} text-white`
                        : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }`}
               >
                  {preset.label}
               </button>
            ))}
         </div>
         <div className="mb-2 grid grid-cols-2 gap-1">
            {TIME_PRESETS.slice(4).map((preset) => (
               <button
                  key={preset.hour}
                  type="button"
                  onClick={() => onTimeChange(preset.hour)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                     debugTimeOverride === preset.hour
                        ? `${preset.activeClass} text-white`
                        : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                  }`}
               >
                  {preset.label}
               </button>
            ))}
         </div>
         <button
            type="button"
            onClick={() => onTimeChange(null)}
            className={`w-full rounded px-2 py-1 text-xs transition-colors ${
               debugTimeOverride === null
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-gray-200 hover:bg-gray-500"
            }`}
         >
            実時間に戻す
         </button>

         <div className="mt-4">
            <div className="mb-2 font-semibold text-white text-xs">
               PWAインストールプロンプト:
            </div>
            <div className="grid grid-cols-2 gap-1">
               <button
                  type="button"
                  onClick={() => onPWADebugShow(false)}
                  className="rounded bg-gray-600 px-2 py-1 text-gray-200 text-xs transition-colors hover:bg-gray-500"
               >
                  表示（縮小）
               </button>
               <button
                  type="button"
                  onClick={() => onPWADebugShow(true)}
                  className="rounded bg-gray-600 px-2 py-1 text-gray-200 text-xs transition-colors hover:bg-gray-500"
               >
                  表示（展開）
               </button>
               <button
                  type="button"
                  onClick={onPWADebugHide}
                  className="col-span-2 rounded bg-gray-600 px-2 py-1 text-gray-200 text-xs transition-colors hover:bg-gray-500"
               >
                  非表示
               </button>
            </div>
         </div>

         <div className="pointer-events-none mt-3 text-gray-300 text-xs">
            <div>キーボードショートカット:</div>
            <div>Shift+D: デバッグモード切替</div>
            <div>Shift+G: 位置情報再取得</div>
            <div>Shift+R: キャッシュクリア&再取得</div>
         </div>
      </div>
   )
}
