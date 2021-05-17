import { JSONSchema7 } from "json-schema";
// @ts-ignore
import { Argument } from '@cling/parser'

export const convertJSONSchemaToArgument = (jsonSchema: JSONSchema7): Argument => {
  if(jsonSchema.type && Array.isArray(jsonSchema.type)) {
    throw new Error('Cannot convert JSON Schema to cling Argument with multiple types')
  }
  // @ts-ignore
  return {
    // @ts-ignore
    $ref: jsonSchema.$ref,
    // @ts-ignore
    type: jsonSchema.type,
    // @ts-ignore
    description: jsonSchema.description
  }
}