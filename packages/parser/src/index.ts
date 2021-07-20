import commandLineArgs, { OptionDefinition } from "command-line-args";
import Ajv, { ErrorObject } from "ajv";
import { clone, head } from "ramda";
import { JSONSchema7 } from "json-schema";
import addFormats from "ajv-formats";
import Schema, { Argument, Options, CommandSchema } from "./types";

const mapErrorObjectToError = (keyName: string, errorObject: ErrorObject) =>
  new Error(
    `${keyName}: ${errorObject.keyword} ${errorObject.message ?? ""}`.trim()
  );

interface ValidatedValue<TValue = unknown> {
  valid: boolean;
  errors: ErrorObject[];
  value: TValue;
}

const validateType =
  <TValue>(schema: JSONSchema7) =>
  (value: TValue): ValidatedValue<TValue> => {
    const mutateableInstance = { value: clone(value) };
    const ajv = new Ajv({ coerceTypes: true, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile({
      type: "object",
      properties: { value: schema },
    });
    const valid = validate(mutateableInstance)!;

    if (validate.errors) {
      return {
        valid: false,
        value,
        errors: validate.errors.map((error) =>
          error.keyword === "enum"
            ? {
                ...error,
                message: `must be equal to one of the allowed values: ${schema.enum!.join(
                  ", "
                )}`,
              }
            : error
        ),
      };
    }

    return {
      valid,
      errors: validate.errors ?? [],
      value: mutateableInstance.value,
    };
  };

interface ParsedArguments {
  options?: Record<string, ValidatedValue>;
  arguments?: Record<string, ValidatedValue>;
  _positionals_?: (ValidatedValue | undefined)[];
  _all?: {
    _positionals_?: (ValidatedValue | undefined)[];
  };
}

const validateItemPosition = (
  schemas: JSONSchema7 | readonly JSONSchema7[]
) => {
  // eslint-disable-next-line fp/no-let
  let currentPosition = 0;
  return (value: unknown) => {
    const schema = (
      Array.isArray(schemas) ? schemas[currentPosition] : schemas
    ) as JSONSchema7;

    const validatedType = validateType(schema)(value);
    // eslint-disable-next-line fp/no-mutation
    currentPosition++;
    return validatedType;
  };
};

type Value<TValue = unknown> =
  | {
      valid: false;
      value: TValue;
      error: Error;
    }
  | {
      valid: true;
      value: TValue;
      error?: undefined;
    };

const formatValue = <TValue>(
  keyName: string,
  argument: ValidatedValue<TValue>
): Value<TValue> =>
  argument.valid
    ? { valid: true as const, value: argument.value }
    : {
        valid: false as const,
        value: argument.value,
        error: mapErrorObjectToError(keyName, head(argument.errors)!),
      };

interface SchemaResults {
  arguments?: Record<string, Value>;
  options?: Record<string, Value>;
  positionals?: Value<readonly unknown[]>;
}

interface CommandResults {
  commands: Record<string, SchemaResults>;
}

function declarativeCliParser(
  inputSchema: Schema,
  libraryOptions: Options
): SchemaResults;
function declarativeCliParser(
  inputSchema: CommandSchema,
  libraryOptions: Options
): CommandResults;
function declarativeCliParser(
  schema: CommandSchema | Schema,
  libraryOptions: Options = {}
): CommandResults | SchemaResults {
  if (schema.commands !== undefined) {
    const mainCommandDefinition = [{ name: "name", defaultOption: true }];
    const mainCommand = commandLineArgs(mainCommandDefinition, {
      stopAtFirstUnknown: true,
      argv: libraryOptions.argv,
    }) as { name?: string; _unknown?: string[] };

    const argv = mainCommand?._unknown ?? [];

    const commandName = mainCommand.name ?? "";

    const subCommand = schema.commands?.[commandName];

    if (!subCommand) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    return {
      commands: {
        [commandName]: declarativeCliParser(subCommand, { argv }),
      },
    };
  }
  const argumentSchema = schema as Schema;

  const arguments_ = argumentSchema.arguments;
  const options = argumentSchema.options;
  const positionalDefinitions = argumentSchema.positionals;

  const commandDefinition = [
    positionalDefinitions && {
      name: "_positionals_",
      defaultOption: true,
      multiple: true,
      type: validateItemPosition(
        positionalDefinitions as unknown as JSONSchema7
      ),
    },
    ...Object.entries(options ?? {}).map(([optionName, option]) => ({
      name: optionName,
      alias: option.alias,
      group: "options",
      type: validateType(option as unknown as JSONSchema7),
    })),
    ...Object.entries(arguments_ ?? {}).map(([argumentName, argument]) => ({
      name: argumentName,
      alias: argument.alias,
      group: "arguments",
      type: validateType(argument as unknown as JSONSchema7),
    })),
  ].filter((definition) => definition) as OptionDefinition[];

  const commandArguments = commandLineArgs(commandDefinition, {
    argv: libraryOptions.argv,
    partial: true,
  }) as ParsedArguments;

  const schemaKeys = Object.keys(argumentSchema).filter(
    (key) => key !== "commands" && key !== "description"
  ) as Exclude<keyof Schema, "commands" | "description">[];

  return schemaKeys.reduce((accumulator, key) => {
    if (key === "positionals") {
      const positionals =
        commandArguments._positionals_ ??
        commandArguments._all?._positionals_ ??
        [];
      return {
        ...accumulator,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        [key]: argumentSchema.positionals!.reduce(
          (
            accumulator_: Value<readonly unknown[]>,
            value: Argument,
            index: number
          ) => {
            const positional = positionals[index];

            if (!positional || positional.value === "") {
              return {
                valid: false as const,
                error: new Error(`${value.type}: value not provided`),
                value: [...accumulator_.value, null],
              };
            }
            if (!positional.valid || !accumulator_.valid) {
              return {
                valid: false as const,
                error:
                  accumulator_.valid === true
                    ? mapErrorObjectToError(
                        value.type,
                        head(positional.errors)!
                      )
                    : accumulator_.error,
                value: [...accumulator_.value, positional.value],
              };
            }
            return {
              valid: true as const,
              value: [...accumulator_.value, positional.value],
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
      ...accumulator,
      [key]: Object.entries(argumentSchema[key]!).reduce(
        (nestedAccumulator, [name]) => {
          const commandValue = commandArguments[key]![name];
          if (
            commandValue === null &&
            argumentSchema[key]![name].type === "boolean"
          ) {
            return {
              ...nestedAccumulator,
              [name]: formatValue(name, {
                valid: true,
                errors: [],
                value: true,
              }),
            };
          }

          if (commandValue === undefined) {
            if (key === "options") {
              return nestedAccumulator;
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
            ...nestedAccumulator,
            [name]: formatValue(name, commandValue),
          };
        },
        {}
      ),
    };
  }, {});
}

export { Schema, Argument };

export default declarativeCliParser;
