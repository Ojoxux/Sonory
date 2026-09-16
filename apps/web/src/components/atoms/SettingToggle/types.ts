/**
 * SettingToggleコンポーネントのProps型定義
 */
export type SettingToggleProps = {
   /** トグルの現在の状態 */
   checked: boolean
   /** 切り替え時のコールバック */
   onChange: () => void
   /** トグルのラベル */
   label: string
   /** ラベル下に表示する補足文言 */
   description?: string
   /** 無効化するかどうか */
   disabled?: boolean
   /** 追加のCSSクラス */
   className?: string
}
