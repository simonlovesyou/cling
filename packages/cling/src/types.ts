import {
  ArrayArgument as ParserArrayArgument,
  BooleanArgument as ParserBooleanArgument,
  CommandSchema as ParserCommandSchema,
  IntegerArgument as ParserIntegerArgument,
  EnumableArgument as ParserEnumableArgument,
  NullArgument as ParserNullArgument,
  NumberArgument as ParserNumberArgument,
  Schema as ParserSchema,
  StringArgument as ParserStringArgument,
} from "@cling/parser";

export type TypeName = "boolean" | "integer" | "null" | "number" | "string";

export interface MetaProperties {
  description?: string;
}

export type ArrayArgument = MetaProperties & ParserArrayArgument;

export type StringArgument = MetaProperties & ParserStringArgument;

export type NumberArgument = MetaProperties & ParserNumberArgument;

export type IntegerArgument = MetaProperties & ParserIntegerArgument;

export type NullArgument = MetaProperties & ParserNullArgument;

export type BooleanArgument = MetaProperties & ParserBooleanArgument;

export type EnumableArgument<TEnumType extends number | string> =
  MetaProperties & ParserEnumableArgument<TEnumType>;

export type Argument =
  | ArrayArgument
  | BooleanArgument
  | IntegerArgument
  | NullArgument
  | NumberArgument
  | StringArgument;

export interface Schema extends ParserSchema {
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

export interface CommandSchema extends ParserCommandSchema {
  description?: string;
  commands?: Record<string, Schema>;
  options?: Record<string, Argument>;
}

export interface Options {
  positionals?: boolean;
  argv?: string[];
  coerceTypes?: boolean;
}
