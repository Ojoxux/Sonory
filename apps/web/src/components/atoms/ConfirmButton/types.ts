/**
 * 確認ボタンの型定義
 *
 * @description
 * 確認ボタンのクリックイベントとステータスを管理
 *
 * @param onClick クリックイベント
 * @param isConfirmed 確認済みかどうか
 * @param isDisabled 押せない状態かどうか（マイク未許可など）
 * @param isClosing 閉じるアニメーション中かどうか
 * @param className 追加のCSSクラス
 */

export type ConfirmButtonProps = {
   onClick: () => void
   isConfirmed: boolean
   isDisabled?: boolean
   isClosing: boolean
   className?: string
}
