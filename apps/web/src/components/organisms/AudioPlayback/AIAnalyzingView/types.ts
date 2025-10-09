/**
 * AIAnalyzingView コンポーネントのプロパティ型
 *
 * @description
 * AI分析中画面のプロパティ
 */
export type AIAnalyzingViewProps = {
   /** シートの開閉状態 */
   isOpen: boolean
   /** 分析状況を示すメッセージ */
   message: string
   /** シートを閉じるハンドラー（オプション） */
   onClose?: () => void
}
