"use client"

import type { ReactElement } from "react"
import type { UseRealtimeReturn } from "@/hooks/useRealtime"
import type { SoundPin } from "@/store/useSoundPinStore"

type MapTabProps = {
   readonly map?: mapboxgl.Map | null
   readonly mapStyleLoaded?: boolean
   readonly pins?: SoundPin[]
   readonly realtime?: UseRealtimeReturn
}

export function MapTab({
   map,
   mapStyleLoaded,
   pins,
   realtime,
}: MapTabProps): ReactElement {
   return (
      <div className="pointer-events-auto max-h-80 space-y-2 overflow-y-auto">
         <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-white/5 p-2">
               <div className="text-gray-400">🗺️ マップ</div>
               <div className={map ? "text-green-400" : "text-red-400"}>
                  {map ? "✅ 読み込み済み" : "❌ 未読み込み"}
               </div>
            </div>
            <div className="rounded bg-white/5 p-2">
               <div className="text-gray-400">🎨 スタイル</div>
               <div
                  className={
                     mapStyleLoaded ? "text-green-400" : "text-yellow-400"
                  }
               >
                  {mapStyleLoaded ? "✅ 読み込み済み" : "⏳ 読み込み中"}
               </div>
            </div>
         </div>

         <div className="rounded bg-white/5 p-2">
            <div className="text-gray-400">📍 ピン数</div>
            <div className="text-white">{pins?.length || 0}</div>
            {pins && pins.length > 0 && (
               <div className="mt-2 space-y-1">
                  <div className="text-gray-400 text-xs">最新ピン:</div>
                  {pins.slice(0, 3).map((pin) => (
                     <div key={pin.id} className="text-xs">
                        • {pin.id.slice(0, 8)}... (
                        {pin.isPersisted ? "DB" : "Local"})
                     </div>
                  ))}
               </div>
            )}
         </div>

         {realtime && (
            <div className="rounded bg-white/5 p-2">
               <div className="text-gray-400">🔄 リアルタイム接続</div>
               <div
                  className={
                     realtime.isConnected ? "text-green-400" : "text-red-400"
                  }
               >
                  {realtime.isConnected ? "🟢 Connected" : "🔴 Disconnected"}
               </div>
               <div className="mt-1 text-xs">
                  <div>Status: {realtime.connectionStatus}</div>
                  <div>Unread: {realtime.unreadCount}</div>
                  {realtime.connectionError && (
                     <div className="text-red-300">
                        Error: {realtime.connectionError}
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   )
}
