"use client"

import type { ReactElement } from "react"
import type { TabType } from "../types"

const TABS: readonly { readonly id: TabType; readonly label: string }[] = [
   { id: "main", label: "Main" },
   { id: "map", label: "Map" },
   { id: "yamnet", label: "YAMNet" },
   { id: "orb", label: "Orb" },
] as const

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
         {TABS.map((tab) => (
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
