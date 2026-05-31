/**
 * OpenAPI仕様書をHonoアプリから抽出し、JSONファイルとして出力するスクリプト
 *
 * @usage npx tsx scripts/extract-openapi.ts
 */
import { writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { app } from "../src/index"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const OUTPUT_PATH = resolve(
   __dirname,
   "../../../packages/shared-types/openapi.json",
)

const dummyEnv = {
   ENVIRONMENT: "development" as const,
   CORS_ORIGIN: "http://localhost:3000",
   SUPABASE_URL: "http://localhost:54321",
   SUPABASE_ANON_KEY: "dummy",
   PYTHON_AUDIO_ANALYZER_URL: "http://localhost:8000",
   PYTHON_AUDIO_ANALYZER_TIMEOUT: "30000",
}

async function main(): Promise<void> {
   const res = await app.request("/api/openapi.json", {}, dummyEnv)

   if (!res.ok) {
      const text = await res.text()
      console.error(`Failed to fetch OpenAPI spec: ${res.status}`, text)
      process.exit(1)
   }

   const spec = await res.json()
   const json = JSON.stringify(spec, null, 2)

   writeFileSync(OUTPUT_PATH, `${json}\n`)
   console.log(`OpenAPI spec written to ${OUTPUT_PATH}`)
}

main().catch((err) => {
   console.error(err)
   process.exit(1)
})
