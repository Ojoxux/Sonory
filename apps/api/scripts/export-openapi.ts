/**
 * Hono API の OpenAPI Spec を packages/shared-types/openapi/ に書き出す。
 *
 * @example
 * ```bash
 * cd apps/api && npm run export:openapi
 * ```
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { app } from "../src/app.js"
import { openApiDocumentConfig } from "../src/openapi-config.js"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(
   scriptDir,
   "../../../packages/shared-types/openapi/hono-api.json",
)

function exportOpenApiSpec(): void {
   const document = app.getOpenAPIDocument(openApiDocumentConfig)
   fs.mkdirSync(path.dirname(outputPath), { recursive: true })
   fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 3)}\n`)
   console.log(`✅ Hono OpenAPI spec exported: ${outputPath}`)
}

exportOpenApiSpec()
