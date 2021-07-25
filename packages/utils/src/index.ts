import { JSONSchema7, JSONSchema7TypeName } from "json-schema";
import type {
  Argument,
  BaseArgument,
  TypeName,
} from "@cling/parser/dist/types";
import deref from "json-schema-deref-sync";
import { pick, equals, anyPass } from "ramda";
import { Required, Overwrite } from "utility-types";

const isEnumableSchema = (
  jsonSchema: Required<JSONSchema7, "type">
): boolean => {
  if (Array.isArray(jsonSchema.type)) {
    throw new TypeError(
      "Cannot convert JSON Schema to cling Argument with multiple types"
    );
  }
  const type = jsonSchema.type;
  return anyPass([equals("number"), equals("integer"), equals("string")])(type);
};

const convertBaseArgumentProperties = <TTypeName extends TypeName>(
  jsonSchema: JSONSchema7
): BaseArgument<TTypeName> => {
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

  const validatedSchema = jsonSchema as Overwrite<
    JSONSchema7,
    { type: JSONSchema7TypeName }
  >;

  const commonKeys: string[] = [
    "type",
    "description",
    "format",
    isEnumableSchema(validatedSchema) ? "enum" : "",
    validatedSchema.type === "array" ? "items" : "",
  ].filter((key) => key);

  return pick(commonKeys, jsonSchema) as BaseArgument<TTypeName>;
};
// eslint-disable-next-line import/prefer-default-export
export const convertJSONSchemaToArgument = (
  jsonSchema: JSONSchema7
): Argument => {
  const dereferencedSchema = deref(jsonSchema);
  if (jsonSchema.type === undefined) {
    throw new Error(
      "Cannot convert a JSON schema with missing type to cling argument"
    );
  }
  const baseArgument =
    convertBaseArgumentProperties<"string">(dereferencedSchema);
  return baseArgument;
};
