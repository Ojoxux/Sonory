/** 音量を取る間隔。10秒なら200区間になる */
export const SLOT_MS = 50

/** バーの幅と間隔 */
export const BAR_WIDTH = 4
export const BAR_GAP = 2

/** まだ録音していない位置のバーの濃さ */
export const IDLE_BAR_ALPHA = 0.2

/** この音量を 0、上限を 1 にする。環境音は小さいので下は広めに取る */
export const MIN_DB = -60
export const MAX_DB = -10
