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
      description?: string;
      alias?: string;
    }
  | {
      type: "array";
      items?: readonly Argument[] | Argument;
      description?: string
      alias?: string
      minItems?: number;
      maxItems?: number;
      uniqueItems?: boolean;
    };

type Schema = {
  description?: string;
  positionals?: readonly Argument[];
  arguments?: Record<string, Argument>;
  options?: Record<string, Argument>;
  commands?: undefined;
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
