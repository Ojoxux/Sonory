/**
 * デバッグ情報表示パネル
 *
 * @description 開発時のデバッグ情報を表示するパネルコンポーネント
 * @example
 * ```tsx
 * <DebugPanel
 *   position={position}
 *   permissionStatus="granted"
 *   currentLighting={lighting}
 *   onTimeChange={(time) => setDebugTime(time)}
 * />
 * ```
 */

"use client"

import { motion } from "framer-motion"
import type { ReactElement } from "react"
import { FaBug, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { useInferenceStore } from "../../../store/useInferenceStore"
import { useRecorderStore } from "../../../store/useRecorderStore"
import { AIAnalysisOrb } from "../AIAnalysisOrb"
import type { DebugPanelProps } from "./types"
import {
   useDebugPanel,
   useDebugPanelState,
   useYAMNetDebug,
} from "./useDebugPanel"
import { formatMainDebugInfo, formatRecordedAt } from "./utils"

export function DebugPanel({
   position,
   permissionStatus,
   currentLighting,
   isMapboxPosition,
   geolocateInitialized,
   geolocateAttempted,
   debugTimeOverride,
   onTimeChange,
   onUpdateLighting,
   map,
   mapStyleLoaded,
   pins,
   realtime,
}: DebugPanelProps): ReactElement {
   const {
      isExpanded,
      selectedTab,
      orbState,
      toggleExpanded,
      setSelectedTab,
      setOrbState,
      resetOrbToDefault,
      resetOrbToAnalyzing,
      resetOrbToError,
      resetOrbToComplete,
   } = useDebugPanelState()

   const { handleTimeChange, handlePWADebugShow, handlePWADebugHide } =
      useDebugPanel({
         onTimeChange,
         onUpdateLighting,
      })

   // YAMNet統合テスト用
   const { results, isInferring, error } = useInferenceStore()
   const { audioData } = useRecorderStore()
   const { performanceData, logs, clearLogs } = useYAMNetDebug()

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: 20 }}
         className="absolute right-4 bottom-4 z-1000 max-w-sm rounded-md bg-black/70 p-3 text-white text-xs"
      >
         {/* ヘッダー */}
         <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <FaBug className="text-yellow-400" />
               <span className="font-bold">Debug Panel</span>
            </div>
            <button
               type="button"
               onClick={toggleExpanded}
               className="rounded p-1 transition-colors hover:bg-white/10"
            >
               {isExpanded ? <FaChevronDown /> : <FaChevronUp />}
            </button>
         </div>

         {/* タブ選択（展開時のみ） */}
         {isExpanded && (
            <div className="pointer-events-auto mb-3 flex gap-1">
               <button
                  type="button"
                  onClick={() => {
                     setSelectedTab("main")
                  }}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                     selectedTab === "main"
                        ? "bg-blue-500/50 text-white"
                        : "text-gray-300 hover:bg-white/10"
                  }`}
               >
                  Main
               </button>
               <button
                  type="button"
                  onClick={() => {
                     setSelectedTab("map")
                  }}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                     selectedTab === "map"
                        ? "bg-blue-500/50 text-white"
                        : "text-gray-300 hover:bg-white/10"
                  }`}
               >
                  Map
               </button>
               <button
                  type="button"
                  onClick={() => {
                     setSelectedTab("yamnet")
                  }}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                     selectedTab === "yamnet"
                        ? "bg-blue-500/50 text-white"
                        : "text-gray-300 hover:bg-white/10"
                  }`}
               >
                  YAMNet
               </button>
               <button
                  type="button"
                  onClick={() => {
                     setSelectedTab("orb")
                  }}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                     selectedTab === "orb"
                        ? "bg-blue-500/50 text-white"
                        : "text-gray-300 hover:bg-white/10"
                  }`}
               >
                  Orb
               </button>
            </div>
         )}

         {/* メインデバッグ情報（常に表示 or メインタブ） */}
         {(!isExpanded || selectedTab === "main") && (
            <div className="pointer-events-none mb-3">
               <pre style={{ margin: 0 }}>
                  {formatMainDebugInfo(
                     position,
                     permissionStatus,
                     isMapboxPosition,
                     geolocateInitialized,
                     geolocateAttempted,
                     currentLighting,
                     debugTimeOverride,
                  )}
               </pre>
            </div>
         )}

         {/* 展開時のコンテンツ */}
         {isExpanded && (
            <>
               {/* メインタブ */}
               {selectedTab === "main" && (
                  <div className="pointer-events-auto">
                     {/* 時間帯変更ボタン */}
                     <div className="mb-2 font-semibold text-white text-xs">
                        時間帯変更:
                     </div>
                     <div className="mb-2 grid grid-cols-2 gap-1">
                        <button
                           type="button"
                           onClick={() => handleTimeChange(5)}
                           className={`rounded px-2 py-1 text-xs transition-colors ${
                              debugTimeOverride === 5
                                 ? "bg-indigo-600 text-white"
                                 : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                           }`}
                        >
                           早朝暗め (5時)
                        </button>
                        <button
                           type="button"
                           onClick={() => handleTimeChange(7)}
                           className={`rounded px-2 py-1 text-xs transition-colors ${
                              debugTimeOverride === 7
                                 ? "bg-blue-400 text-white"
                                 : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                           }`}
                        >
                           朝自然 (7時)
                        </button>
                        <button
                           type="button"
                           onClick={() => handleTimeChange(12)}
                           className={`rounded px-2 py-1 text-xs transition-colors ${
                              debugTimeOverride === 12
                                 ? "bg-yellow-500 text-white"
                                 : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                           }`}
                        >
                           昼 (12時)
                        </button>
                        <button
                           type="button"
                           onClick={() => handleTimeChange(17)}
                           className={`rounded px-2 py-1 text-xs transition-colors ${
                              debugTimeOverride === 17
                                 ? "bg-orange-600 text-white"
                                 : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                           }`}
                        >
                           夕方初期 (17時)
                        </button>
                        <button
                           type="button"
                           onClick={() => handleTimeChange(20)}
                           className={`rounded px-2 py-1 text-xs transition-colors ${
                              debugTimeOverride === 20
                                 ? "bg-red-600 text-white"
                                 : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                           }`}
                        >
                           夕方後期 (20時)
                        </button>
                     </div>
                     <div className="mb-2 grid grid-cols-2 gap-1">
                        <button
                           type="button"
                           onClick={() => handleTimeChange(22)}
                           className={`rounded px-2 py-1 text-xs transition-colors ${
                              debugTimeOverride === 22
                                 ? "bg-blue-900 text-white"
                                 : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                           }`}
                        >
                           夜 (22時)
                        </button>
                        <button
                           type="button"
                           onClick={() => handleTimeChange(2)}
                           className={`rounded px-2 py-1 text-xs transition-colors ${
                              debugTimeOverride === 2
                                 ? "bg-indigo-900 text-white"
                                 : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                           }`}
                        >
                           深夜 (2時)
                        </button>
                     </div>
                     <button
                        type="button"
                        onClick={() => handleTimeChange(null)}
                        className={`w-full rounded px-2 py-1 text-xs transition-colors ${
                           debugTimeOverride === null
                              ? "bg-green-600 text-white"
                              : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                        }`}
                     >
                        実時間に戻す
                     </button>

                     {/* PWAインストールプロンプト操作 */}
                     <div className="mt-4">
                        <div className="mb-2 font-semibold text-white text-xs">
                           PWAインストールプロンプト:
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                           <button
                              type="button"
                              onClick={() => handlePWADebugShow(false)}
                              className="rounded bg-gray-600 px-2 py-1 text-gray-200 text-xs transition-colors hover:bg-gray-500"
                           >
                              表示（縮小）
                           </button>
                           <button
                              type="button"
                              onClick={() => handlePWADebugShow(true)}
                              className="rounded bg-gray-600 px-2 py-1 text-gray-200 text-xs transition-colors hover:bg-gray-500"
                           >
                              表示（展開）
                           </button>
                           <button
                              type="button"
                              onClick={handlePWADebugHide}
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
               )}

               {/* Mapタブ */}
               {selectedTab === "map" && (
                  <div className="pointer-events-auto max-h-80 space-y-2 overflow-y-auto">
                     {/* マップ状態 */}
                     <div className="grid grid-cols-2 gap-2">
                        <div className="rounded bg-white/5 p-2">
                           <div className="text-gray-400">🗺️ マップ</div>
                           <div
                              className={
                                 map ? "text-green-400" : "text-red-400"
                              }
                           >
                              {map ? "✅ 読み込み済み" : "❌ 未読み込み"}
                           </div>
                        </div>
                        <div className="rounded bg-white/5 p-2">
                           <div className="text-gray-400">🎨 スタイル</div>
                           <div
                              className={
                                 mapStyleLoaded
                                    ? "text-green-400"
                                    : "text-yellow-400"
                              }
                           >
                              {mapStyleLoaded
                                 ? "✅ 読み込み済み"
                                 : "⏳ 読み込み中"}
                           </div>
                        </div>
                     </div>

                     {/* ピンデータ状態 */}
                     <div className="rounded bg-white/5 p-2">
                        <div className="text-gray-400">📍 ピン数</div>
                        <div className="text-white">{pins?.length || 0}</div>
                        {pins && pins.length > 0 && (
                           <div className="mt-2 space-y-1">
                              <div className="text-gray-400 text-xs">
                                 最新ピン:
                              </div>
                              {pins.slice(0, 3).map((pin) => (
                                 <div key={pin.id} className="text-xs">
                                    • {pin.id.slice(0, 8)}... (
                                    {pin.isPersisted ? "DB" : "Local"})
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>

                     {/* リアルタイム接続状態 */}
                     {realtime && (
                        <div className="rounded bg-white/5 p-2">
                           <div className="text-gray-400">
                              🔄 リアルタイム接続
                           </div>
                           <div
                              className={
                                 realtime.isConnected
                                    ? "text-green-400"
                                    : "text-red-400"
                              }
                           >
                              {realtime.isConnected
                                 ? "🟢 Connected"
                                 : "🔴 Disconnected"}
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
               )}

               {/* YAMNetタブ */}
               {selectedTab === "yamnet" && (
                  <div className="pointer-events-auto max-h-80 space-y-2 overflow-y-auto">
                     {/* 現在の状態デバッグ */}
                     <div className="rounded border border-yellow-500/30 bg-yellow-500/20 p-2">
                        <div className="font-bold text-xs text-yellow-300">
                           Debug Info
                        </div>
                        <div className="text-xs text-yellow-200">
                           Selected Tab: {selectedTab} | Expanded:{" "}
                           {isExpanded ? "Yes" : "No"}
                        </div>
                     </div>

                     {/* 録音・AI状態 */}
                     <div className="grid grid-cols-2 gap-2">
                        <div className="rounded bg-white/5 p-2">
                           <div className="text-gray-400">AI Analysis</div>
                           <div
                              className={
                                 isInferring
                                    ? "text-yellow-400"
                                    : "text-green-400"
                              }
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
                              ? `${audioData.id.substring(0, 8)}... (${formatRecordedAt(
                                   audioData.recordedAt,
                                )})`
                              : "None"}
                        </div>
                     </div>

                     {/* パフォーマンス */}
                     <div className="rounded bg-white/5 p-2">
                        <div className="text-gray-400">Memory Usage</div>
                        <div>{performanceData.memoryUsage}MB</div>
                     </div>
                     <div className="rounded bg-white/5 p-2">
                        <div className="text-gray-400">Last AI Processing</div>
                        <div>{performanceData.lastAIProcessingTime}ms</div>
                     </div>

                     {/* エラー表示 */}
                     {error && (
                        <div className="rounded border border-red-500/30 bg-red-500/20 p-2">
                           <div className="text-red-400">Error</div>
                           <div className="text-red-300 text-xs">
                              {error.message}
                           </div>
                        </div>
                     )}

                     {/* 結果表示 */}
                     {results.length > 0 && (
                        <div className="rounded bg-white/5 p-2">
                           <div className="mb-1 text-gray-400">
                              Latest Results
                           </div>
                           {results.slice(0, 3).map((result, index) => (
                              <div
                                 key={`${result.label}-${index}`}
                                 className="text-xs"
                              >
                                 {result.label}:{" "}
                                 {Math.round(result.confidence * 100)}%
                              </div>
                           ))}
                        </div>
                     )}

                     {/* ログ */}
                     <div className="rounded bg-white/5 p-2">
                        <div className="mb-1 flex items-center justify-between">
                           <span className="text-gray-400">Recent Logs</span>
                           <button
                              type="button"
                              onClick={clearLogs}
                              className="rounded bg-red-500/20 px-1 py-0.5 text-red-300 text-xs transition-colors hover:bg-red-500/30"
                           >
                              Clear
                           </button>
                        </div>
                        <div className="max-h-32 space-y-1 overflow-y-auto">
                           {logs.slice(0, 5).map((log) => (
                              <div key={log.id} className="text-xs">
                                 <span className="text-gray-500">
                                    {log.timestamp}
                                 </span>
                                 : {log.message}
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* テストボタン */}
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
               )}

               {/* Orbタブ */}
               {selectedTab === "orb" && (
                  <div className="pointer-events-auto space-y-4">
                     {/* Orbプレビュー */}
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

                     {/* コントロールパネル */}
                     <div className="space-y-3">
                        {/* Hue */}
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

                        {/* Hover Intensity */}
                        <div>
                           <label className="mb-1 block text-gray-300 text-xs">
                              Hover Intensity:{" "}
                              {orbState.hoverIntensity.toFixed(2)}
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

                        {/* Rotate On Hover */}
                        <div className="flex items-center justify-between">
                           <label className="text-gray-300 text-xs">
                              Rotate On Hover
                           </label>
                           <button
                              type="button"
                              onClick={() =>
                                 setOrbState((prev) => ({
                                    ...prev,
                                    rotateOnHover: !prev.rotateOnHover,
                                 }))
                              }
                              className={`rounded px-3 py-1 text-xs transition-colors ${
                                 orbState.rotateOnHover
                                    ? "bg-green-500/50 text-white"
                                    : "bg-gray-600 text-gray-300"
                              }`}
                           >
                              {orbState.rotateOnHover ? "ON" : "OFF"}
                           </button>
                        </div>

                        {/* Force Hover State */}
                        <div className="flex items-center justify-between">
                           <label className="text-gray-300 text-xs">
                              Force Hover State
                           </label>
                           <button
                              type="button"
                              onClick={() =>
                                 setOrbState((prev) => ({
                                    ...prev,
                                    forceHoverState: !prev.forceHoverState,
                                 }))
                              }
                              className={`rounded px-3 py-1 text-xs transition-colors ${
                                 orbState.forceHoverState
                                    ? "bg-green-500/50 text-white"
                                    : "bg-gray-600 text-gray-300"
                              }`}
                           >
                              {orbState.forceHoverState ? "ON" : "OFF"}
                           </button>
                        </div>

                        {/* Cycle Hue */}
                        <div className="flex items-center justify-between">
                           <label className="text-gray-300 text-xs">
                              Cycle Hue (色相サイクル)
                           </label>
                           <button
                              type="button"
                              onClick={() =>
                                 setOrbState((prev) => ({
                                    ...prev,
                                    cycleHue: !prev.cycleHue,
                                 }))
                              }
                              className={`rounded px-3 py-1 text-xs transition-colors ${
                                 orbState.cycleHue
                                    ? "bg-green-500/50 text-white"
                                    : "bg-gray-600 text-gray-300"
                              }`}
                           >
                              {orbState.cycleHue ? "ON" : "OFF"}
                           </button>
                        </div>

                        {/* Hue Cycle Speed */}
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

                        {/* Size */}
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

                        {/* プリセットボタン */}
                        <div className="grid grid-cols-2 gap-2">
                           <button
                              type="button"
                              onClick={resetOrbToDefault}
                              className="rounded bg-blue-500/20 px-2 py-1 text-blue-300 text-xs transition-colors hover:bg-blue-500/30"
                           >
                              デフォルト (青)
                           </button>
                           <button
                              type="button"
                              onClick={resetOrbToAnalyzing}
                              className="rounded bg-purple-500/20 px-2 py-1 text-purple-300 text-xs transition-colors hover:bg-purple-500/30"
                           >
                              分析中 (虹色)
                           </button>
                           <button
                              type="button"
                              onClick={resetOrbToError}
                              className="rounded bg-red-500/20 px-2 py-1 text-red-300 text-xs transition-colors hover:bg-red-500/30"
                           >
                              エラー (赤)
                           </button>
                           <button
                              type="button"
                              onClick={resetOrbToComplete}
                              className="rounded bg-green-500/20 px-2 py-1 text-green-300 text-xs transition-colors hover:bg-green-500/30"
                           >
                              完了 (緑)
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </>
         )}
      </motion.div>
   )
}
