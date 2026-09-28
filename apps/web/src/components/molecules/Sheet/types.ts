import type { ReactNode } from "react"

/**
 * Sheetコンポーネントのprops型定義
 */
export type SheetProps = {
   /** 開閉状態 */
   open: boolean
   /** ドラッグ・背景のタップ・Esc で閉じようとしたときのコールバック */
   onClose: () => void
   /** false のあいだはユーザー操作で閉じられない */
   dismissible?: boolean
   /** 閉じるアニメーションが終わったあとに呼ばれる */
   onExited?: () => void
   children: ReactNode
}

/**
 * SheetContentコンポーネントのprops型定義
 */
export type SheetContentProps = {
   children: ReactNode
}

/**
 * SheetHeaderコンポーネントのprops型定義
 */
export type SheetHeaderProps = {
   /** 見出し。スクリーンリーダーがシートの名前として読む */
   title: string
   /** 見出しの下の補足 */
   description?: ReactNode
   /** 見出しを画面には出さず、読み上げにだけ残す */
   titleHidden?: boolean
}

/**
 * SheetBodyコンポーネントのprops型定義
 */
export type SheetBodyProps = {
   children: ReactNode
}
