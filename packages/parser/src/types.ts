import { JSONSchema7TypeName } from "json-schema";

const navalFate = {
  name: "ship",
  description: "Naval Fate",
  commands: [
    {
      description: "Create a new ship",
      name: "new",
      arguments: {
        name: {
          $ref: "#/definitions/name",
        },
      },
    },
    {
      name: "move",
      description: "Move a ship",
      positionals: [
        {
          name: {
            $ref: "#/definitions/name",
          },
          x: {
            $ref: "#/definitions/x",
          },
          y: {
            $ref: "#/definitions/y",
          },
        },
      ],
      arguments: {
        speed: {
          type: "number",
          description: "Speed in knots",
        },
      },
      required: ["name", "x", "y"],
    },
    {
      name: "shoot",
      description: "Shoot with a ship",
      arguments: {
        x: {
          $ref: "#/definitions/x",
        },
        y: {
          $ref: "#/definitions/y",
        },
      },
    },
    {
      name: "set",
      description: "Set coordinates for a ship",
    },
    {
      name: "remove",
      description: "Remove a ship",
    },
  ],
  definitions: {
    name: {
      type: "string",
      description: "Ship name",
    },
    x: {
      type: "integer",
    },
    y: {
      type: "integer",
    },
  },
  options: {
    help: {
      type: "boolean",
      alias: "h",
    },
  },
};

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
  name?: string;
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
