/**
 * OpenAPI Spec から TypeScript 型定義 (.d.ts) を生成する。
 */

import { execSync } from "node:child_process"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.join(scriptDir, "..")
const openapiDir = path.join(packageRoot, "openapi")
const generatedDir = path.join(packageRoot, "src", "generated")

const SPECS = [
   {
      input: path.join(openapiDir, "hono-api.json"),
      output: path.join(generatedDir, "hono-api.d.ts"),
      label: "Hono API",
   },
   {
      input: path.join(openapiDir, "python-api.json"),
      output: path.join(generatedDir, "python-api.d.ts"),
      label: "Python API",
   },
] as const

function generateTypes(): void {
   fs.mkdirSync(generatedDir, { recursive: true })

   for (const spec of SPECS) {
      if (!fs.existsSync(spec.input)) {
         throw new Error(
            `Missing OpenAPI spec for ${spec.label}: ${spec.input}. Run "npm run fetch:openapi" first.`,
         )
      }

      execSync(`npx openapi-typescript "${spec.input}" -o "${spec.output}"`, {
         cwd: packageRoot,
         stdio: "inherit",
      })

      console.log(`✅ Generated types for ${spec.label}: ${spec.output}`)
   }
}

generateTypes()
