import Schema, { Argument } from "../types";
import { OptionList } from "command-line-usage";
import { append, identity, pipe } from "ramda";

type Header = {
  header: string;
  content: string;
};

const wrap =
  (prefix: string, joinString: string, affix: string) =>
  (stringArray: string[]): string =>
    `${prefix}${stringArray.join(joinString)}${affix}`;

const mapArgumentToLabel = (argument: Argument): string =>
  pipe<string[], string[], string[], string>(
    () => [],
    append(`--${argument.name}`),
    argument.alias ? append(`-${argument.alias}`) : identity,
    wrap("[", " | ", "]")
  )();

const mapPositionalToLabel = (argument: Argument): string =>
  pipe<string[], string[], string[], string>(
    () => [],
    append(`${argument.name}`),
    argument.alias ? append(`-${argument.alias}`) : identity,
    wrap("<", " | ", ">")
  )();

const schemaToUsageDescription = (schema: Schema, cliName: string): string => {
  return [
    cliName,
    Object.entries(schema.arguments || {}).map(([name, argument]) =>
      mapArgumentToLabel({
        ...argument,
        name: argument.name || name,
      })
    ),
    Object.entries(schema.options || {}).map(([name, argument]) =>
      mapArgumentToLabel({
        ...argument,
        name: argument.name || name,
      })
    ),
    ...(schema.positionals || []).map((positional) =>
      mapPositionalToLabel({
        ...positional,
        name: positional.name || positional.type,
      })
    ),
  ]
    .join(" ")
    .trim();
};

const mapSchemaUsageToHelp = (
  schema: Schema,
  cliName: string
): [Header, ...OptionList[]] => {
  const schemaDescription = schema.description || "";

  const header: Header = {
    header: cliName,
    content: (
      schemaDescription +
      `\nUsage: ${schemaToUsageDescription(schema, cliName)}`
    ).trim(),
  };

  const optionList = [
    schema.positionals && [
      {
        header: "Positionals",
        optionList: schema.positionals.map(({ type, description, name }) => ({
          typeLabel: type,
          description,
          name: name || type,
        })),
      },
    ],
    schema.arguments && {
      header: "Arguments",
      optionList: Object.entries(schema.arguments).map(
        ([argumentName, argument]) => ({
          typeLabel: argument.type,
          name: argument.name || argumentName,
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
          name: argument.name || argumentName,
          description: argument.description,
          alias: argument.alias,
        })
      ),
    },
  ].filter((section) => section) as OptionList[];

  return [header, ...optionList];
};

export default mapSchemaUsageToHelp;
