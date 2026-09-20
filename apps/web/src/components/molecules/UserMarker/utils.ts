/**
 * 現在地マーカーの計算ヘルパー
 */

/** ズーム0・赤道上での1ピクセルあたりのメートル数 */
const METERS_PER_PIXEL_AT_ZOOM_0 = 156543.03392

/** 精度円として描く半径の下限・上限（メートル） */
const MIN_ACCURACY_METERS = 8
const MAX_ACCURACY_METERS = 120

/** ズームに応じて半径が変わる `circle-radius` の式 */
export type AccuracyRadiusExpression = [
   "interpolate",
   ["exponential", 2],
   ["zoom"],
   number,
   number,
   number,
   number,
]

/**
 * 精度円の半径を `circle-radius` の式として組み立てる
 *
 * `circle-radius` はピクセル指定のため、そのままでは地面に固定されず
 * ズームしても大きさが変わらない。メートルからピクセルへの換算は
 * ズームが1上がるごとにちょうど2倍になるので、指数2の補間で全ズームを表現できる。
 *
 * @param latitude - 緯度（メルカトル図法の歪みの補正に使う）
 * @param accuracyMeters - 測位精度（メートル）
 */
export function createAccuracyRadiusExpression(
   latitude: number,
   accuracyMeters: number,
): AccuracyRadiusExpression {
   const meters = Math.min(
      Math.max(accuracyMeters, MIN_ACCURACY_METERS),
      MAX_ACCURACY_METERS,
   )
   const metersPerPixel =
      METERS_PER_PIXEL_AT_ZOOM_0 * Math.cos((latitude * Math.PI) / 180)
   const radiusAtZoom0 = meters / metersPerPixel

   return [
      "interpolate",
      ["exponential", 2],
      ["zoom"],
      0,
      radiusAtZoom0,
      22,
      radiusAtZoom0 * 2 ** 22,
   ]
}
