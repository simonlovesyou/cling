import parser, { ArgumentResult, ValueRepresentation } from "@cling/parser";
import commandLineUsage from "command-line-usage";
import Schema, { Argument, Options, CommandSchema } from "./types";
import mapSchemaUsageToHelp from "./utils/mapSchemaToUsageHelp";
import { mapObjIndexed, assocPath, pipe } from "ramda";

type SchemaResult = {
  options?: Record<string, any>;
  arguments?: Record<string, any>;
  positionals?: any[];
};

type CommandSchemaResults = {
  commands: Record<string, SchemaResult>;
};

const addHelpOption = (schema: Schema): Schema =>
  assocPath(["options", "help"], { alias: "h", type: "boolean" }, schema);

const mergeTruthy =
  (objectValue: Record<string, any> | undefined) =>
  (object: Record<string, any>) => ({
    ...(objectValue ? objectValue : {}),
    ...object,
  });

const mapValueRepresentationToDeclaration = (
  arg: Record<string, ValueRepresentation>
) => {
  debugger;
  return mapObjIndexed((argument) => {
    debugger;
    if (argument.valid === true) {
      return argument.value;
    }
    throw argument.error;
  }, arg);
};
function cling(schema: Schema, libOptions: Options): SchemaResult;
function cling(
  schema: CommandSchema,
  libOptions: Options
): CommandSchemaResults;
function cling(
  schema: Schema | CommandSchema,
  libOptions: Options
): SchemaResult | CommandSchemaResults {
  if (schema.commands) {

    const commandSchemaResults: CommandSchemaResults = {
      commands: mapObjIndexed((command: Schema, commandName) => {
        return cling(command, {
          ...libOptions,
          argv:
            libOptions.argv &&
            libOptions.argv.filter((arg: string) => arg !== commandName),
        });
      })(schema.commands),
    };

    return commandSchemaResults;
  }
  const actualSchema = schema as Schema;

  const parsedArguments = parser(addHelpOption(actualSchema), libOptions);

  if (parsedArguments?.options?.help?.value) {
    console.log(
      commandLineUsage(
        mapSchemaUsageToHelp(actualSchema, "test") as commandLineUsage.Section[]
      ).trim()
    );
    return process.exit(0);
  }

  try {
    if (parsedArguments.positionals?.valid === false) {
      throw parsedArguments.positionals.error;
    }

    const positionals = parsedArguments.positionals?.value;

    const { options, arguments: args } = parsedArguments;

    const validatedOptions =
      options && mapValueRepresentationToDeclaration(options);
    const validatedArguments =
      args && mapValueRepresentationToDeclaration(args);

    return pipe(
      mergeTruthy(options && { options: validatedOptions }),
      mergeTruthy(positionals && { positionals }),
      mergeTruthy(args && { arguments: validatedArguments })
    )({});
  } catch (error) {
    console.error(error.message);
    return process.exit(1);
  }
}

export default cling;
