/**
 * スライドして開始するコンポーネントの型定義
 *
 * @description
 * スライドして開始するコンポーネントのプロパティを管理
 *
 * @param onComplete スライド完了時のコールバック
 * @param disabled 無効状態
 * @param text 表示テキスト
 * @param className 追加のCSSクラス
 */
export type SlideToStartProps = {
   onComplete: () => void

   disabled?: boolean

   text?: string

   className?: string
}
