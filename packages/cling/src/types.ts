// expands object types recursively
export type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

type TypeName = "string" | "number" | "integer" | "boolean" | "null";

export type Argument =
  | {
      type: TypeName;
      name?: string;
      description?: string;
      alias?: string;
    }
  | {
      type: "array";
      name?: string;
      items?: readonly Argument[] | Argument;
      description?: string;
      alias?: string;
      minItems?: number;
      maxItems?: number;
      uniqueItems?: boolean;
    };

type Schema = {
  /** Description of the CLI */
  description?: string;
  /** Positional arguments. Needs to be provided in order */
  positionals?: readonly Argument[];
  /** Required arguments. Needs to be provided by name or alias */
  arguments?: Record<string, Argument>;
  /** Optionals arguments. Needs to be provided by name or alias */
  options?: Record<string, Argument>;
  commands?: undefined
}

export type CommandSchema = {
  commands?: Record<string, Schema>;
}

export type Options = {
  positionals?: boolean;
  argv?: string[];
  coerceTypes?: boolean;
};

export default Schema;
