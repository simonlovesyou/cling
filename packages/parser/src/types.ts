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
  positionals?: Argument[] /* | Argument */;
  arguments?: Record<string, Argument>;
  options?: Record<string, Argument>;
};

export default Schema;
