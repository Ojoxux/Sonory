/**
 * OpenAPI Spec と生成型が最新かを検証する（CI 用）。
 *
 * Hono API はコードから再エクスポートして整合性を確認する。
 * Python API はコミット済み openapi/python-api.json を基準とし、
 * 変更時はローカルで `npm run fetch:openapi` を実行する。
 */

import { execSync } from "node:child_process"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.join(scriptDir, "..")
const repoRoot = path.resolve(packageRoot, "../..")

function runCheckGenerated(): void {
   execSync("npm run export:openapi --workspace=@sonory/api", {
      cwd: repoRoot,
      stdio: "inherit",
   })

   execSync("npm run generate:types", {
      cwd: packageRoot,
      stdio: "inherit",
   })

   execSync("git diff --exit-code -- openapi/hono-api.json src/generated/", {
      cwd: packageRoot,
      stdio: "inherit",
   })

   console.log("✅ Generated OpenAPI types are up to date")
}

runCheckGenerated()
