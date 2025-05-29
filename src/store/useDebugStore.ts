import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DebugState {
  /** デバッグ用時間オーバーライド（時間のみ0-23） */
  debugTimeOverride: number | null
  /** デバッグ時間を設定 */
  setDebugTimeOverride: (time: number | null) => void
}

export const useDebugStore = create<DebugState>()(
  devtools(
    (set) => ({
      debugTimeOverride: null,
      setDebugTimeOverride: (time) => set({ debugTimeOverride: time }),
    }),
    {
      name: 'debug-store',
    },
  ),
)
