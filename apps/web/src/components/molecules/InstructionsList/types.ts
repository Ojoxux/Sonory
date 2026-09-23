/**
 * 確認事項リストの型定義
 *
 * @param items 確認事項の配列
 * @param startStep 何番目から順に出すか
 * @param className 追加のCSSクラス
 */
export type InstructionsListProps = {
   items: string[]
   startStep?: number
   className?: string
}
