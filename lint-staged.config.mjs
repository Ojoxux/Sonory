/**
 * lint-staged v16対応設定
 *
 * v16ではコマンドがシェルなしで実行されるため、
 * シェルのビルトインや演算子に依存するパターンは使用不可。
 * `npm --prefix` と `tsc --project` でワークスペースを明示する。
 */

const packageTasks = (directory, lintScript, formatScript) => [
   `npm --prefix ${directory} run ${lintScript}`,
   `npm --prefix ${directory} run ${formatScript}`,
   `npm --prefix ${directory} exec -- tsc --noEmit --project ${directory}/tsconfig.json`,
]

export default {
   "apps/web/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("apps/web", "lint:fix", "format:fix"),
   "apps/api/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("apps/api", "lint:fix", "format:fix"),
   "packages/shared-types/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("packages/shared-types", "lint:fix", "format:fix"),
   "packages/utils/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("packages/utils", "lint:fix", "format:fix"),
   "packages/python-types/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("packages/python-types", "lint:fix", "format:fix"),
   "packages/config/**/*.{js,jsx,ts,tsx}": () => [
      "oxlint packages/config --fix",
      "oxfmt packages/config --no-error-on-unmatched-pattern",
   ],
}
