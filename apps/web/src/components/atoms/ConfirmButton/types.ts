/**
 * 確認ボタンの型定義
 *
 * @description
 * 確認ボタンのクリックイベントとステータスを管理
 *
 * @param onClick クリックイベント
 * @param isConfirmed 確認済みかどうか
 * @param isClosing 閉じるアニメーション中かどうか
 * @param className 追加のCSSクラス
 */

export type ConfirmButtonProps = {
  onClick: () => void
  isConfirmed: boolean
  isClosing: boolean
  className?: string
}
