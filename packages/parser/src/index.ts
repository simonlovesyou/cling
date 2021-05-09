import commandLineArgs, { OptionDefinition } from "command-line-args";
import Schema, { Argument } from "./types";
import Ajv, { ErrorObject } from "ajv";
import { clone, mergeRight } from "ramda";
import expandedSchemaReferences from "./expandSchemaReferences";
import { JSONSchema7 } from "json-schema";

type Options = {
  positionals?: boolean;
  argv?: string[];
  coerceTypes?: boolean;
};

type Result = {
  arguments?: Record<string, unknown>;
  options?: Record<string, unknown>;
  positionals?: unknown[];
  commands?: Record<string, any>;
  errors: {
    arguments?: Record<string, Error[] | null>;
    options?: Record<string, Error[] | null>;
    positionals?: (Error[] | null)[];
    commands?: Record<string, Error[] | null>;
  };
};

type ParsedArguments = {
  _all?: {
    __positionals__?: ReturnType<ReturnType<typeof validateItemPosition>>[];
  };
  arguments?: ReturnType<ReturnType<typeof validateType>>;
  options?: ReturnType<ReturnType<typeof validateType>>;
  __positionals__?: ReturnType<ReturnType<typeof validateItemPosition>>[];
};

const mapErrorObjectToError = (errorObject: ErrorObject) =>
  new Error(`${errorObject.keyword} ${errorObject.message}`);

const validateType = (schema: JSONSchema7) => (value: any) => {
  const mutateableInstance = { value: clone(value) };
  const ajv = new Ajv({ coerceTypes: true, strict: false });
  const validate = ajv.compile({
    type: "object",
    properties: { value: schema },
  });
  const valid = validate(mutateableInstance);

  return {
    valid,
    errors: validate.errors || null,
    value: mutateableInstance.value,
  };
};

const validateItemPosition = (schemas: JSONSchema7[] | JSONSchema7) => {
  let currentPosition = 0;
  return (value: any) => {
    const schema = Array.isArray(schemas) ? schemas[currentPosition] : schemas;

    const validatedType = validateType(schema)(value);

    return validatedType;
  };
};

function declarativeCliParser(
  schema: Schema,
  libOptions: Options = {}
): Result {
  const ajv = new Ajv({ coerceTypes: libOptions.coerceTypes, strict: false });

  const expandedSchema = expandedSchemaReferences(schema);

  const commands = expandedSchema.commands;

  if (commands) {
    const mainCommandDefinition = [{ name: "name", defaultOption: true }];
    const mainCommand = commandLineArgs(mainCommandDefinition, {
      stopAtFirstUnknown: true,
      argv: libOptions.argv,
    });

    const argv = mainCommand._unknown || [];
    console.log({ commands });
    const subCommand = commands[mainCommand.name];

    if (!subCommand) {
      return {
        errors: {
          commands: {
            [mainCommand.name]: [new Error("Unknown command")],
          },
        },
      };
    }
    return {
      commands: {
        [mainCommand.name]: declarativeCliParser(subCommand, { argv }),
      },
      errors: {
        commands: {
          [mainCommand.name]: null,
        },
      },
    };
  }

  const args = expandedSchema.arguments;
  const options = expandedSchema.options;
  const positionals = expandedSchema.positionals;

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
  }) as ParsedArguments;

  return {
    arguments: Object.entries(commandArguments.arguments || {}).reduce(
      (acc: Record<string, any>, [key, argument]: [string, any]) =>
        mergeRight({ [key]: argument.errors ? null : argument.value }, acc),
      {}
    ),
    options: Object.entries(commandArguments.options || {}).reduce(
      (acc: Record<string, any>, [key, option]: [string, any]) =>
        mergeRight({ [key]: option.errors ? null : option.value }, acc),
      {}
    ),
    positionals: (
      commandArguments.__positionals__ ||
      commandArguments._all?.__positionals__ ||
      []
    ).map(({ value, errors }) => (errors ? null : value)),
    errors: {
      arguments: Object.entries(commandArguments.arguments || {}).reduce(
        (
          acc,
          [key, argument]: [string, NonNullable<ParsedArguments["arguments"]>]
        ) =>
          mergeRight(
            {
              [key]:
                argument.errors && argument.errors.map(mapErrorObjectToError),
            },
            acc
          ),
        {}
      ),
      options:
        commandArguments.options &&
        Object.entries(commandArguments.options).reduce(
          (
            acc,
            [key, argument]: [string, NonNullable<ParsedArguments["arguments"]>]
          ) =>
            mergeRight(
              {
                [key]:
                  argument.errors && argument.errors.map(mapErrorObjectToError),
              },
              acc
            ),
          {}
        ),
      positionals:
        positionals &&
        new Array(positionals.length).fill(null).map((_, index) => {
          const positional = commandArguments.__positionals__?.[index];
          return positional?.errors
            ? positional.errors.map(mapErrorObjectToError)
            : null;
        }),
    },
  };
}

export { Schema, Argument };

export default declarativeCliParser;
