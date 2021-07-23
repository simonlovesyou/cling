import { CommandSchema, Schema } from "@cling/parser";

declare module "@cling/parser" {
  export type ValueRepresentation<T = unknown> =
    | {
        error: Error;
        valid: false;
        value: T;
      }
    | {
        valid: true;
        value: T;
      };

  export interface ArgumentResult {
    arguments?: Record<string, ValueRepresentation>;
    options?: Record<string, ValueRepresentation<unknown | undefined>>;
    positionals?: ValueRepresentation<readonly unknown[]>;
    commands?: undefined;
  }

  export interface CommandResult {
    commands: Record<string, ArgumentResult>;
  }

  export interface Options {
    positionals?: boolean;
    argv?: string[];
    coerceTypes?: boolean;
  }

  export function declarativeCliParser<T extends CommandSchema | Schema>(
    inputSchema: T,
    libraryOptions?: Options
  ): T extends Schema ? ArgumentResult : CommandResult;
}
