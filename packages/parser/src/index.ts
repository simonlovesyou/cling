import commandLineArgs, { OptionDefinition } from "command-line-args";
import Schema, {
  Argument,
  Options,
  CommandSchema,
} from "./types";
import Ajv, { ErrorObject } from "ajv";
import { clone } from "ramda";
import { JSONSchema7 } from "json-schema";
import addFormats from "ajv-formats";

const isCommandSchema = (schemaLike: Record<string, unknown>): schemaLike is CommandSchema => schemaLike.commands !== undefined

const mapErrorObjectToError = (keyName: string, errorObject: ErrorObject) =>
  new Error(`${keyName}: ${errorObject.keyword} ${errorObject.message}`);

type ValueRepresentation<TValue = unknown> = {
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

interface ParsedArguments {
  options?: Record<string, ValueRepresentation<unknown>>;
  arguments?: Record<string, ValueRepresentation<unknown>>;
  _positionals_?: ValueRepresentation<unknown>[];
  _all?: {
    _positionals_: ValueRepresentation<unknown>[];
  }
}

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

interface SchemaResults {
  arguments?: Record<string, ValueRepresentation>;
  options?: Record<string, ValueRepresentation>;
  positionals?: ValueRepresentation<readonly unknown[]>;
}

interface CommandResults {
  commands: Record<string, SchemaResults>
}

function declarativeCliParser(inputSchema: Schema, libOptions: Options): SchemaResults
function declarativeCliParser(inputSchema: CommandSchema, libOptions: Options): CommandResults
function declarativeCliParser(
  schema: Schema | CommandSchema,
  libOptions: Options = {}
): SchemaResults | CommandResults {
  if (isCommandSchema(schema)) {
    const mainCommandDefinition = [{ name: "name", defaultOption: true }];
    const mainCommand = commandLineArgs(mainCommandDefinition, {
      stopAtFirstUnknown: true,
      argv: libOptions.argv,
    });

    const argv = mainCommand._unknown || [];

    const subCommand = schema.commands?.[mainCommand.name];

    if (!subCommand) {
      throw {
        commands: {
          [mainCommand.name]: [new Error("Unknown command")],
        },
      };
    }

    return {
      commands: {
        [mainCommand.name]: declarativeCliParser(subCommand, { argv }),
      },
    }
  }
  const argumentSchema = schema as Schema

  const arguments_ = argumentSchema.arguments;
  const options = argumentSchema.options;
  const positionals = argumentSchema.positionals;

  const commandDefinition = [
    positionals && {
      name: "_positionals_",
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
    ...Object.entries(arguments_ || {}).map(([argumentName, argument]) => ({
      name: argumentName,
      alias: argument.alias,
      group: "arguments",
      type: validateType(argument as unknown as JSONSchema7),
    })),
  ].filter((definition) => definition) as OptionDefinition[];

  const commandArguments = commandLineArgs(commandDefinition, {
    argv: libOptions.argv,
    partial: true,
  }) as ParsedArguments;

  const schemaKeys = Object.keys(argumentSchema).filter(key => key !== 'commands' && key !== 'description') as Exclude<keyof Schema, 'commands' | 'description'>[]

  return schemaKeys.reduce((acc, key) => {
    if (key === "positionals") {
      const positionals =
        commandArguments._positionals_ ??
        commandArguments._all?._positionals_ ??
        [];
      return {
        ...acc,
        [key]: argumentSchema.positionals!.reduce(
          (acc: ResultValue<readonly unknown[]>, value: Argument, index: number) => {
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
      [key]: Object.entries(schema[key]).reduce((acc, [name, value]) => {
        const commandValue = commandArguments[key]![name];
        if (commandValue === null && argumentSchema[key]![name].type === "boolean") {
          return {
            ...acc,
            [name]: formatValue(name, {
              valid: true,
              errors: [],
              value: true,
            }),
          };
        }

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
        return {
          ...acc,
          [name]: formatValue(name, commandValue),
        };
      }, {}),
    };
  }, {})
}

export { Schema, Argument };

export default declarativeCliParser;
