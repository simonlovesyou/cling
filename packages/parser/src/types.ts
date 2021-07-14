type TypeName = "boolean" | "integer" | "null" | "number" | "string";

interface Schema {
  description?: string;
  positionals?: readonly Argument[];
  arguments?: Record<string, Argument>;
  options?: Record<string, Argument>;
  commands?: undefined;
}

export type Argument =
  {
      type: "array";
      items?: Argument | readonly Argument[];
      description?: string;
      alias?: string;
      minItems?: number;
      maxItems?: number;
      uniqueItems?: boolean;
    } | {
      type: TypeName;
      description?: string;
      alias?: string;
    };

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
