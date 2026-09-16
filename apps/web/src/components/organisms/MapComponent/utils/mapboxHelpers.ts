/**
 * Mapboxヘルパー関数
 */

import type {
   MapboxExtendedMap,
   MapboxNonStandardMethods,
} from "../mapbox.types"
import { supportsMethod } from "./mapboxSupport"

/**
 * Mapboxメソッドの実行を安全に実行する共通ヘルパー
 */
function safelyExecuteMapboxMethod<T extends keyof MapboxExtendedMap>(
   map: MapboxExtendedMap,
   methodName: T,
   methodCall: (extendedMap: MapboxExtendedMap) => void,
): void {
   const isSupported = supportsMethod(map, methodName)
   if (!isSupported || !map.isStyleLoaded()) {
      return
   }

   try {
      methodCall(map)
   } catch (error) {
      if (process.env.NODE_ENV === "development") {
         console.warn(`${methodName}実行エラー:`, error)
      }
   }
}

/**
 * Mapboxの非標準メソッドを安全に呼び出すヘルパー関数群を作成
 * @returns Mapboxヘルパーメソッド群
 */
export const createMapboxHelpers = (): MapboxNonStandardMethods => ({
   setConfigProperty: (map, namespace, property, value) => {
      safelyExecuteMapboxMethod(
         map as MapboxExtendedMap,
         "setConfigProperty",
         (extendedMap) => {
            if (extendedMap.setConfigProperty) {
               extendedMap.setConfigProperty(namespace, property, value)
            }
         },
      )
   },

   setTerrain: (map, config) => {
      safelyExecuteMapboxMethod(
         map as MapboxExtendedMap,
         "setTerrain",
         (extendedMap) => {
            if (extendedMap.setTerrain) {
               extendedMap.setTerrain(config)
            }
         },
      )
   },

   setLight: (map, config) => {
      safelyExecuteMapboxMethod(
         map as MapboxExtendedMap,
         "setLight",
         (extendedMap) => {
            if (extendedMap.setLight) {
               extendedMap.setLight(config)
            }
         },
      )
   },

   setFog: (map, config) => {
      safelyExecuteMapboxMethod(
         map as MapboxExtendedMap,
         "setFog",
         (extendedMap) => {
            if (extendedMap.setFog) {
               extendedMap.setFog(config)
            }
         },
      )
   },
})

/**
 * Mapboxヘルパーのシングルトンインスタンス
 */
export const mapboxHelpers = createMapboxHelpers()
