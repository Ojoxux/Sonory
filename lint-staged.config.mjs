const packageTasks = (directory, lintScript, formatScript) => [
   `npm --prefix ${directory} run ${lintScript}`,
   `npm --prefix ${directory} run ${formatScript}`,
   `npm --prefix ${directory} exec -- tsc --noEmit --project ${directory}/tsconfig.json`,
]

export default {
   "apps/web/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("apps/web", "lint:biome:fix", "format:fix"),
   "apps/api/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("apps/api", "lint:fix", "format:fix"),
   "packages/shared-types/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("packages/shared-types", "lint", "format"),
   "packages/utils/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("packages/utils", "lint", "format"),
   "packages/python-types/**/*.{js,jsx,ts,tsx}": () =>
      packageTasks("packages/python-types", "lint", "format"),
   "packages/config/**/*.{js,jsx,ts,tsx}": () => [
      "npx biome check --fix --unsafe packages/config",
      "npx biome format packages/config --write --unsafe",
   ],
}
