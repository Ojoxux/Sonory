/**
 * 環境情報の型定義
 */
export type Environment = {
   /** 環境の説明 */
   description?: string
   /** 環境の主要タイプ */
   primary_type?: string
}

/**
 * EnvironmentInfo コンポーネントのプロパティ
 */
export type EnvironmentInfoProps = {
   /** 環境情報 */
   environment?: Environment | null
}
