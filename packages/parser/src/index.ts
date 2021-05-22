import commandLineArgs, { OptionDefinition } from "command-line-args";
import Schema, {
  Argument,
  Options,
  ExpandRecursively,
  CommandSchema,
} from "./types";
import Ajv, { ErrorObject } from "ajv";
import { clone } from "ramda";
import { JSONSchema7 } from "json-schema";
import addFormats from "ajv-formats";

const mapErrorObjectToError = (keyName: string, errorObject: ErrorObject) =>
  new Error(`${keyName}: ${errorObject.keyword} ${errorObject.message}`);

type ValueRepresentation<TValue extends any> = {
  valid: boolean;
  errors: ErrorObject[];
  value: TValue;
};

const validateType =
  <TValue extends any>(schema: JSONSchema7) =>
  (value: TValue): ValueRepresentation<TValue> => {
    const mutateableInstance = { value: clone(value) };
    const ajv = new Ajv({ coerceTypes: true });
    addFormats(ajv);
    const validate = ajv.compile({
      type: "object",
      properties: { value: schema },
    });
    const valid = validate(mutateableInstance) as boolean;

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

type ResultValue<TValue extends any> =
  | {
      valid: true;
      value: TValue;
      error?: undefined;
    }
  | {
      valid: false;
      value: TValue;
      error: Error;
    };

const formatValue = <TValue extends any>(
  keyName: string,
  argument: ValueRepresentation<TValue>
): ResultValue<TValue> =>
  argument.valid
    ? { valid: true as const, value: argument.value }
    : {
        valid: false as const,
        value: argument.value,
        error: mapErrorObjectToError(keyName, argument.errors[0]),
      };

type CoercedType<T> = T extends "string"
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

type CoerceArrayType<T extends Argument & { type: "array" }> =
  T["items"] extends readonly Argument[]
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
        __positionals__?: ValueRepresentation<unknown>[];
      };
      __positionals__?: ValueRepresentation<unknown>[];
    }
  : never;

type CoerceSchema<T extends Schema> = {
  [Key in keyof T]: Key extends "positionals"
    ?
        | { valid: true; value: CoercedTupleOf<NonNullable<T["positionals"]>> }
        | { valid: false; error: Error; value: any }
    : Key extends "options"
    ? {
        [ArgumentKey in keyof T[Key]]?:
          | {
              valid: true;
              value?: CoercedTypeObject<NonNullable<T["options"]>[ArgumentKey]>;
            }
          | { valid: false; error: Error; value: any };
      }
    : Key extends "arguments"
    ? {
        [ArgumentKey in keyof T[Key]]:
          | {
              valid: true;
              value: CoercedTypeObject<NonNullable<T[Key]>[ArgumentKey]>;
            }
          | { valid: false; error: Error; value: any };
      }
    : never;
};

function declarativeCliParser<T extends Schema | CommandSchema>(
  inputSchema: T,
  libOptions: Options = {}
): ExpandRecursively<
  T extends Schema
    ? CoerceSchema<T>
    : T extends CommandSchema
    ? {
        commands: {
          [NestedKey in keyof T["commands"]]: CoerceSchema<
            T["commands"][NestedKey]
          >;
        };
      }
    : never
> {
  const commandSchema = inputSchema as CommandSchema;

  if (commandSchema.commands) {
    const mainCommandDefinition = [{ name: "name", defaultOption: true }];
    const mainCommand = commandLineArgs(mainCommandDefinition, {
      stopAtFirstUnknown: true,
      argv: libOptions.argv,
    });

    const argv = mainCommand._unknown || [];

    const subCommand = commandSchema.commands[mainCommand.name];

    if (!subCommand) {
      throw {
        commands: {
          [mainCommand.name]: [new Error("Unknown command")],
        },
      };
    }
    // @ts-ignore
    return {
      commands: {
        [mainCommand.name]: declarativeCliParser(subCommand, { argv }),
      },
    } as unknown as ReturnType<typeof declarativeCliParser>;
  }

  const schema = inputSchema as Schema;

  const args = schema.arguments;
  const options = schema.options;
  const positionals = schema.positionals;

  const commandDefinition = [
    positionals && {
      name: "__positionals__",
      defaultOption: true,
      multiple: true,
      type: validateItemPosition(positionals as unknown as JSONSchema7),
    },
    ...Object.entries(options || {}).map(([optionName, option]) => ({
      name: optionName,
      alias: option.alias,
      group: "options",
      type: validateType(option as unknown as JSONSchema7),
    })),
    ...Object.entries(args || {}).map(([argumentName, arg]) => ({
      name: argumentName,
      alias: arg.alias,
      group: "arguments",
      type: validateType(arg as unknown as JSONSchema7),
    })),
  ].filter((definition) => definition) as OptionDefinition[];

  const commandArguments = commandLineArgs(commandDefinition, {
    argv: libOptions.argv,
    partial: true,
  }) as ParsedArguments<T>;

  const schemaKeys = Object.keys(schema) as (keyof T)[];
  // @ts-ignore
  return schemaKeys.reduce((acc, key) => {
    // @ts-ignore
    if (key === "positionals") {
      const positionals =
        commandArguments.__positionals__ ||
        commandArguments._all?.__positionals__ ||
        [];
      return {
        ...acc,
        // @ts-ignore
        [key]: schema["positionals"].reduce(
          (acc: ResultValue<any[]>, value: Argument, index: number) => {
            const positional = positionals[index];

            if (!positional || positional.value === "") {
              return {
                valid: false as const,
                error: new Error(`${value.type}: value not provided`),
                value: [...acc.value, null],
              };
            }
            if (!positional.valid || !acc.valid) {
              return {
                valid: false as const,
                error:
                  acc.valid === true
                    ? mapErrorObjectToError(value.type, positional.errors[0])
                    : acc.error,
                value: [...acc.value, positional.value],
              };
            }
            return {
              valid: true as const,
              value: [...acc.value, positional.value],
            };
          },
          {
            valid: true,
            value: [],
          }
        ),
      };
    }
    return {
      ...acc,
      // @ts-ignore
      [key]: Object.entries(schema[key]).reduce((acc, [name, value]) => {
        // @ts-ignore
        const commandValue = commandArguments[key][name];
        if (commandValue === undefined) {
          if (key === "options") {
            return acc;
          }
          return {
            [name]: {
              valid: false,
              error: new Error(`${name}: value not provided`),
              value: null,
            },
          };
        }
        // @ts-ignore
        return {
          ...acc,
          [name]: formatValue(name, commandValue),
        };
      }, {}),
    };
  }, {}) as unknown as ReturnType<typeof declarativeCliParser>;
}

export { Schema, Argument };

export default declarativeCliParser;
