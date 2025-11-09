import { useCallback, useState } from "react"

/**
 * アコーディオンの開閉状態を管理するカスタムフック
 *
 * @returns アコーディオンの状態と操作関数
 */
export function useAccordionToggle() {
   const [isOpen, setIsOpen] = useState<boolean>(false)

   const toggle = useCallback(() => {
      setIsOpen((prev) => !prev)
   }, [])

   return {
      isOpen,
      toggle,
   }
}
