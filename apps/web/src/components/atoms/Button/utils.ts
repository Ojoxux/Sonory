import { cva } from "class-variance-authority"

/**
 * ボタンの見た目を組み立てる
 *
 * @description
 * `<a>` など `<button>` 以外にボタンの見た目を当てるときにも使う
 */
export const buttonVariants = cva(
   // 押下で縮めて「押せた」ことを返す。無効時は縮めない
   "inline-flex touch-manipulation select-none items-center justify-center gap-2 font-semibold text-sm transition duration-press ease-out focus-visible:outline-2 focus-visible:outline-white/60 focus-visible:outline-offset-2 not-disabled:active:scale-97 disabled:cursor-not-allowed disabled:opacity-50",
   {
      variants: {
         intent: {
            accent: "bg-accent-600 text-white hover:bg-accent-500",
            done: "bg-done-600 text-white hover:bg-done-500",
            secondary:
               "border border-white/10 bg-white/5 text-white hover:bg-white/10",
         },
         size: {
            sm: "rounded-lg px-3 py-2",
            md: "rounded-xl px-4 py-3",
         },
         block: {
            true: "w-full",
         },
      },
      defaultVariants: {
         intent: "secondary",
         size: "md",
      },
   },
)
