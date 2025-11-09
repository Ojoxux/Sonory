/**
 * ピン作成ステータスの型定義
 */
export type PinCreationStatus = "idle" | "creating" | "success" | "error"

/**
 * ActionButtons コンポーネントのプロパティ
 */
export type ActionButtonsProps = {
   /** 分析結果が存在するか */
   hasResults: boolean
   /** ピン作成ステータス */
   pinCreationStatus: PinCreationStatus
   /** 現在位置が存在するか */
   hasPosition: boolean
   /** ピン配置ボタンのクリックハンドラー */
   onPlacePin: () => void
   /** 閉じるボタンのクリックハンドラー */
   onClose: () => void
}
