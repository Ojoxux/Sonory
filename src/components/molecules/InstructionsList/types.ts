/**
 * 確認事項リストの型定義
 *
 * @description
 * 確認事項リストのアイテムとステータスを管理
 *
 * @param items 確認事項の配列
 * @param isClosing 閉じるアニメーション中かどうか
 * @param className 追加のCSSクラス
 */
export type InstructionsListProps = {
  items: string[]
  isClosing: boolean
  className?: string
}
