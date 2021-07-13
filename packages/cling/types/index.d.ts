declare module "@cling/parser" {
  type TypeName = "string" | "number" | "integer" | "boolean" | "null";

  type Schema = {
    description?: string;
    positionals?: readonly Argument[];
    arguments?: Record<string, Argument>;
    options?: Record<string, Argument>;
  };

  export type ValueRepresentation =
    | {
        valid: true;
        value: any;
      }
    | {
        valid: false;
        error: Error;
        value: any;
      };

  export type CommandSchema = {
    commands: Record<string, Schema>;
  };
  export type Argument =
    | {
        type: TypeName;
        description?: string;
        alias?: string;
      }
    | {
        type: "array";
        items?: readonly Argument[] | Argument;
        description?: string;
        alias?: string;
        minItems?: number;
        maxItems?: number;
        uniqueItems?: boolean;
      };

  export type Options = {
    positionals?: boolean;
    argv?: string[];
    coerceTypes?: boolean;
  };

  export type ArgumentResult = {
    arguments?: {
      [x: string]: ValueRepresentation;
    };
    options?: {
      [x: string]: ValueRepresentation;
    };
    positionals: ValueRepresentation;
    commands?: undefined;
  };

  function declarativeCliParser<T extends Schema | CommandSchema>(
    inputSchema: T,
    libOptions?: Options
  ): T extends Schema ? ArgumentResult : CommandSchema;

  export default declarativeCliParser;
}
