'use client'

import { animate, motion, useMotionValue } from 'framer-motion'
import { useRef } from 'react'
import type { CompassIconProps } from './type'

/**
 * 最短経路での回転角度を計算する
 *
 * @param targetRotation 目標回転角度
 * @param currentRotation 現在の回転角度
 * @returns 最短経路での新しい回転角度
 */
function calculateShortestRotation(
  targetRotation: number,
  currentRotation: number,
): number {
  // 角度の差分を計算（-180°～180°の範囲に正規化）
  let diff = ((targetRotation - currentRotation + 180) % 360) - 180
  if (diff < -180) diff += 360

  // 最短経路での新しい角度
  return currentRotation + diff
}

/**
 * アニメーションを開始すべきかを判定する
 *
 * @param angleDiff 角度の差分
 * @param threshold 閾値
 * @param newRotation 新しい回転角度
 * @param currentTarget 現在のアニメーションターゲット
 * @returns アニメーションを開始すべきかどうか
 */
function shouldStartAnimation(
  angleDiff: number,
  threshold: number,
  newRotation: number,
  currentTarget: number | null,
): boolean {
  // 角度の変化量が閾値より大きく、かつ現在のターゲットと異なる場合
  return Math.abs(angleDiff) > threshold && currentTarget !== newRotation
}

/**
 * 回転アニメーションを管理する
 *
 * @param rotation モーションバリュー
 * @param newRotation 新しい回転角度
 * @param angleDiff 角度の差分
 * @param threshold 閾値
 * @param targetRotationRef ターゲット角度の参照
 */
function handleRotationAnimation(
  rotation: ReturnType<typeof useMotionValue<number>>,
  newRotation: number,
  angleDiff: number,
  threshold: number,
  targetRotationRef: React.MutableRefObject<number | null>,
): void {
  if (Math.abs(angleDiff) > threshold) {
    // 現在アニメーション中のターゲットと異なる場合のみ新しいアニメーションを開始
    // これにより冪等性を確保し、同じターゲットへの連続アニメーション実行を防ぐ
    if (
      shouldStartAnimation(
        angleDiff,
        threshold,
        newRotation,
        targetRotationRef.current,
      )
    ) {
      // アニメーションで滑らかに回転
      animate(rotation, newRotation, {
        duration: 0.3,
        ease: 'easeOut',
        // アニメーション完了時にターゲット参照をクリア
        onComplete: () => {
          targetRotationRef.current = null
        },
      })
      // 現在のアニメーションターゲットを保存
      targetRotationRef.current = newRotation
    }
  } else {
    // 閾値以下の微小な変化の場合は、アニメーションなしで直接値を設定
    rotation.set(newRotation)
    // ターゲット参照をクリア（アニメーションなし）
    targetRotationRef.current = null
  }
}

/**
 * コンパスアイコンコンポーネント
 *
 * @description
 * 北を指すコンパスアイコンを表示するAtomコンポーネント
 * マップのbearing（回転角度）に基づいて常に北を指すように回転
 *
 * @param className 追加のCSSクラス
 * @param size アイコンのサイズ（デフォルト: 20）
 * @param mapBearing マップのbearing（回転角度）
 *
 * @example
 * ```tsx
 * <CompassIcon className="text-white" size={24} mapBearing={45} />
 * ```
 */
export function CompassIcon({
  className = '',
  size = 20,
  mapBearing = 0,
}: CompassIconProps) {
  // 回転角度を管理するmotionValue
  const rotation = useMotionValue(0)
  // 前回の角度を保持するためのref
  const prevBearingRef = useRef(mapBearing)
  // 現在アニメーション中のターゲット角度を保持するref
  const targetRotationRef = useRef<number | null>(null)
  // 角度変化の閾値（この値以下の変化は無視する）
  const ROTATION_THRESHOLD = 0.5

  // 最短経路で回転するための処理
  // ベアリングは浮動小数点なので、45.00001 → 45.00002 のような無視してよい変化でもアニメーションが発火してしまう。
  // ベアリングが細かく連続的に更新される環境（MapboxGLなど）だと、パフォーマンス上も視覚的にも無駄。
  // ↓
  // 前回の角度と比較して、閾値以上の変化がある場合のみアニメーションを実行
  if (Math.abs(prevBearingRef.current - mapBearing) > ROTATION_THRESHOLD) {
    // 新しい目標角度（マップの回転に対して逆方向）
    const targetRotation = -mapBearing
    // 現在の回転値を取得
    const currentRotation = rotation.get()

    // 最短経路での新しい角度を計算
    const newRotation = calculateShortestRotation(
      targetRotation,
      currentRotation,
    )
    // 角度の差分
    const angleDiff = newRotation - currentRotation

    // アニメーション実行の管理
    handleRotationAnimation(
      rotation,
      newRotation,
      angleDiff,
      ROTATION_THRESHOLD,
      targetRotationRef,
    )

    // 前回の角度を更新
    prevBearingRef.current = mapBearing
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ rotate: rotation }}
    >
      {/* コンパスの外枠 */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* 北を指す針（赤色） */}
      <path d="M12 4 L10 8 L12 7 L14 8 Z" fill="#FF3B30" />

      {/* 南を指す針（白色/透明） */}
      <path
        d="M12 20 L10 16 L12 17 L14 16 Z"
        fill="currentColor"
        opacity="0.3"
      />

      {/* 中心点 */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.8" />
    </motion.svg>
  )
}
