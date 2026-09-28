import type { RippleColor, RippleSize } from "./types"

export const RIPPLE_BORDER_COLORS: Record<RippleColor, string> = {
   blue: "border-accent-400",
   white: "border-white",
   green: "border-done-400",
   red: "border-record-400",
}

export const RIPPLE_SIZE_SCALE: Record<RippleSize, number> = {
   small: 0.7,
   medium: 1,
   large: 1.3,
}

/** 内側ほど濃く短く。すべて 400ms 以内に消える */
export const RIPPLE_RINGS = [
   { scale: 3, opacity: 0.8, duration: 0.3, delay: 0 },
   { scale: 6, opacity: 0.5, duration: 0.35, delay: 0.03 },
   { scale: 10, opacity: 0.3, duration: 0.35, delay: 0.06 },
] as const
