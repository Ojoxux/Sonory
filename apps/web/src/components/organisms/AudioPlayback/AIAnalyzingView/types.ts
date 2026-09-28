/**
 * AIAnalyzingView コンポーネントのProps型
 *
 * @description
 * AI分析中画面のProps
 * AI分析中は閉じる操作を無効化しているため、onCloseは不要
 */
export type AIAnalyzingViewProps = {
   /** 分析状況を示すメッセージ */
   message: string
}
