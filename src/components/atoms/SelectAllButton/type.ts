export interface SelectAllButtonProps {
  /** 全てが選択されているかどうか */
  isAllSelected: boolean
  /** 選択状態を切り替える関数 */
  onToggle: () => void
}