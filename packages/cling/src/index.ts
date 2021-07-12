import parser from "@cling/parser";
import commandLineUsage from "command-line-usage";
import Schema, {
  Argument,
  Options,
  CommandSchema,
  ExpandRecursively,
} from "./types";
import mapSchemaUsageToHelp from "./utils/mapSchemaToUsageHelp";
import { mapObjIndexed, assocPath } from "ramda";

type ValueDeclaration<TValue extends any> =
  | {
      valid: false;
      error: Error;
      value: any;
    }
  | {
      valid: true;
      value: TValue;
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
  T["items"] extends readonly any[]
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

type ResultB = CoercedTypeObject<{
  type: "array";
  items: [{ type: "string" }];
}>;

type ParsedArguments<T> = {
  [Key in keyof T]: Key extends "options"
    ? {
        [ArgumentKey in keyof T[Key]]?: ValueDeclaration<unknown>;
      }
    : {
        [ArgumentKey in keyof T[Key]]: ValueDeclaration<unknown>;
      };
} &
  keyof T extends "positionals"
  ? {
      _all?: {
        __positionals__?: ValueDeclaration<unknown>;
      };
      __positionals__?: ValueDeclaration<unknown>;
    }
  : never;

type CoerceSchema<T extends Schema> = {
  [Key in keyof T]: Key extends "positionals"
    ?
        | { valid: true; value: CoercedTupleOf<NonNullable<T["positionals"]>> }
        | { valid: false; error: Error; value: any }
    : Key extends "options"
    ? {
        [ArgumentKey in keyof T[Key]]?: CoercedTypeObject<
          NonNullable<T["options"]>[ArgumentKey]
        >;
      }
    : Key extends "arguments"
    ? {
        [ArgumentKey in keyof T[Key]]: CoercedTypeObject<
          NonNullable<T[Key]>[ArgumentKey]
        >;
      }
    : never;
};

const addHelpOption = (schema: Schema): Schema =>
  assocPath(["options", "help"], { alias: "h", type: "boolean" }, schema);

const cling = <T extends Schema | CommandSchema>(
  schema: T,
  libOptions: Options
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
> => {
  if (schema.commands) {
    const commandSchema = schema as CommandSchema;
    // @ts-ignore
    return {
      commands: mapObjIndexed((command, commandName) => {
        // @ts-ignore
        return cling(command, {
          ...libOptions,
          argv:
            libOptions.argv &&
            libOptions.argv.filter((arg: string) => arg !== commandName),
        });
        // @ts-ignore
      })(schema.commands),
    };
  }
  let parsedArguments = null
  try {
    parsedArguments = parser(schema, libOptions);
  } catch(error) {
    // @ts-ignore
    return null
  }

  try {
    // @ts-ignore
    return mapObjIndexed((argument, name) => {
      if (name === "positionals") {
        // @ts-ignore
        if (argument.valid) {
          // @ts-ignore
          return argument.value;
        }
        // @ts-ignore
        throw argument.error;
      }
      return mapObjIndexed((valueDeclaration: ValueDeclaration<unknown>) => {
        if (valueDeclaration.valid === true) {
          return valueDeclaration.value;
        }
        throw valueDeclaration.error;
        // @ts-ignore
      })(argument);
    })(parsedArguments);
  } catch (error) {
    console.error(error.message);
    return process.exit(1);
  }
};

export default cling;
