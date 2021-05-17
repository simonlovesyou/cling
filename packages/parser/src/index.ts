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
  value: T extends "string" ? string : number;
  valid: true;
};

type CoercedTypeObject<T> = keyof T extends "type"
  ? CoercedType<T[keyof T]> | { valid: false; error: Error; value: any }
  : never;

type CoercedTupleOf<T> = {
  [Key in keyof T]: keyof T[Key] extends "type"
    ?
        | CoercedType<T[Key][keyof T[Key]]>
        | { valid: false; error: Error; value: any }
    : never;
};

type ParsedArguments<T> = {
  [Key in keyof T]: Key extends "options"
    ? {
        [ArgumentKey in keyof T[Key]]?: ValueRepresentation<
          CoercedTypeObject<T[Key][ArgumentKey]>
        >;
      }
    : {
        [ArgumentKey in keyof T[Key]]: ValueRepresentation<
          CoercedTypeObject<T[Key][ArgumentKey]>
        >;
      };
} &
  keyof T extends "positionals"
  ? {
      _all?: {
        __positionals__?: ValueRepresentation<CoercedTupleOf<T[keyof T]>>;
      };
      __positionals__?: ValueRepresentation<CoercedTupleOf<T[keyof T]>>;
    }
  : never;

function declarativeCliParser<T extends Schema>(
  schema: T,
  libOptions: Options = {}
): ExpandRecursively<
  {
    // This needs to be elaborated to work for more values other than 'string' & 'number'
    // Key: arguments   ArgumentKey: 'x: string'                           keyof T[Key][ArgumentKey]: type | description
    [Key in keyof T]: Key extends "positionals"
      ? CoercedTupleOf<T[Key]>
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
          [ArgumentKey in keyof T[Key]]?: CoercedTypeObject<
            T[Key][ArgumentKey]
          >;
        }
      : {
          [ArgumentKey in keyof T[Key]]: CoercedTypeObject<T[Key][ArgumentKey]>;
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
      type: validateItemPosition(positionals),
    },
    ...Object.entries(options || {}).map(([optionName, option]) => ({
      name: optionName,
      alias: option.alias,
      group: "options",
      type: validateType(option),
    })),
    ...Object.entries(args || {}).map(([argumentName, arg]) => ({
      name: argumentName,
      alias: arg.alias,
      group: "arguments",
      type: validateType(arg),
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
