import { JSONSchema7 } from "json-schema";
import type { Argument } from "@cling/parser/dist/types";
import deref from "json-schema-deref-sync";
import { pick } from "ramda";

const COMMON_KEYS = ["type", "description", "format", "enum", "items"] as const;

const convertBaseArgumentProperties = (jsonSchema: JSONSchema7): Argument => {
  if (Array.isArray(jsonSchema.type)) {
    throw new TypeError(
      "Cannot convert JSON Schema to cling Argument with multiple types"
    );
  }
  if (!jsonSchema.type) {
    throw new Error("Cannot convert a JSON Schema without a type");
  }
  if (jsonSchema.type === "object") {
    throw new Error("Cannot convert a JSON Schema with an `object` type");
  }

  return pick(COMMON_KEYS, jsonSchema) as Argument;
};

/**
 * Utility function to convert a compatible JSON Schema to a cling compatible Argument
 */
export const convertJSONSchemaToArgument = (
  jsonSchema: JSONSchema7
): Argument => {
  const dereferencedSchema = deref(jsonSchema);
  if (jsonSchema.type === undefined) {
    throw new Error(
      "Cannot convert a JSON schema with missing type to cling argument"
    );
  }
  const argument = convertBaseArgumentProperties(dereferencedSchema);
  return argument;
};

/**
 * Utility function to convert a cling compatible Argument to a compatible JSON Schema
 */
export const convertArgumentToJSONSchema = (
  argument: Argument
): JSONSchema7 => {
  return pick(COMMON_KEYS, argument);
};
