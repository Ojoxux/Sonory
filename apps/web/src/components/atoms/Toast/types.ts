/**
 * Toast コンポーネントのProps
 */
export type ToastProps = {
   /** 表示するメッセージ */
   message: string
   /** 閉じるボタンクリック時のコールバック */
   onDismiss: () => void
}
