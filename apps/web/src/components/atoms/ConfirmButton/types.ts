/**
 * 確認ボタンの型定義
 *
 * @param onClick クリックイベント
 * @param isConfirmed 確認済みかどうか
 * @param isDisabled 押せない状態かどうか（マイク未許可など）
 * @param className 追加のCSSクラス
 */
export type ConfirmButtonProps = {
   onClick: () => void
   isConfirmed: boolean
   isDisabled?: boolean
   className?: string
}
