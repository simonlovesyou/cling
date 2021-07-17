type TypeName = "boolean" | "integer" | "null" | "number" | "string";

interface Schema {
  description?: string;
  positionals?: readonly Argument[];
  arguments?: Record<string, Argument>;
  options?: Record<string, Argument>;
  commands?: undefined;
}

interface BaseArgument<TType extends TypeName | "array"> {
  type: TType;
  description?: string;
  alias?: string;
  format?: string;
  name?: string;
}

interface ArrayArgument extends BaseArgument<"array"> {
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
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  commands?: { [commandName: string]: Schema | undefined };
}

export interface Options {
  positionals?: boolean;
  argv?: string[];
  coerceTypes?: boolean;
}

export default Schema;
