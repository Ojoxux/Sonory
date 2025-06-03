/**
 * SelectAllButtonコンポーネントのProps型定義
 */
export interface SelectAllButtonProps {
  /** 全選択状態かどうか */
  isAllSelected: boolean
  /** 全選択/全解除のハンドラー */
  onToggleAll: () => void
  /** ボタンの無効状態 */
  disabled?: boolean
  /** 追加のクラス名 */
  className?: string
}