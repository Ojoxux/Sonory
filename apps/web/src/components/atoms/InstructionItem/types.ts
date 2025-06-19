/**
 * 確認事項アイテムの型定義
 *
 * @description
 * 確認事項アイテムのテキストとインデックスを管理
 *
 * @param text 表示するテキスト
 * @param index アニメーション遅延用のインデックス
 * @param isClosing 閉じるアニメーション中かどうか
 * @param className 追加のCSSクラス
 */

export type InstructionItemProps = {
  text: string
  index: number
  isClosing: boolean
  className?: string
}
