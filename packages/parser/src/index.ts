import commandLineArgs, { OptionDefinition } from "command-line-args";
import Schema, { Argument, Options, ExpandRecursively } from "./types";
import Ajv, { ErrorObject } from "ajv";
import { clone, mergeRight } from "ramda";
import { JSONSchema7 } from "json-schema";

const mapErrorObjectToError = (errorObject: ErrorObject) =>
  new Error(`${errorObject.keyword} ${errorObject.message}`);

type ValueRepresentation<TValue extends any> = {
  valid: boolean;
  errors: ErrorObject<string, Record<string, any>, unknown>[];
  value: TValue;
};

const validateType = <TValue extends any>(schema: JSONSchema7) => (
  value: TValue
): ValueRepresentation<TValue> => {
  const mutateableInstance = { value: clone(value) };
  const ajv = new Ajv({ coerceTypes: true, strict: false });
  const validate = ajv.compile({
    type: "object",
    properties: { value: schema },
  });
  const valid = validate(mutateableInstance);

  return {
    valid,
    errors: validate.errors || [],
    value: mutateableInstance.value,
  };
};

const validateItemPosition = (
  schemas: readonly JSONSchema7[] | JSONSchema7
) => {
  let currentPosition = 0;
  return (value: any) => {
    const schema = Array.isArray(schemas) ? schemas[currentPosition] : schemas;

    const validatedType = validateType(schema)(value);

    return validatedType;
  };
};

const formatValue = <TValue extends any>(
  value: Record<string, ValueRepresentation<TValue>>
) => {
  return Object.entries(value).reduce(
    (acc: Record<string, unknown>, [key, argument]) =>
      mergeRight(
        {
          [key]: argument.valid
            ? { valid: true, value: argument.value }
            : {
                valid: false,
                value: argument.value,
                error: mapErrorObjectToError(argument.errors[0]),
              },
        },
        acc
      ),
    {}
  );
};

type CoercedType<T> = {
  value: T extends "string"
    ? string
    : T extends "number"
    ? number
    : T extends "integer"
    ? number
    : T extends "boolean"
    ? boolean
    : T extends "null"
    ? null
    : never;
  valid: true;
};

type CoerceArrayType<
  T extends Argument & { type: "array" }
> = T["items"] extends readonly Argument[]
  ? CoercedTupleOf<T["items"]>
  : T["items"] extends Argument
  ? CoercedTypeObject<T["items"]>[]
  : any[];

type CoercedTypeObject<T extends Argument> = T["type"] extends "array"
  ? CoerceArrayType<T & { type: "array" }>
  : CoercedType<T[keyof T]>;

type CoercedTupleOf<T extends readonly Argument[]> = {
  [Key in keyof T]: keyof T[Key] extends "type"
    ? CoercedType<T[Key][keyof T[Key]]>
    : never;
};

type ParsedArguments<T> = {
  [Key in keyof T]: Key extends "options"
    ? {
        [ArgumentKey in keyof T[Key]]?: ValueRepresentation<unknown>;
      }
    : {
        [ArgumentKey in keyof T[Key]]: ValueRepresentation<unknown>;
      };
} &
  keyof T extends "positionals"
  ? {
      _all?: {
        __positionals__?: ValueRepresentation<unknown>;
      };
      __positionals__?: ValueRepresentation<unknown>;
    }
  : never;

function declarativeCliParser<T extends Schema>(
  schema: T,
  libOptions: Options = {}
): ExpandRecursively<
  {
    // Key: arguments   ArgumentKey: 'x: string'                           keyof T[Key][ArgumentKey]: type | description
    [Key in keyof T]: Key extends "positionals"
      ?
          | CoercedTupleOf<NonNullable<T["positionals"]>>
          | { valid: false; error: Error; value: any }
      : // : Key extends "commands"
      // ? {
      //     [NestedKey in keyof T[Key]]: {
      //       [AnotherNestedKey in keyof T[Key][NestedKey]]: CoerceSchema<
      //         T[Key][NestedKey][AnotherNestedKey]
      //       >;
      //     };
      //   }
      Key extends "options"
      ? {
          [ArgumentKey in keyof T[Key]]?:
            | CoercedTypeObject<NonNullable<T["options"]>[ArgumentKey]>
            | { valid: false; error: Error; value: any };
        }
      : {
          [ArgumentKey in keyof T[Key]]:
            | CoercedTypeObject<T[Key][ArgumentKey]>
            | { valid: false; error: Error; value: any };
        };
  }
> {
  const args = schema.arguments;
  const options = schema.options;
  const positionals = schema.positionals;

  const commandDefinition = [
    positionals && {
      name: "__positionals__",
      defaultOption: true,
      multiple: true,
      type: validateItemPosition((positionals as unknown) as JSONSchema7),
    },
    ...Object.entries(options || {}).map(([optionName, option]) => ({
      name: optionName,
      alias: option.alias,
      group: "options",
      type: validateType((option as unknown) as JSONSchema7),
    })),
    ...Object.entries(args || {}).map(([argumentName, arg]) => ({
      name: argumentName,
      alias: arg.alias,
      group: "arguments",
      type: validateType((arg as unknown) as JSONSchema7),
    })),
  ].filter((definition) => definition) as OptionDefinition[];

  const commandArguments = commandLineArgs(commandDefinition, {
    argv: libOptions.argv,
  }) as ParsedArguments<T>;

  const schemaKeys = Object.keys(schema) as (keyof T)[];
  // @ts-ignore
  return (schemaKeys.reduce((acc, key) => {
    console.log();
    const result = {
      ...acc,
      [key]:
        key !== "positionals"
          ? // @ts-ignore
            formatValue<CoercedType<T[typeof key]>>(commandArguments[key])
          : (
              commandArguments.__positionals__ ||
              commandArguments._all?.__positionals__ ||
              []
            )
              // @ts-ignore
              .map((value) =>
                value.valid
                  ? { valid: true, value: value.value }
                  : {
                      valid: false,
                      value: value.value,
                      error: mapErrorObjectToError(value.errors[0]),
                    }
              ),
    };
    return result;
  }, {}) as unknown) as ReturnType<typeof declarativeCliParser>;
}

export { Schema, Argument };

export default declarativeCliParser;
