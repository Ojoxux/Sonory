/**
 * SonicLoaderコンポーネントのプロパティ型定義
 */
export interface SonicLoaderProps {
   /** ローディング中かどうか */
   isLoading?: boolean
   /** 表示テキスト */
   text?: string
   /** 追加のCSSクラス */
   className?: string
}
