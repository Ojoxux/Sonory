import { Mic } from "lucide-react"
import type { RecordingInitialStateProps } from "./types"

/**
 * 録音初期状態コンポーネント
 *
 * @description
 * 録音開始前の初期状態を表示するコンポーネント
 *
 * @param onClick 録音ボタンクリック時のコールバック
 */
export function RecordingInitialState({ onClick }: RecordingInitialStateProps) {
   return (
      <button
         type="button"
         onClick={onClick}
         aria-label="録音する"
         className="flex h-16 w-48 touch-manipulation items-center justify-center rounded-full bg-black text-white shadow-2xl transition duration-press ease-out focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-2 hover:bg-neutral-800 active:scale-97 sm:size-20"
      >
         <Mic aria-hidden="true" className="size-7 sm:size-8" />
      </button>
   )
}
