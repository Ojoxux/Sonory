/**
 * AppInfoSheetコンポーネントのProps型定義
 */
export interface AppInfoSheetProps {
   /** シートの開閉状態 */
   isOpen: boolean
   /** 閉じるときのコールバック */
   onClose: () => void
}
