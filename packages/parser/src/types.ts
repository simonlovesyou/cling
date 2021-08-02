interface Schema {
  positionals?: readonly Argument[];
  arguments?: Record<string, Argument>;
  options?: Record<string, Argument>;
  commands?: undefined;
}

export type TypeName =
  | "array"
  | "boolean"
  | "integer"
  | "null"
  | "number"
  | "string";

export interface FormattableArgument {
  format?: string;
}

export interface BaseArgument<TType extends TypeName> {
  type: TType;
  alias?: string;
  format?: string;
  name?: string;
}

export interface ArrayArgument extends BaseArgument<"array"> {
  items?: Argument | readonly Argument[];
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

export interface EnumableArgument<TEnumType extends number | string> {
  enum?: readonly TEnumType[];
}

export type StringArgument = BaseArgument<"string"> &
  EnumableArgument<string> &
  FormattableArgument;

export type NumberArgument = BaseArgument<"number"> &
  EnumableArgument<string> &
  FormattableArgument;

export type IntegerArgument = BaseArgument<"integer"> &
  EnumableArgument<number> &
  FormattableArgument;

export type NullArgument = BaseArgument<"null">;

export type BooleanArgument = BaseArgument<"boolean">;

export type Argument =
  | ArrayArgument
  | BooleanArgument
  | IntegerArgument
  | NullArgument
  | NumberArgument
  | StringArgument;

export interface CommandSchema {
  commands?: Record<string, Schema | undefined>;
}

export interface Options {
  positionals?: boolean;
  argv?: string[];
  coerceTypes?: boolean;
}

export default Schema;
