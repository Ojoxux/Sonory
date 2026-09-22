"use client"

import { Collapsible } from "@base-ui-components/react/collapsible"
import { ChevronDown } from "lucide-react"
import type { ReactElement } from "react"
import { formatConfidence } from "../PrimaryResult/utils"
import type { OtherResultsAccordionProps } from "./types"

/**
 * 主要結果以外の分類候補を折りたたんで出す
 *
 * @param results 主要結果を除いた候補。空なら何も描画しない
 *
 * @example
 * ```tsx
 * <OtherResultsAccordion results={results.slice(1)} />
 * ```
 */
export function OtherResultsAccordion({
   results,
}: OtherResultsAccordionProps): ReactElement | null {
   if (results.length === 0) {
      return null
   }

   return (
      <Collapsible.Root className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
         <Collapsible.Trigger className="group flex w-full touch-manipulation select-none items-center justify-between p-3 text-left transition duration-press ease-out focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:-outline-offset-2 hover:bg-white/5 active:scale-97">
            <span className="font-medium text-white/60 text-xs">
               その他の候補 ({results.length}件)
            </span>
            <ChevronDown
               aria-hidden="true"
               className="size-4 text-white/60 transition-transform duration-menu ease-out group-data-panel-open:rotate-180"
            />
         </Collapsible.Trigger>

         {/* Tailwind に height だけを対象にする transition が無いため style で指定する */}
         <Collapsible.Panel
            className="h-(--collapsible-panel-height) overflow-hidden duration-menu ease-out motion-reduce:duration-0 data-ending-style:h-0 data-starting-style:h-0"
            style={{ transitionProperty: "height" }}
         >
            <ul className="space-y-2 px-3 pb-3">
               {results.map((result, index) => (
                  <li
                     key={`${result.label}-${index}`}
                     className="flex items-center justify-between py-1"
                  >
                     <span className="text-neutral-300 text-sm">
                        {result.label === "unknown" ? "未分類" : result.label}
                     </span>
                     <span className="font-mono text-neutral-400 text-xs">
                        {formatConfidence(result.confidence)}
                     </span>
                  </li>
               ))}
            </ul>
         </Collapsible.Panel>
      </Collapsible.Root>
   )
}
