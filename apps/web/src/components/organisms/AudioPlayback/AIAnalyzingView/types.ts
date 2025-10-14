/**
 * AIAnalyzingView コンポーネントのプロパティ型
 *
 * @description
 * AI分析中画面のプロパティ
 * AI分析中は閉じる操作を無効化しているため、onCloseは不要
 */
export type AIAnalyzingViewProps = {
   /** シートの開閉状態 */
   isOpen: boolean
   /** 分析状況を示すメッセージ */
   message: string
}
