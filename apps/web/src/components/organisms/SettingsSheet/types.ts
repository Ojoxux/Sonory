/**
 * SettingsSheetコンポーネントのProps型定義
 */
export interface SettingsSheetProps {
   /** シートの開閉状態 */
   isOpen: boolean
   /** 閉じるときのコールバック */
   onClose: () => void
}
