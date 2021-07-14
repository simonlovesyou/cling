type TypeName = "boolean" | "integer" | "null" | "number" | "string";

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

export type Argument =
  {
      type: "array";
      name?: string;
      items?: Argument | readonly Argument[];
      description?: string;
      alias?: string;
      minItems?: number;
      maxItems?: number;
      uniqueItems?: boolean;
    } | {
      type: TypeName;
      name?: string;
      description?: string;
      alias?: string;
    };

export interface CommandSchema {
  commands?: Record<string, Schema>;
}

export interface Options {
  positionals?: boolean;
  argv?: string[];
  coerceTypes?: boolean;
}

export default Schema;
