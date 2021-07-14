import Schema, {
  Argument,
  Options,
  CommandSchema,
} from "./types";

declare type CoercedType<T> = T extends "string"
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

declare type CoerceArrayType<
  T extends Argument & {
    type: "array";
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = T["items"] extends readonly any[]
  ? CoercedTupleOf<T["items"]>
  : T["items"] extends Argument
  ? CoercedTypeObject<T["items"]>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : any[];

declare type CoercedTypeObject<T extends Argument> = T["type"] extends "array"
  ? CoerceArrayType<
      T & {
        type: "array";
      }
    >
  : CoercedType<T[keyof T]>;

declare type CoercedTupleOf<T extends readonly Argument[]> = {
  [Key in keyof T]: keyof T[Key] extends "type"
    ? CoercedType<T[Key][keyof T[Key]]>
    : never;
};

declare type CoerceSchema<T extends Schema> = {
  [Key in keyof T]: Key extends "positionals"
    ?
        {
            valid: false;
            error: Error;
            value: unknown;
          } | {
            valid: true;
            value: CoercedTupleOf<NonNullable<T["positionals"]>>;
          }
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

// expands object types recursively
type ExpandRecursively<T> = T extends Record<string, unknown>
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

declare const cling: <T extends CommandSchema | Schema>(
  schema: T,
  libraryOptions: Options
) => ExpandRecursively<
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
>;

export default cling;
