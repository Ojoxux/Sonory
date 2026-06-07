/**
 * Generate Python Pydantic models from TypeScript shared types
 */

import * as fs from "node:fs"
import * as path from "node:path"

const TYPE_MAPPINGS: Record<string, string> = {
   string: "str",
   number: "float",
   boolean: "bool",
   Date: "datetime",
   unknown: "Any",
   any: "Any",
   dict: "dict[str, Any]",
   null: "None",
   undefined: "None",
   AudioFormat: "str",
   Record: "dict[str, Any]",
}

const REQUIRED_PYTHON_TYPES = [
   "LocationCoordinates",
   "WeatherData",
   "AudioMetadata",
   "AIAnalysis",
   "SoundPinAudio",
   "SoundPinAPI",
] as const

interface TypeDefinition {
   name: string
   properties: Property[]
}

interface Property {
   name: string
   type: string
   optional: boolean
   description: string | undefined
}

interface GenerateResult {
   generated: string[]
   missing: string[]
   outputFile: string
}

const ZOD_SCHEMA_NAME_BY_TYPE: Partial<Record<string, string>> = {
   AIAnalysis: "AiAnalysis",
   SoundPinAPI: "SoundPinApi",
}

function convertType(tsType: string): string {
   const normalizedType = tsType.trim().replace(/[,;]$/, "")

   if (normalizedType.startsWith("{")) {
      return "dict[str, Any]"
   }

   const recordMatch = normalizedType.match(/^Record<\s*string\s*,\s*(.+)>$/)
   if (recordMatch?.[1]) {
      return `dict[str, ${convertType(recordMatch[1])}]`
   }

   if (normalizedType.startsWith("Array<") && normalizedType.endsWith(">")) {
      const baseType = normalizedType.slice("Array<".length, -1)
      return `list[${convertType(baseType)}]`
   }

   if (normalizedType.endsWith("[]")) {
      const baseType = normalizedType.slice(0, -2)
      return `list[${convertType(baseType)}]`
   }

   if (normalizedType.includes(" | ")) {
      const types = normalizedType.split(" | ").map((t) => t.trim())
      if (types.includes("null") || types.includes("undefined")) {
         const nonNullTypes = types.filter(
            (t) => t !== "null" && t !== "undefined",
         )
         if (nonNullTypes.length === 1 && nonNullTypes[0]) {
            return `Optional[${convertType(nonNullTypes[0])}]`
         }
      }

      if (types.every((type) => /^".*"$/.test(type))) {
         return `Literal[${types.join(", ")}]`
      }

      return `Union[${types.map(convertType).join(", ")}]`
   }

   if (/^".*"$/.test(normalizedType)) {
      return `Literal[${normalizedType}]`
   }

   return TYPE_MAPPINGS[normalizedType] || normalizedType
}

function generatePydanticModel(typeDef: TypeDefinition): {
   imports: string[]
   code: string
} {
   const className = typeDef.name
   const imports = new Set<string>(["BaseModel"])

   let code = `class ${className}(BaseModel):
    """
    ${className} model for Sonory API.

    Generated from TypeScript shared types.
    """
`

   for (const prop of typeDef.properties) {
      const pythonType = convertType(prop.type)

      if (pythonType.includes("Optional")) {
         imports.add("Optional")
      }
      if (pythonType.includes("Union")) {
         imports.add("Union")
      }
      if (pythonType.includes("datetime")) {
         imports.add("datetime")
      }
      if (pythonType.includes("Any")) {
         imports.add("Any")
      }

      const fieldType = prop.optional
         ? `Optional[${pythonType}] = None`
         : pythonType
      const description = prop.description ? ` # ${prop.description}` : ""

      code += `    ${prop.name}: ${fieldType}${description}\n`
   }

   return {
      imports: Array.from(imports),
      code,
   }
}

function extractBalancedBlock(
   content: string,
   openBraceIndex: number,
): string | null {
   let depth = 0
   for (let i = openBraceIndex; i < content.length; i++) {
      const char = content[i]
      if (char === "{") {
         depth++
      } else if (char === "}") {
         depth--
         if (depth === 0) {
            return content.slice(openBraceIndex + 1, i)
         }
      }
   }
   return null
}

function getDepthDelta(text: string): number {
   let depth = 0
   for (const char of text) {
      if (char === "{" || char === "(" || char === "[") {
         depth++
      } else if (char === "}" || char === ")" || char === "]") {
         depth--
      }
   }
   return depth
}

function splitTopLevelMembers(propertiesText: string): string[] {
   const members: string[] = []
   let current = ""
   let depth = 0

   for (const rawLine of propertiesText.split("\n")) {
      const line = rawLine.trim()
      if (!line || line.startsWith("//") || line.startsWith("*")) {
         continue
      }

      current = current ? `${current} ${line}` : line
      depth += getDepthDelta(line)

      if (depth <= 0) {
         members.push(current.replace(/[,;]$/, "").trim())
         current = ""
         depth = 0
      }
   }

   if (current) {
      members.push(current.replace(/[,;]$/, "").trim())
   }

   return members
}

function parseInterfaceProperties(propertiesText: string): Property[] {
   const properties: Property[] = []
   const propertyLines = splitTopLevelMembers(propertiesText)

   for (const line of propertyLines) {
      const propertyMatch = line.match(/^(\w+)(\?)?:\s*(.+?)(?:\/\/\s*(.+?))?$/)
      if (propertyMatch) {
         const [, name, optional, type, description] = propertyMatch
         if (name && type) {
            properties.push({
               name,
               type: type.trim().replace(/,$/, ""),
               optional: !!optional,
               description: description?.trim(),
            })
         }
      }
   }

   return properties
}

function parseTypeScriptInterface(
   content: string,
   interfaceName: string,
): TypeDefinition | null {
   const marker = `interface ${interfaceName}`
   const start = content.indexOf(marker)
   if (start === -1) {
      return null
   }

   const braceStart = content.indexOf("{", start)
   if (braceStart === -1) {
      return null
   }

   const propertiesText = extractBalancedBlock(content, braceStart)
   if (!propertiesText) {
      return null
   }

   return {
      name: interfaceName,
      properties: parseInterfaceProperties(propertiesText),
   }
}

function zodPrimitiveToTsType(zodExpr: string): string {
   const expr = zodExpr.trim()
   if (expr.startsWith("z.string")) return "string"
   if (expr.startsWith("z.number")) return "number"
   if (expr.startsWith("z.boolean")) return "boolean"
   if (expr.startsWith("z.enum")) return "string"
   if (expr.startsWith("z.array")) return "unknown[]"
   if (expr.startsWith("z.unknown")) return "unknown"
   if (expr.startsWith("z.object")) return "dict"
   return "Any"
}

function parseZodObjectProperties(body: string): Property[] {
   const properties: Property[] = []

   for (const rawLine of body.split("\n")) {
      const line = rawLine.trim().replace(/,$/, "")
      if (!line || line.startsWith("//")) {
         continue
      }

      const propertyMatch = line.match(/^(\w+):\s*(.+)$/)
      if (!propertyMatch) {
         continue
      }

      const [, name, zodExpr] = propertyMatch
      if (!name || !zodExpr) {
         continue
      }

      const optional = /\.optional\(\)\s*$/.test(zodExpr)
      properties.push({
         name,
         type: zodPrimitiveToTsType(zodExpr),
         optional,
         description: undefined,
      })
   }

   return properties
}

function parseZodObjectSchema(
   content: string,
   typeName: string,
): TypeDefinition | null {
   const schemaName = `${typeName}Schema`
   const marker = `export const ${schemaName}`
   const start = content.indexOf(marker)
   if (start === -1) {
      return null
   }

   const objectCall = content.indexOf("z.object({", start)
   if (objectCall === -1) {
      return null
   }

   const braceStart = content.indexOf("{", objectCall)
   const body = extractBalancedBlock(content, braceStart)
   if (!body) {
      return null
   }

   return {
      name: typeName,
      properties: parseZodObjectProperties(body),
   }
}

function loadSharedTypesSources(sharedTypesPath: string): string[] {
   return fs
      .readdirSync(sharedTypesPath)
      .filter((file) => file.endsWith(".ts") && file !== "index.ts")
      .map((file) => fs.readFileSync(path.join(sharedTypesPath, file), "utf-8"))
}

function resolveTypeDefinition(
   sources: string[],
   typeName: string,
): TypeDefinition | null {
   for (const content of sources) {
      const fromInterface = parseTypeScriptInterface(content, typeName)
      if (fromInterface) {
         return fromInterface
      }
   }

   for (const content of sources) {
      const fromZod = parseZodObjectSchema(content, typeName)
      if (fromZod) {
         return fromZod
      }

      const schemaTypeName = ZOD_SCHEMA_NAME_BY_TYPE[typeName]
      if (schemaTypeName) {
         const fromMappedSchema = parseZodObjectSchema(content, schemaTypeName)
         if (fromMappedSchema) {
            return { ...fromMappedSchema, name: typeName }
         }
      }
   }

   return null
}

function getSharedTypesPath(): string {
   return path.join(__dirname, "../../shared-types/src")
}

function getOutputPath(): string {
   return path.join(
      __dirname,
      "../../../apps/python-audio-analyzer/src/types/generated",
   )
}

async function generatePythonTypes(): Promise<GenerateResult> {
   const sharedTypesPath = getSharedTypesPath()
   const outputPath = getOutputPath()

   if (!fs.existsSync(sharedTypesPath)) {
      throw new Error(`shared-types src not found: ${sharedTypesPath}`)
   }

   fs.mkdirSync(outputPath, { recursive: true })

   const sources = loadSharedTypesSources(sharedTypesPath)
   const generated: string[] = []
   const missing: string[] = []

   let pythonCode = `"""
Generated Python types from TypeScript shared types.

Do not edit manually - this file is auto-generated.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional, Union
from pydantic import BaseModel

`

   for (const typeName of REQUIRED_PYTHON_TYPES) {
      const typeDef = resolveTypeDefinition(sources, typeName)

      if (typeDef && typeDef.properties.length > 0) {
         const result = generatePydanticModel(typeDef)
         pythonCode += `${result.code}\n\n`
         generated.push(typeName)
         console.log(`✅ Generated ${typeName}`)
      } else {
         missing.push(typeName)
         console.error(`❌ Type ${typeName} not found in shared-types`)
      }
   }

   const outputFile = path.join(outputPath, "__init__.py")
   fs.writeFileSync(outputFile, pythonCode)

   if (missing.length === 0) {
      console.log(`🎉 Python types generated successfully: ${outputFile}`)
   } else {
      console.error(`Missing types (${missing.length}): ${missing.join(", ")}`)
   }

   return { generated, missing, outputFile }
}

if (require.main === module) {
   generatePythonTypes()
      .then(({ missing }) => {
         if (missing.length > 0) {
            process.exit(1)
         }
      })
      .catch((error) => {
         console.error(error)
         process.exit(1)
      })
}

export { generatePythonTypes, REQUIRED_PYTHON_TYPES }
