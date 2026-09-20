/**
 * 現在地を描くレイヤーの定義
 */

import type { CircleLayerSpecification } from "mapbox-gl"

export const USER_LOCATION_SOURCE_ID = "user-location"
export const USER_LOCATION_ACCURACY_LAYER_ID = "user-location-accuracy"

const LOCATION_COLOR = "#3b82f6"
const RING_COLOR = "#ffffff"
const SHADOW_COLOR = "#0f172a"

/**
 * 精度円・影・ドットの3枚。描画順は配列の順。
 *
 * `circle-pitch-alignment: "map"` で地面に伏せて描くため、地図を傾けると楕円になる。
 * ドットと影は `circle-pitch-scale: "viewport"` を併用し、遠近で大きさが変わらないようにする。
 */
export const USER_LOCATION_LAYERS: CircleLayerSpecification[] = [
   {
      id: USER_LOCATION_ACCURACY_LAYER_ID,
      type: "circle",
      source: USER_LOCATION_SOURCE_ID,
      slot: "top",
      paint: {
         "circle-pitch-alignment": "map",
         "circle-color": LOCATION_COLOR,
         "circle-opacity": 0.15,
         "circle-stroke-color": LOCATION_COLOR,
         "circle-stroke-opacity": 0.35,
         "circle-stroke-width": 1,
         // 実際の半径は測位精度から算出して差し替える
         "circle-radius": 0,
      },
   },
   {
      id: "user-location-shadow",
      type: "circle",
      source: USER_LOCATION_SOURCE_ID,
      slot: "top",
      paint: {
         "circle-pitch-alignment": "map",
         "circle-pitch-scale": "viewport",
         "circle-color": SHADOW_COLOR,
         "circle-opacity": 0.25,
         "circle-blur": 0.6,
         "circle-radius": 14,
         "circle-translate": [0, 2],
         "circle-translate-anchor": "viewport",
      },
   },
   {
      id: "user-location-dot",
      type: "circle",
      source: USER_LOCATION_SOURCE_ID,
      slot: "top",
      paint: {
         "circle-pitch-alignment": "map",
         "circle-pitch-scale": "viewport",
         "circle-color": LOCATION_COLOR,
         "circle-radius": 10,
         "circle-stroke-color": RING_COLOR,
         "circle-stroke-width": 4,
      },
   },
]
