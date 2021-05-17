import { JSONSchema7 } from "json-schema";
import { Argument } from "@cling/parser";
import { deref } from "json-schema-deref-sync";

export const convertJSONSchemaToArgument = (
  jsonSchema: JSONSchema7
): Argument => {
  const dereferencedSchema = deref(jsonSchema);
  if (Array.isArray(dereferencedSchema.type)) {
    throw new Error(
      "Cannot convert JSON Schema to cling Argument with multiple types"
    );
  }
  if (!dereferencedSchema.type) {
    throw new Error("Cannot convert a JSON Schema without a type");
  }
  if (dereferencedSchema.type === 'object') {
    throw new Error("Cannot convert a JSON Schema with an `object` type");
  }
  return {
    type: dereferencedSchema.type,
    description: dereferencedSchema.description,
  };
};
