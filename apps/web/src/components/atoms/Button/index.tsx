import type { ReactElement } from "react"
import type { ButtonProps } from "./types"
import { buttonVariants } from "./utils"

/**
 * テキストボタン
 *
 * @param intent 役割。`accent` は主要な操作、`done` は確定、`secondary` はそれ以外
 * @param size `md`（既定）か `sm`
 * @param block 横幅いっぱいに広げる
 *
 * @example
 * ```tsx
 * <Button intent="accent" block onClick={onContinue}>続ける</Button>
 * ```
 */
export function Button({
   intent,
   size,
   block,
   className,
   type = "button",
   ...props
}: ButtonProps): ReactElement {
   return (
      <button
         type={type}
         className={buttonVariants({ intent, size, block, className })}
         {...props}
      />
   )
}
