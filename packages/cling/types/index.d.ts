declare module "@cling/parser" {
  type TypeName = "boolean" | "integer" | "null" | "number" | "string";

  interface Schema {
    description?: string;
    positionals?: readonly Argument[];
    arguments?: Record<string, Argument>;
    options?: Record<string, Argument>;
  }

  export type ValueRepresentation<T = unknown> = 
    {
      valid: true;
      value: T;
    } | {
    error: Error;
    valid: false;
    value: T;
  };

  export interface CommandSchema {
    commands: Record<string, Schema>;
  }

  interface ArrayArgument {
    alias?: string;
    description?: string;
    items?: Argument | readonly Argument[];
    maxItems?: number;
    minItems?: number;
    type: "array";
    uniqueItems?: boolean;
  }

  interface RegularArgument {
    alias?: string;
    description?: string;
    type: TypeName;
  }

  export type Argument = ArrayArgument | RegularArgument;

  export interface Options {
    positionals?: boolean;
    argv?: string[];
    coerceTypes?: boolean;
  }

  export interface ArgumentResult {
    arguments?: Record<string, ValueRepresentation>;
    options?: Record<string, ValueRepresentation<unknown | undefined>>;
    positionals?: ValueRepresentation<readonly unknown[]>;
    commands?: undefined;
  }

  function declarativeCliParser<T extends CommandSchema | Schema> (
    inputSchema: T,
    libraryOptions?: Options
  ): T extends Schema ? ArgumentResult : CommandSchema;

  export default declarativeCliParser;
}
