/**
 * Generate Python Pydantic models from TypeScript shared types
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// Type mappings from TypeScript to Python
const TYPE_MAPPINGS: Record<string, string> = {
   string: 'str',
   number: 'float',
   boolean: 'bool',
   Date: 'datetime',
   unknown: 'Any',
   any: 'Any',
   null: 'None',
   undefined: 'None',
}

interface TypeDefinition {
   name: string
   properties: Property[]
   optional?: boolean
}

interface Property {
   name: string
   type: string
   optional: boolean
   description: string | undefined
}

/**
 * Convert TypeScript type to Python type
 */
function convertType(tsType: string): string {
   // Handle array types
   if (tsType.endsWith('[]')) {
      const baseType = tsType.slice(0, -2)
      return `list[${convertType(baseType)}]`
   }

   // Handle union types (simplified)
   if (tsType.includes(' | ')) {
      const types = tsType.split(' | ').map(t => t.trim())
      if (types.includes('null') || types.includes('undefined')) {
         const nonNullTypes = types.filter(t => t !== 'null' && t !== 'undefined')
         if (nonNullTypes.length === 1 && nonNullTypes[0]) {
            return `Optional[${convertType(nonNullTypes[0])}]`
         }
      }
      return `Union[${types.map(convertType).join(', ')}]`
   }

   // Direct mapping
   return TYPE_MAPPINGS[tsType] || tsType
}

/**
 * Generate Python Pydantic model from TypeScript interface
 */
function generatePydanticModel(typeDef: TypeDefinition): { imports: string[]; code: string } {
   const className = typeDef.name
   const imports = new Set<string>(['BaseModel'])

   let code = `class ${className}(BaseModel):
    """
    ${className} model for Sonory API.
    
    Generated from TypeScript shared types.
    """
`

   for (const prop of typeDef.properties) {
      const pythonType = convertType(prop.type)

      // Add necessary imports
      if (pythonType.includes('Optional')) {
         imports.add('Optional')
      }
      if (pythonType.includes('Union')) {
         imports.add('Union')
      }
      if (pythonType.includes('datetime')) {
         imports.add('datetime')
      }
      if (pythonType.includes('Any')) {
         imports.add('Any')
      }

      const fieldType = prop.optional ? `Optional[${pythonType}] = None` : pythonType
      const description = prop.description ? ` # ${prop.description}` : ''

      code += `    ${prop.name}: ${fieldType}${description}\n`
   }

   return {
      imports: Array.from(imports),
      code,
   }
}

/**
 * Parse TypeScript interface (simplified parser)
 */
function parseTypeScriptInterface(content: string, interfaceName: string): TypeDefinition | null {
   const interfaceRegex = new RegExp(`interface ${interfaceName}\\s*{([^}]+)}`, 's')
   const match = content.match(interfaceRegex)

   if (!match || !match[1]) {
      return null
   }

   const propertiesText = match[1]
   const properties: Property[] = []

   // Simple property parsing (this could be more sophisticated)
   const propertyLines = propertiesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//') && !line.startsWith('*'))

   for (const line of propertyLines) {
      const propertyMatch = line.match(/(\w+)(\?)?:\s*(.+?)(?:\/\/\s*(.+?))?(?:;|$)/)
      if (propertyMatch) {
         const [, name, optional, type, description] = propertyMatch
         if (name && type) {
            properties.push({
               name,
               type: type.trim(),
               optional: !!optional,
               description: description?.trim(),
            })
         }
      }
   }

   return {
      name: interfaceName,
      properties,
   }
}

/**
 * Main generation function
 */
async function generatePythonTypes(): Promise<void> {
   const sharedTypesPath = path.join(__dirname, '../../shared-types/src')
   const outputPath = path.join(__dirname, '../../python-audio-analyzer/src/types/generated')

   // Ensure output directory exists
   fs.mkdirSync(outputPath, { recursive: true })

   // Read shared types files
   const apiTypesPath = path.join(sharedTypesPath, 'api.ts')
   const soundPinTypesPath = path.join(sharedTypesPath, 'soundPin.ts')

   if (!fs.existsSync(apiTypesPath)) {
      console.error('API types file not found:', apiTypesPath)
      return
   }

   const apiTypesContent = fs.readFileSync(apiTypesPath, 'utf-8')
   const soundPinTypesContent = fs.existsSync(soundPinTypesPath)
      ? fs.readFileSync(soundPinTypesPath, 'utf-8')
      : ''

   // Interfaces to generate
   const interfacesToGenerate = [
      'LocationCoordinates',
      'WeatherContext',
      'AudioMetadata',
      'AIAnalysis',
      'SoundPinAPI',
      'CreatePinRequest',
      'UpdatePinRequest',
      'AnalyzeAudioRequest',
      'AnalyzeAudioResponse',
   ]

   let pythonCode = `"""
Generated Python types from TypeScript shared types.

Do not edit manually - this file is auto-generated.
"""

from datetime import datetime
from typing import Any, Optional, Union, List
from pydantic import BaseModel

`

   for (const interfaceName of interfacesToGenerate) {
      const typeDef =
         parseTypeScriptInterface(apiTypesContent, interfaceName) ||
         parseTypeScriptInterface(soundPinTypesContent, interfaceName)

      if (typeDef) {
         const result = generatePydanticModel(typeDef)
         pythonCode += `${result.code}\n\n`
         console.log(`✅ Generated ${interfaceName}`)
      } else {
         console.warn(`⚠️  Interface ${interfaceName} not found`)
      }
   }

   // Write to output file
   const outputFile = path.join(outputPath, '__init__.py')
   fs.writeFileSync(outputFile, pythonCode)

   console.log(`🎉 Python types generated successfully: ${outputFile}`)
}

// Run the generator
if (require.main === module) {
   generatePythonTypes().catch(console.error)
}

export { generatePythonTypes }
