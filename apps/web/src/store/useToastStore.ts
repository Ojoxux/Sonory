import { create } from "zustand"

/** トースト1件分のデータ */
export interface ToastItem {
   id: string
   message: string
}

const TOAST_DURATION_MS = 6000

interface ToastState {
   toasts: ToastItem[]
   addToast: (message: string) => void
   removeToast: (id: string) => void
}

/**
 * 画面全体に表示するエラートーストを管理するZustandストア
 *
 * @description
 * 録音開始失敗やアップロード失敗など、フック内のcatchブロックから
 * コンポーネントを経由せず直接通知するために使う
 */
export const useToastStore = create<ToastState>((set, get) => ({
   toasts: [],

   addToast: (message) => {
      const id = crypto.randomUUID()
      set((state) => ({ toasts: [...state.toasts, { id, message }] }))
      setTimeout(() => get().removeToast(id), TOAST_DURATION_MS)
   },

   removeToast: (id) => {
      set((state) => ({
         toasts: state.toasts.filter((toast) => toast.id !== id),
      }))
   },
}))

/**
 * コンポーネント外（フックのcatchブロックなど）からエラートーストを表示する
 *
 * @param message 表示するエラーメッセージ
 */
export function showErrorToast(message: string): void {
   useToastStore.getState().addToast(message)
}
