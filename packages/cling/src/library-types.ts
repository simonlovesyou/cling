import Schema, {
  Argument,
  Options,
  CommandSchema,
} from "./types";

// expands object types recursively
export type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

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
  }
> = T["items"] extends readonly any[]
  ? CoercedTupleOf<T["items"]>
  : T["items"] extends Argument
  ? CoercedTypeObject<T["items"]>[]
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
        | {
            valid: true;
            value: CoercedTupleOf<NonNullable<T["positionals"]>>;
          }
        | {
            valid: false;
            error: Error;
            value: any;
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

declare const cling: <T extends Schema | CommandSchema>(
  schema: T,
  libOptions: Options
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
