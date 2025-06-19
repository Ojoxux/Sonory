/**
 * fpユーティリティ
 *
 * @description
 * Option、Either、TaskEitherパターンを使用した関数群を提供
 */

import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'

// =============================================================================
// Option型ユーティリティ
// =============================================================================

/**
 * null/undefinedをOptionに変換
 */
export const fromNullable = <T>(value: T | null | undefined): O.Option<T> =>
  O.fromNullable(value)

/**
 * 複数のOptionから最初の有効な値を取得
 */
export const firstSome = <T>(...options: Array<O.Option<T>>): O.Option<T> =>
  options.reduce((acc, curr) => (O.isSome(acc) ? acc : curr), O.none)

// =============================================================================
// Either型ユーティリティ
// =============================================================================

/**
 * エラーハンドリング用のEither型
 */
export type AppError = {
  readonly type: 'ValidationError' | 'NetworkError' | 'UnknownError'
  readonly message: string
  readonly details?: unknown
}

/**
 * エラーを作成
 */
export const createError = (
  type: AppError['type'],
  message: string,
  details?: unknown,
): AppError => ({
  type,
  message,
  details,
})

/**
 * try-catchをEitherに変換
 */
export const tryCatch = <T>(fn: () => T): E.Either<AppError, T> => {
  try {
    return E.right(fn())
  } catch (error) {
    return E.left(
      createError(
        'UnknownError',
        error instanceof Error ? error.message : 'Unknown error occurred',
        error,
      ),
    )
  }
}

// =============================================================================
// TaskEither型ユーティリティ
// =============================================================================

/**
 * 非同期処理をTaskEitherに変換
 */
export const tryCatchTask = <T>(
  task: () => Promise<T>,
): TE.TaskEither<AppError, T> =>
  TE.tryCatch(task, (error) =>
    createError(
      'NetworkError',
      error instanceof Error ? error.message : 'Network error occurred',
      error,
    ),
  )

/**
 * 位置情報取得をTaskEitherで包装
 */
export const getGeolocationTE = (
  options?: PositionOptions,
): TE.TaskEither<AppError, GeolocationPosition> =>
  TE.tryCatch(
    () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          reject(new Error('Geolocation is not supported'))
          return
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      }),
    (error) =>
      createError(
        'ValidationError',
        error instanceof Error ? error.message : 'Geolocation failed',
        error,
      ),
  )

// =============================================================================
// 純粋関数ユーティリティ
// =============================================================================

/**
 * 位置情報の優先順位付き選択（純粋関数）
 */
export const selectBestPosition = (
  mapboxPos: O.Option<LocationData>,
  browserPos: O.Option<LocationData>,
  savedPos: O.Option<LocationData>,
): O.Option<LocationData> =>
  pipe(
    firstSome(mapboxPos, browserPos, savedPos),
    O.filter((pos) => pos.accuracy < 1000), // 精度1km以内のみ有効
  )

/**
 * 位置情報の有効性チェック（純粋関数）
 */
export const isValidPosition = (position: LocationData): boolean =>
  pipe(
    position,
    (pos) =>
      pos.latitude >= -90 &&
      pos.latitude <= 90 &&
      pos.longitude >= -180 &&
      pos.longitude <= 180 &&
      pos.accuracy > 0 &&
      Date.now() - pos.timestamp < 24 * 60 * 60 * 1000, // 24時間以内
  )

/**
 * 座標の距離計算（純粋関数）
 */
export const calculateDistance = (
  pos1: LocationData,
  pos2: LocationData,
): number => {
  const R = 6371e3 // 地球の半径（メートル）
  const φ1 = (pos1.latitude * Math.PI) / 180
  const φ2 = (pos2.latitude * Math.PI) / 180
  const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180
  const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// =============================================================================
// 型定義
// =============================================================================

export type LocationData = {
  readonly latitude: number
  readonly longitude: number
  readonly accuracy: number
  readonly timestamp: number
}
