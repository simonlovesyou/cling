import { JSONSchema7 } from "json-schema";
import { Argument } from '@cling/parser'

export const convertJSONSchemaToArgument = (jsonSchema: JSONSchema7): Argument => {
  if(jsonSchema.type && Array.isArray(jsonSchema.type)) {
    throw new Error('Cannot convert JSON Schema to cling Argument with multiple types')
  }
  return {
    $ref: jsonSchema.$ref,
    type: jsonSchema.type,
    description: jsonSchema.description
  }
}