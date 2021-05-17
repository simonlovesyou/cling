// expands object types recursively
export type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;


export type Argument = {
  type:
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "object"
    | "array"
    | "null";
  description?: string;
  alias?: string;
};

type Schema = {
  description?: string;
  commands?: Record<string, Schema>;
  positionals?: readonly Argument[] /* | Argument */;
  arguments?: Record<string, Argument>;
  options?: Record<string, Argument>;
};

export type Options = {
  positionals?: boolean;
  argv?: string[];
  coerceTypes?: boolean;
};

export default Schema;
