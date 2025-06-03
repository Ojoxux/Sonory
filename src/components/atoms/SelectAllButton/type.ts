/**
 * SelectAllButtonコンポーネントの型定義
 */
export interface SelectAllButtonProps {
  /**
   * 全てのアイテムがチェックされているかどうか
   */
  isAllChecked: boolean

  /**
   * 全選択/全解除のコールバック関数
   */
  onSelectAll: () => void
}