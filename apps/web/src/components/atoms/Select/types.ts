/**
 * Select の選択肢
 */
export type SelectOption<Value> = {
   readonly value: Value
   readonly label: string
}

/**
 * Selectコンポーネントのprops型定義
 */
export type SelectProps<Value> = {
   /** 選択中の値 */
   value: Value
   /** 選択が変わったときのコールバック */
   onValueChange: (value: Value) => void
   /** 選択肢 */
   options: readonly SelectOption<Value>[]
   /** 読み上げ用のラベル。見出しは呼び出し側で並べる */
   label: string
   /** 無効化するかどうか */
   disabled?: boolean
   /** トリガーに付ける追加のCSSクラス */
   className?: string
}
