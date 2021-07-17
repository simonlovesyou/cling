import Schema, { Argument, Options, CommandSchema, EnumableArgument } from "./types";

// expands object types recursively
type ExpandRecursively<T> = T extends Record<number | string | symbol, unknown>
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

declare type CoercedType<T> = T extends "string" ? string : T extends "number" ? number : T extends "integer" ? number : T extends "boolean" ? boolean : T extends "null" ? null : never;
declare type CoerceArrayType<T extends Argument & {
    type: "array";
}> = T["items"] extends readonly Argument[] ? CoercedTupleOf<T["items"]> : T["items"] extends Argument ? CoercedTypeObject<T["items"]>[] : unknown[];
declare type CoercedTypeObject<T extends Argument> = T["type"] extends "array" ? CoerceArrayType<T & {
    type: "array";
}> : T extends EnumableArgument<number | string> ? CoerceEnumType<T> : CoercedType<T[keyof T]>;

declare type CoerceEnumType<T extends EnumableArgument<number | string>> = T['enum'] extends readonly (number | string)[] ? T['enum'][number] : CoercedType<T[keyof T]>;

declare type CoercedTupleOf<T extends readonly Argument[]> = {
    [Key in keyof T]: T[Key] extends Argument ? CoercedType<T[Key]['type']> : never
};
declare type CoerceSchema<T extends Schema> = {
    [Key in keyof T]: Key extends "positionals" ? {
        valid: false;
        error: Error;
        value: unknown;
    } | {
        valid: true;
        value: CoercedTupleOf<NonNullable<T["positionals"]>>;
    } : Key extends "options" ? {
        [ArgumentKey in keyof T[Key]]?: {
            valid: false;
            error: Error;
            value: unknown;
        } | {
            valid: true;
            value?: CoercedTypeObject<NonNullable<T["options"]>[ArgumentKey]>;
        };
    } : Key extends "arguments" ? {
        [ArgumentKey in keyof T[Key]]: {
            valid: false;
            error: Error;
            value: unknown;
        } | {
            valid: true;
            value: CoercedTypeObject<NonNullable<T[Key]>[ArgumentKey]>;
        };
    } : never;
};
declare function declarativeCliParser<T extends CommandSchema | Schema> (inputSchema: T, libraryOptions?: Options): ExpandRecursively<T extends Schema ? CoerceSchema<T> : T extends CommandSchema ? {
    commands: {
        [NestedKey in keyof T["commands"]]: CoerceSchema<T["commands"][NestedKey]>;
    };
} : never>;
export { Schema, Argument };
export default declarativeCliParser;
