"use client"

import type { SettingToggleProps } from "./types"

/**
 * 設定用の汎用トグル
 *
 * @description
 * `MicPermissionToggle` の track / knob の見た目を流用した汎用コンポーネント。
 * `MicPermissionToggle` 自体はマイク権限専用のためここでは触れず、
 * 設定シートなど on/off の切り替え全般に使えるものとして切り出している。
 *
 * @param checked トグルの現在の状態
 * @param onChange 切り替え時のコールバック
 * @param label トグルのラベル
 * @param description ラベル下に表示する補足文言
 * @param disabled 無効化するかどうか
 * @param className 追加のCSSクラス
 */
export function SettingToggle({
   checked,
   onChange,
   label,
   description,
   disabled = false,
   className = "",
}: SettingToggleProps) {
   const trackColor = checked ? "bg-done-500" : "bg-white/20"

   return (
      <button
         type="button"
         role="switch"
         aria-checked={checked}
         aria-label={label}
         disabled={disabled}
         onClick={onChange}
         className={`flex w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition-colors duration-300 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 ${className}`}
      >
         <span className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm text-white">{label}</span>
            {description && (
               <span className="text-neutral-300 text-xs">{description}</span>
            )}
         </span>

         <span
            aria-hidden="true"
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${trackColor}`}
         >
            <span
               className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                  checked ? "translate-x-5" : "translate-x-0"
               }`}
            />
         </span>
      </button>
   )
}
