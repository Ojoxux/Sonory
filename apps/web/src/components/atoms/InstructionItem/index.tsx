import type { InstructionItemProps } from "./types"

/**
 * 確認事項アイテムコンポーネント
 *
 * @description
 * 録音前の確認事項を表示する個別アイテム
 *
 * @param text 表示するテキスト
 * @param className 追加のCSSクラス
 */
export function InstructionItem({
   text,
   className = "",
}: InstructionItemProps) {
   return (
      <div
         className={`flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 ${className}`}
      >
         <span
            aria-hidden="true"
            className="mt-2 size-2 shrink-0 rounded-full bg-white"
         />
         <span className="font-medium text-neutral-100 text-sm leading-relaxed">
            {text}
         </span>
      </div>
   )
}
