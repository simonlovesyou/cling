import { JSONSchema7 } from "json-schema";
import type { Argument, BaseArgument, TypeName } from "@cling/parser/dist/types";
import deref from "json-schema-deref-sync";
import { pick, merge } from 'ramda'
import {Overwrite, Required} from 'utility-types'

type RequiredProp <TObject extends Record<any, any>, TProp extends string> = {
  [Prop in keyof TObject]: Prop extends TProp ? NonNullable<TObject[Prop]> : TObject[Prop]
}

type Lol = RequiredProp<{
  lol?: string
}, 'lol'>

const convertBaseArgumentProperties = (jsonSchema: JSONSchema7): BaseArgument<any> => {
  if (Array.isArray(jsonSchema.type)) {
    throw new Error(
      "Cannot convert JSON Schema to cling Argument with multiple types"
    );
  }
  if (!jsonSchema.type) {
    throw new Error("Cannot convert a JSON Schema without a type");
  }
  if (jsonSchema.type === 'object') {
    throw new Error("Cannot convert a JSON Schema with an `object` type");
  }

  const commonKeys = ['type', 'description', 'format'] as const

  const validatedSchema = jsonSchema as Required<JSONSchema7, 'type'>

  return pick(commonKeys, validatedSchema)
}

export const convertJSONSchemaToArgument = (
  jsonSchema: JSONSchema7
): Argument => {
  const dereferencedSchema = deref(jsonSchema);
  const baseArgument = convertBaseArgumentProperties(dereferencedSchema)
  /* "Enumable" types */
  if(jsonSchema.type! === 'string') {
    return merge(baseArgument, pick(['enum'], jsonSchema))
  }
  if(jsonSchema.type! === 'number') {
    return merge(baseArgument, pick(['enum'], jsonSchema))
  }
  if(jsonSchema.type! === 'integer') {
    return merge(baseArgument, pick(['enum'], jsonSchema))
  }
  /* Arrays */
  if(jsonSchema.type! === 'array') {
    return merge(baseArgument, pick(['items'], jsonSchema))
  }
  return baseArgument
};
