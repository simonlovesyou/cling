#!/usr/bin/env node
// eslint-disable-next-line import/named
import parser, { ValueRepresentation } from "@cling/parser";
import commandLineUsage from "command-line-usage";
import { EXIT_FAILURE, EXIT_SUCCESS } from '@eropple/exit-codes';
import { mapObjIndexed, assocPath, pipe } from "ramda";
import Schema, { Options, CommandSchema } from "./types";
import mapSchemaUsageToHelp from "./utils/mapSchemaToUsageHelp";

interface SchemaResult {
  options?: Record<string, unknown>;
  arguments?: Record<string, unknown>;
  positionals?: unknown[];
}

interface CommandSchemaResults {
  commands: Record<string, SchemaResult>;
}

const addHelpOption = (schema: Readonly<Schema>): Schema =>
  assocPath(["options", "help"], { alias: "h", type: "boolean" }, schema);

const mergeTruthy =
  (objectValue: Record<string, unknown> | undefined) =>
  (object: Record<string, unknown>): Record<string, unknown> => ({
    ...objectValue ? objectValue : {},
    ...object,
  });

const mapValueRepresentationToDeclaration = (
  argument: Record<string, ValueRepresentation>
): Record<string, unknown> => {
  return mapObjIndexed((argument_) => {
    if (argument_.valid === true) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return argument_.value;
    } else {
      throw argument_.error;
    }
  }, argument);
};
function cling (schema: Readonly<Schema>, libraryOptions: Readonly<Options>): SchemaResult;
function cling (
  schema: Readonly<CommandSchema>,
  libraryOptions: Readonly<Options>
): CommandSchemaResults;
function cling (
  schema: Readonly<CommandSchema | Schema>,
  libraryOptions: Readonly<Options>
): CommandSchemaResults | SchemaResult {
  if (schema.commands) {

    const commandSchemaResults: CommandSchemaResults = {
      commands: mapObjIndexed((command: Readonly<Schema>, commandName) => {
        return cling(command, {
          ...libraryOptions,
          argv: libraryOptions.argv?.filter((argument: string) => argument !== commandName),
        });
      })(schema.commands),
    };

    return commandSchemaResults;
  }
  const actualSchema = schema as Schema;

  const parsedArguments = parser(addHelpOption(actualSchema), libraryOptions);

  if (parsedArguments.options?.help?.value === true) {
    console.log(
      commandLineUsage(
        mapSchemaUsageToHelp(actualSchema, "test") as commandLineUsage.Section[]
      ).trim()
    );
    return process.exit(EXIT_SUCCESS);
  }

  try {
    if (parsedArguments.positionals?.valid === false) {
      throw parsedArguments.positionals.error;
    }

    const positionals = parsedArguments.positionals?.value;

    const { options, arguments: arguments_ } = parsedArguments;

    const validatedOptions =
      options && mapValueRepresentationToDeclaration(options);
    const validatedArguments =
      arguments_ && mapValueRepresentationToDeclaration(arguments_);

    return pipe(
      mergeTruthy(options && { options: validatedOptions }),
      mergeTruthy(positionals && { positionals }),
      mergeTruthy(arguments_ && { arguments: validatedArguments })
    )({});
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.error(error.message);
    return process.exit(EXIT_FAILURE);
  }
}

export default cling;
