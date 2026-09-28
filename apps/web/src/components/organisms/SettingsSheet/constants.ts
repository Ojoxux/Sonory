import type { SelectOption } from "@/components/atoms/Select/types"

/** 通知範囲の選択肢 */
export const MAX_DISTANCE_OPTIONS: readonly SelectOption<number>[] = [
   { value: 500, label: "500m" },
   { value: 1000, label: "1km" },
   { value: 3000, label: "3km" },
   { value: 5000, label: "5km" },
]
