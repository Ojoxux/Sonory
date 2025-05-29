/**
 * RecordingInterfaceコンポーネントのプロパティ型定義
 */
export interface RecordingInterfaceProps {
  /**
   * 追加のCSSクラス名
   * @default ''
   */
  className?: string

  /**
   * 展開状態が変更されたときのコールバック
   * @param isExpanded - 展開されているかどうか
   */
  onExpandedChange?: (isExpanded: boolean) => void
}
