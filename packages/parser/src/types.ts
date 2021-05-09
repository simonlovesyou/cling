export type Argument = {
  $ref?: string;
  type?:
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

export type Definitions = { [definitionName: string]: Argument };

type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

type Schema = {
  $ref?: string;
  description?: string;
  commands?: Record<string, Schema>;
  positionals?: Argument[] /* | Argument */;
  arguments?: Record<string, Argument>;
  options?: Record<string, Argument>;
  definitions?: Definitions;
};

export default Schema;
