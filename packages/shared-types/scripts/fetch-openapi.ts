/**
 * openapi.json を取得する。
 * ローカルサーバーが起動していれば HTTP で取得し、
 * 未起動の場合は各 API の export スクリプトにフォールバックする。
 */

import { execSync } from "node:child_process"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.join(scriptDir, "..")
const repoRoot = path.resolve(packageRoot, "../..")
const openapiDir = path.join(packageRoot, "openapi")

const HONO_OPENAPI_URL = "http://localhost:8787/api/openapi.json"
const PYTHON_OPENAPI_URL = "http://localhost:8000/openapi.json"

const OUTPUT_FILES = {
   hono: path.join(openapiDir, "hono-api.json"),
   python: path.join(openapiDir, "python-api.json"),
} as const

async function fetchJson(url: string): Promise<unknown | null> {
   try {
      const response = await fetch(url, {
         signal: AbortSignal.timeout(3_000),
      })

      if (!response.ok) {
         return null
      }

      return (await response.json()) as unknown
   } catch {
      return null
   }
}

function writeJson(filePath: string, data: unknown): void {
   fs.mkdirSync(path.dirname(filePath), { recursive: true })
   fs.writeFileSync(filePath, `${JSON.stringify(data, null, 3)}\n`)
}

function exportHonoSpec(): void {
   execSync("npm run export:openapi --workspace=@sonory/api", {
      cwd: repoRoot,
      stdio: "inherit",
   })
}

function exportPythonSpec(): void {
   execSync("python3 apps/python-audio-analyzer/scripts/export_openapi.py", {
      cwd: repoRoot,
      stdio: "inherit",
   })
}

async function syncSpec(
   name: keyof typeof OUTPUT_FILES,
   url: string,
   fallback: () => void,
): Promise<void> {
   const fetched = await fetchJson(url)

   if (fetched !== null) {
      writeJson(OUTPUT_FILES[name], fetched)
      console.log(`✅ Fetched ${name} OpenAPI spec from ${url}`)
      return
   }

   console.log(`ℹ️  ${url} unavailable — exporting ${name} spec locally`)
   fallback()
}

async function fetchOpenApiSpecs(): Promise<void> {
   await syncSpec("hono", HONO_OPENAPI_URL, exportHonoSpec)
   await syncSpec("python", PYTHON_OPENAPI_URL, exportPythonSpec)
}

await fetchOpenApiSpecs()
