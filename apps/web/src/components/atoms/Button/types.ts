import type { VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"
import type { buttonVariants } from "./utils"

/**
 * Buttonコンポーネントのprops型定義
 */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
   VariantProps<typeof buttonVariants>
