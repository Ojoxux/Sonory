import type { DebugInfoProps } from "./types"

/**
 * デバッグ情報コンポーネント
 *
 * @description
 * 開発環境でのみ表示される音声ピンのデバッグ情報を表示します。
 * Pin ID、Primary Label、Environment、Classification Results などを確認できます。
 *
 * @param pin - 表示するピンのデータ
 *
 * @example
 * ```tsx
 * <DebugInfo pin={pin} />
 * ```
 */
export function DebugInfo({ pin }: DebugInfoProps) {
   // MEMO: 本番環境では表示する必要がないので、何も返さない
   if (process.env.NODE_ENV === "production") return null

   return (
      <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/20 p-3 text-xs">
         <div className="mb-2 font-medium text-purple-300">デバッグ情報:</div>
         <div className="space-y-1 text-purple-200">
            <div>Pin ID: {pin.id}</div>
            <div>Primary Label: {pin.primaryLabel}</div>
            <div>Environment: {pin.environment}</div>
            <div>
               Classification Results Count:{" "}
               <span
                  className={`font-semibold ${
                     pin.classificationResults.length > 1
                        ? "text-green-300"
                        : "text-yellow-300"
                  }`}
               >
                  {pin.classificationResults.length}件
               </span>
               {pin.classificationResults.length > 1
                  ? " (複数の結果あり)"
                  : " (単一結果)"}
            </div>
            <div>
               Classification Results:{" "}
               {JSON.stringify(pin.classificationResults, null, 2)}
            </div>
         </div>
      </div>
   )
}
