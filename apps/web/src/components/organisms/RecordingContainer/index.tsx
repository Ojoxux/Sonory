"use client"

import { clsx } from "clsx"
import {
   animate,
   motion,
   type PanInfo,
   useDragControls,
   useMotionValue,
} from "motion/react"
import {
   useCallback,
   useEffect,
   useLayoutEffect,
   useRef,
   useState,
} from "react"
import {
   COLLAPSED_VISIBLE_HEIGHT,
   SHEET_EXIT_TRANSITION,
   SNAP_SPRING,
   SNAP_VELOCITY,
} from "./constants"
import type { RecordingContainerProps } from "./types"

/**
 * 録音コンテナコンポーネント
 *
 * @description
 * 録音中のUIを載せるボトムシート。収納と展開の2段にスナップする。
 * シートは常に展開時の高さで、収納時は下にずらして上端だけを見せる（高さは動かさない）。
 * 背後の地図を触れるよう非モーダルで、録音中は閉じられない
 *
 * @param children 子要素
 * @param isExpanded 展開されているかどうか
 * @param onExpandedChange ドラッグやハンドルで展開状態が変わったときのコールバック
 */
export function RecordingContainer({
   children,
   isExpanded,
   onExpandedChange,
}: RecordingContainerProps) {
   const sheetRef = useRef<HTMLElement>(null)
   const pressedAtY = useRef(0)
   const targetY = useRef<number | null>(null)
   const dragControls = useDragControls()
   const [sheetHeight, setSheetHeight] = useState(0)
   // 寸法を測るまでは画面外に置いておく
   const y = useMotionValue(
      typeof window === "undefined" ? 0 : window.innerHeight,
   )

   const collapsedY = Math.max(sheetHeight - COLLAPSED_VISIBLE_HEIGHT, 0)

   useLayoutEffect(() => {
      const measure = () => {
         setSheetHeight(sheetRef.current?.offsetHeight ?? 0)
      }
      measure()
      window.addEventListener("resize", measure)
      return () => window.removeEventListener("resize", measure)
   }, [])

   const settle = useCallback(
      (target: number, velocity?: number) => {
         if (velocity === undefined && targetY.current === target) return
         targetY.current = target
         animate(
            y,
            target,
            velocity === undefined ? SNAP_SPRING : { ...SNAP_SPRING, velocity },
         )
      },
      [y],
   )

   useEffect(() => {
      if (sheetHeight === 0) return
      settle(isExpanded ? 0 : collapsedY)
   }, [isExpanded, collapsedY, sheetHeight, settle])

   const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
   ) => {
      const velocity = info.velocity.y / 1000
      const shouldExpand =
         Math.abs(velocity) > SNAP_VELOCITY
            ? velocity < 0
            : y.get() < collapsedY / 2

      settle(shouldExpand ? 0 : collapsedY, info.velocity.y)
      if (shouldExpand !== isExpanded) onExpandedChange(shouldExpand)
   }

   return (
      <motion.section
         ref={sheetRef}
         aria-label="録音中"
         drag="y"
         dragListener={false}
         dragControls={dragControls}
         dragConstraints={{ top: 0, bottom: collapsedY }}
         dragElastic={0.1}
         dragMomentum={false}
         onDragEnd={handleDragEnd}
         onPointerDown={(e) => {
            // ボタンの上から引くと離したときに click が走るので、ハンドル以外のボタンでは掴ませない
            if (
               e.target instanceof Element &&
               e.target.closest("button:not([data-sheet-handle])")
            ) {
               return
            }
            dragControls.start(e)
         }}
         exit={{ y: sheetHeight, transition: SHEET_EXIT_TRANSITION }}
         style={{ y }}
         className={clsx(
            "glass pointer-events-auto fixed inset-x-0 bottom-0 flex h-19/20 touch-none flex-col rounded-t-3xl border-t text-white shadow-2xl sm:rounded-t-4xl",
            isExpanded ? "z-panel" : "z-chrome",
         )}
      >
         <button
            type="button"
            data-sheet-handle
            onPointerDown={(e) => {
               pressedAtY.current = e.clientY
            }}
            onClick={(e) => {
               // ハンドルを掴んで引いた後の click で畳み直さない。キーボード由来（detail が 0）は対象外
               const moved = Math.abs(e.clientY - pressedAtY.current)
               if (e.detail !== 0 && moved > 6) return
               onExpandedChange(!isExpanded)
            }}
            className="flex w-full shrink-0 cursor-grab touch-manipulation justify-center py-3 active:cursor-grabbing"
            aria-label={isExpanded ? "収縮" : "展開"}
            aria-expanded={isExpanded}
         >
            <span className="h-1 w-10 rounded-full bg-white/30" />
         </button>

         {children}
      </motion.section>
   )
}
