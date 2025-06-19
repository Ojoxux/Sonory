import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DebugState {
   /** デバッグモードの有効/無効 */
   debugMode: boolean
   /** デバッグモードを切り替える */
   toggleDebugMode: () => void
   /** デバッグモードを設定する */
   setDebugMode: (enabled: boolean) => void

   /** デバッグ用時間オーバーライド（時間のみ0-23） */
   debugTimeOverride: number | null
   /** デバッグ時間を設定 */
   setDebugTimeOverride: (time: number | null) => void
}

export const useDebugStore = create<DebugState>()(
   devtools(
      (set) => ({
         debugMode: false,
         toggleDebugMode: () =>
            set((state) => ({ debugMode: !state.debugMode })),
         setDebugMode: (enabled) => set({ debugMode: enabled }),

         debugTimeOverride: null,
         setDebugTimeOverride: (time) => set({ debugTimeOverride: time }),
      }),
      {
         name: 'debug-store',
      },
   ),
)
