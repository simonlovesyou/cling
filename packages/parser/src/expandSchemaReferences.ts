import Schema, { Argument, Definitions } from "./types";
import { mapObjIndexed, path, omit, mergeRight } from "ramda";

const REMOVABLE = Symbol("removable");

const expandArgument = (argument: Argument) => (definitions: Definitions) => {
  if (argument["$ref"]) {
    // console.log(argument["$ref"].replace(/^#\//, "").split("/"));
    const reference = path<Argument | undefined>(
      argument["$ref"].replace(/^#\//, "").split("/")
    )({ definitions });
    // console.log(reference, { definitions });
    if (!reference) {
      throw new Error("Could not find reference " + argument["$ref"]);
    }
    return {
      ...reference,
      ...omit(["$ref"], argument),
    };
  }
  return argument;
};

const expandSchemaReferences = (schema: Schema): Schema => {
  const {
    definitions,
    options,
    arguments: args,
    commands,
    positionals,
  } = schema;

  if (!definitions) {
    return schema;
  }

  const expandedDefinitions = Object.entries(definitions).reduce(
    (acc, [definitionName, definition]) => ({
      ...acc,
      [definitionName]: expandArgument(definition)(schema.definitions || {}),
    }),
    {}
  );

  const expandedOptions =
    options &&
    Object.entries(options).reduce(
      (acc, [optionName, option]) => ({
        ...acc,
        [optionName]: expandArgument(option)(expandedDefinitions),
      }),
      {}
    );

  const expandedArguments =
    args &&
    Object.entries(args).reduce(
      (acc, [optionName, option]) => ({
        ...acc,
        [optionName]: expandArgument(option)(expandedDefinitions),
      }),
      {}
    );

  const expandedCommands =
    commands &&
    Object.entries(commands).reduce(
      (acc, [commandName, command]) => ({
        ...acc,
        [commandName]: expandArgument(command)(expandedDefinitions),
      }),
      {}
    );

  const expandedPositionals =
    positionals &&
    positionals.map((positional) =>
      positional.$ref
        ? expandArgument(positional)(expandedDefinitions)
        : positional
    );

  return Object.entries({
    ...schema,
    definitions: expandedDefinitions,
    options: expandedOptions || REMOVABLE,
    arguments: expandedArguments || REMOVABLE,
    commands: expandedCommands || REMOVABLE,
    positionals: expandedPositionals || REMOVABLE,
  }).reduce(
    (acc, [key, value]) =>
      value === REMOVABLE ? acc : mergeRight({ [key]: value }, acc),
    {}
    // TODO: Fix this
  ) as Schema;
};

export default expandSchemaReferences;
