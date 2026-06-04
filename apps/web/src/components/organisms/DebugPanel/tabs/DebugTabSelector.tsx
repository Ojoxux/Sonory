"use client"

import type { ReactElement } from "react"
import { DEBUG_TABS, type TabType } from "../types"

type DebugTabSelectorProps = {
   readonly selectedTab: TabType
   readonly onSelectTab: (tab: TabType) => void
}

export function DebugTabSelector({
   selectedTab,
   onSelectTab,
}: DebugTabSelectorProps): ReactElement {
   return (
      <div className="pointer-events-auto mb-3 flex gap-1">
         {DEBUG_TABS.map((tab) => (
            <button
               key={tab.id}
               type="button"
               onClick={() => onSelectTab(tab.id)}
               className={`rounded px-2 py-1 text-xs transition-colors ${
                  selectedTab === tab.id
                     ? "bg-blue-500/50 text-white"
                     : "text-gray-300 hover:bg-white/10"
               }`}
            >
               {tab.label}
            </button>
         ))}
      </div>
   )
}
