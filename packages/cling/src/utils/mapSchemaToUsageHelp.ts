import { OptionList } from "command-line-usage";
import { append, identity, pipe } from "ramda";
import Schema, { Argument } from "../types";

interface Header {
  header: string;
  content: string;
}

const wrap =
  (prefix: string, joinString: string, affix: string) =>
  (stringArray: readonly string[]): string =>
    `${prefix}${stringArray.join(joinString)}${affix}`;

const mapArgumentToLabel = (argument: {
  name: string;
  alias?: Argument["alias"];
}): string =>
  pipe<string[], string[], string[], string>(
    () => [],
    append(`--${argument.name}`),
    argument.alias !== undefined ? append(`-${argument.alias}`) : identity,
    wrap("[", " | ", "]")
  )();

const mapPositionalToLabel = (argument: {
  name: string;
  alias?: Argument["alias"];
}): string =>
  pipe<string[], string[], string[], string>(
    () => [],
    append(`${argument.name}`),
    argument.alias !== undefined ? append(`-${argument.alias}`) : identity,
    wrap("<", " | ", ">")
  )();

const schemaToUsageDescription = (
  schema: Readonly<Schema>,
  cliName: string
): string => {
  return [
    cliName,
    schema.arguments &&
      Object.entries(schema.arguments).map(([name, argument]) =>
        mapArgumentToLabel({
          ...argument,
          name: argument.name ?? name,
        })
      ),
    schema.options &&
      Object.entries(schema.options).map(([name, argument]) =>
        mapArgumentToLabel({
          ...argument,
          name: argument.name ?? name,
        })
      ),
    ...(schema.positionals ?? []).map((positional) =>
      mapPositionalToLabel({
        ...positional,
        name: positional.name ?? positional.type,
      })
    ),
  ]
    .filter((section) => section)
    .join(" ")
    .trim();
};

const mapSchemaUsageToHelp = (
  schema: Schema,
  cliName: string
): [Header, ...OptionList[]] => {
  const schemaDescription = schema.description ?? "";

  const header: Header = {
    header: cliName,
    content: (
      schemaDescription +
      `\nUsage: ${schemaToUsageDescription(schema, cliName)}`
    ).trim(),
  };

  const optionList = [
    schema.positionals && {
      header: "Positionals",
      optionList: schema.positionals.map(({ type, description, name }) => ({
        typeLabel: type,
        description,
        name: name ?? type,
      })),
    },
    schema.arguments && {
      header: "Arguments",
      optionList: Object.entries(schema.arguments).map(
        ([argumentName, argument]) => ({
          typeLabel: argument.type,
          name: argument.name ?? argumentName,
          description: argument.description,
          alias: argument.alias,
        })
      ),
    },
    schema.options && {
      header: "Options",
      optionList: Object.entries(schema.options).map(
        ([argumentName, argument]) => ({
          typeLabel: argument.type,
          name: argument.name ?? argumentName,
          description: argument.description,
          alias: argument.alias,
        })
      ),
    },
  ].filter((section) => section) as OptionList[];

  return [header, ...optionList];
};

export default mapSchemaUsageToHelp;
