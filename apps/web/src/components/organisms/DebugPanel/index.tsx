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
import { useInferenceStore } from "@/store/useInferenceStore"
import { useRecorderStore } from "@/store/useRecorderStore"
import { DebugTabSelector } from "./tabs/DebugTabSelector"
import { MainTab } from "./tabs/MainTab"
import { MapTab } from "./tabs/MapTab"
import { OrbTab } from "./tabs/OrbTab"
import { YAMNetTab } from "./tabs/YAMNetTab"
import type { DebugPanelProps } from "./types"
import {
   useDebugPanel,
   useDebugPanelState,
   useYAMNetDebug,
} from "./useDebugPanel"
import { formatMainDebugInfo } from "./utils"

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

   const { results, isInferring, error } = useInferenceStore()
   const { audioData } = useRecorderStore()
   const { performanceData, logs, clearLogs } = useYAMNetDebug()

   if (process.env.NODE_ENV === "production") {
      return <></>
   }

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

         {/* タブ選択 */}
         {isExpanded && (
            <DebugTabSelector
               selectedTab={selectedTab}
               onSelectTab={setSelectedTab}
            />
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

         {/* 展開時のタブコンテンツ */}
         {isExpanded && (
            <>
               {selectedTab === "main" && (
                  <MainTab
                     debugTimeOverride={debugTimeOverride}
                     onTimeChange={handleTimeChange}
                     onPWADebugShow={handlePWADebugShow}
                     onPWADebugHide={handlePWADebugHide}
                  />
               )}

               {selectedTab === "map" && (
                  <MapTab
                     map={map}
                     mapStyleLoaded={mapStyleLoaded}
                     pins={pins}
                     realtime={realtime}
                  />
               )}

               {selectedTab === "yamnet" && (
                  <YAMNetTab
                     selectedTab={selectedTab}
                     isExpanded={isExpanded}
                     isInferring={isInferring}
                     results={results}
                     error={error}
                     audioData={audioData}
                     performanceData={performanceData}
                     logs={logs}
                     onClearLogs={clearLogs}
                  />
               )}

               {selectedTab === "orb" && (
                  <OrbTab
                     orbState={orbState}
                     setOrbState={setOrbState}
                     onResetDefault={resetOrbToDefault}
                     onResetAnalyzing={resetOrbToAnalyzing}
                     onResetError={resetOrbToError}
                     onResetComplete={resetOrbToComplete}
                  />
               )}
            </>
         )}
      </motion.div>
   )
}
