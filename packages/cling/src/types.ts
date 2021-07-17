interface Schema {
  /** Description of the CLI */
  description?: string;
  /** Positional arguments. Needs to be provided in order */
  positionals?: readonly Argument[];
  /** Required arguments. Needs to be provided by name or alias */
  arguments?: Record<string, Argument>;
  /** Optionals arguments. Needs to be provided by name or alias */
  options?: Record<string, Argument>;
  commands?: undefined;
}

export type TypeName = "boolean" | "integer" | "null" | "number" | "string";

export interface BaseArgument<TType extends TypeName | "array"> {
  type: TType;
  description?: string;
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

export type StringArgument = BaseArgument<'string'> & EnumableArgument<string>;

export type NumberArgument = BaseArgument<'number'> & EnumableArgument<number>;

export type IntegerArgument = BaseArgument<'integer'> & EnumableArgument<number>;

export type NullArgument = BaseArgument<'null'>;

export type BooleanArgument = BaseArgument<"boolean">;

export type Argument =
  | ArrayArgument
  | BooleanArgument
  | IntegerArgument
  | NullArgument
  | NumberArgument
  | StringArgument;

export interface CommandSchema {
  commands?: Record<string, Schema>;
}

export interface Options {
  positionals?: boolean;
  argv?: string[];
  coerceTypes?: boolean;
}

export default Schema;
