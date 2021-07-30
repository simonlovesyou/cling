/* eslint-disable @typescript-eslint/no-magic-numbers */
import { pick, values, reduce, mergeDeepRight } from "ramda";
import randomstring from "randomstring";
import { Argument } from "./types";
import declarativeCliParser, { convertArgumentToJSONSchema } from ".";

// eslint-disable-next-line @typescript-eslint/ban-types
const mergeAllDeep = reduce(mergeDeepRight, {} as object);

const mergeArrays = <T extends unknown[][]>(arrs: T) => arrs.flat();

const SCHEMAS = {
  "single argument": {
    arguments: {
      age: {
        type: "number",
      },
    },
  },
  "single argument with enums": {
    arguments: {
      role: {
        type: "string",
        enum: ["user", "admin"],
      },
    },
  },
  "single option": {
    options: {
      email: {
        type: "string",
        format: "email",
      },
    },
  },
  "single boolean option": {
    options: {
      help: {
        type: "boolean",
      },
    },
  },
  "single positional": {
    positionals: [
      {
        type: "integer",
      },
    ],
  },
} as const;

const ARGVS = {
  "single argument": {
    valid: ["--age 25"],
    invalid: ["--age Bar"],
    "not provided": [] as string[],
  },
  "single argument with enums": {
    valid: ["--role user"],
    invalid: ["--role bar"],
    "not provided": [] as string[],
  },
  "single boolean option": {
    valid: ["--help"],
    invalid: ["--help=5"],
    "not provided": [] as string[],
  },
  "single option": {
    valid: ["--email alex@alex.com"],
    invalid: ["--email alex"],
    "not provided": [] as string[],
  },
  "single positional": {
    valid: ["5"],
    invalid: ["bar"],
    "not provided": [] as string[],
  },
};

const TEST_CASES = {
  "single argument": {
    valid: (schema: typeof SCHEMAS["single argument"], argv: string[]) => {
      describe("argument provided", () => {
        describe("correct type", () => {
          it("should return the argument", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments!.age).not.toBeUndefined();
          });
          it("should consider the argument valid", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments!.age.valid).toBe(true);
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments!.age.value).toBe(25);
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments!.age?.error).toBe(undefined);
          });
        });
      });
    },
    invalid: (schema: typeof SCHEMAS["single argument"], argv: string[]) => {
      describe("incorrect type", () => {
        it("should return that the argument is not valid", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.age.valid).toBe(false);
        });
        it("should return an error for the property", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.age?.error).toStrictEqual(
            new Error("age: type must be number")
          );
        });
      });
    },
    "not provided": (
      schema: typeof SCHEMAS["single argument"],
      argv: string[]
    ) => {
      describe("argument not provided", () => {
        it("should return the argument", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.age).not.toBeUndefined();
        });
        it("the argument should not be valid", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.age.valid).toBe(false);
        });
        it("has an argument error", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.age.error).toStrictEqual(
            new Error("age: value not provided")
          );
        });
      });
    },
  },
  "single argument with enums": {
    valid: (
      schema: typeof SCHEMAS["single argument with enums"],
      argv: string[]
    ) => {
      describe("argument provided", () => {
        describe("correct type", () => {
          it("should return the argument", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments!.role).not.toBeUndefined();
          });
          it("should consider the argument valid", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments!.role.valid).toBe(true);
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments!.role.value).toBe("user");
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments!.role?.error).toBe(undefined);
          });
        });
      });
    },
    invalid: (
      schema: typeof SCHEMAS["single argument with enums"],
      argv: string[]
    ) => {
      describe("incorrect type", () => {
        it("should return that the argument is not valid", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.role.valid).toBe(false);
        });
        it("should return an error for the property", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.role?.error).toStrictEqual(
            new Error(
              "role: enum must be equal to one of the allowed values: user, admin"
            )
          );
        });
      });
    },
    "not provided": (
      schema: typeof SCHEMAS["single argument with enums"],
      argv: string[]
    ) => {
      describe("argument not provided", () => {
        it("should return the argument", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.role).not.toBeUndefined();
        });
        it("the argument should not be valid", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.role.valid).toBe(false);
        });
        it("has an argument error", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments!.role.error).toStrictEqual(
            new Error("role: value not provided")
          );
        });
      });
    },
  },
  "single option": {
    valid: (schema: typeof SCHEMAS["single option"], argv: string[]) => {
      describe("option provided", () => {
        describe("correct type", () => {
          it("should return the argument", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.email).not.toBeUndefined();
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.email?.value).toBe("alex@alex.com");
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.email?.error).toBe(undefined);
          });
        });
      });
    },
    invalid: (schema: typeof SCHEMAS["single option"], argv: string[]) => {
      describe("option provided", () => {
        describe("incorrect type", () => {
          it("should return the argument", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.email).not.toBeUndefined();
          });
          it("should return the argument provided", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.email?.value).toBe("alex");
          });
          it("should return errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.email?.error).toStrictEqual(
              new Error('email: format must match format "email"')
            );
          });
        });
      });
    },
    "not provided": (
      schema: typeof SCHEMAS["single option"],
      argv: string[]
    ) => {
      describe("option not provided", () => {
        it("should not return the option", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.options!.email).toBeUndefined();
        });
      });
    },
  },
  "single positional": {
    valid: (schema: typeof SCHEMAS["single positional"], argv: string[]) => {
      describe("positional provided", () => {
        describe("correct type", () => {
          it("should return that the positional argument is valid", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.positionals!.valid).toBe(true);
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.positionals!.value[0]).toBe(5);
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.positionals!.error).toBe(undefined);
          });
        });
      });
    },
    invalid: (schema: typeof SCHEMAS["single positional"], argv: string[]) => {
      describe("positional provided", () => {
        describe("incorrect type", () => {
          it("should return the positional", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.positionals).not.toBeUndefined();
          });
          it("should return the positional value", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.positionals!.value[0]).toBe("bar");
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.positionals!.error).toStrictEqual(
              new Error("integer: type must be integer")
            );
          });
        });
      });
    },
    "not provided": (
      schema: typeof SCHEMAS["single positional"],
      argv: string[]
    ) => {
      describe("positional not provided", () => {
        it("should return the positional result", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.positionals).not.toBeUndefined();
        });
        it("the argument should not be valid", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.positionals!.valid).toBe(false);
        });
        it("has an argument error", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.positionals!.error).toStrictEqual(
            new Error("integer: value not provided")
          );
        });
      });
    },
  },
  "single boolean option": {
    valid: (
      schema: typeof SCHEMAS["single boolean option"],
      argv: string[]
    ) => {
      describe("option provided", () => {
        describe("correct type", () => {
          it("should return that the optional argument is valid", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.help!.valid).toBe(true);
          });
          it("should return the value", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.help!.value).toBe(true);
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.help.error).toBe(undefined);
          });
        });
      });
    },
    invalid: (
      schema: typeof SCHEMAS["single boolean option"],
      argv: string[]
    ) => {
      describe("option provided", () => {
        describe("incorrect type", () => {
          it("should return that the optional argument is invalid", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.help!.valid).toBe(false);
          });
          it("should return the value", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.help!.value).toBe("5");
          });
          it("should return errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options!.help.error).toStrictEqual(
              new Error("help: type must be boolean")
            );
          });
        });
      });
    },
    "not provided": (
      schema: typeof SCHEMAS["single boolean option"],
      argv: string[]
    ) => {
      describe("option not provided", () => {
        it("should not return the value", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.options?.help?.value).toBe(undefined);
        });
      });
    },
  },
};

const runTestScenarios = (keys: (keyof typeof SCHEMAS)[]) => {
  describe(keys.join(" & "), () => {
    describe("valid", () => {
      const argv = mergeArrays(
        values(pick(keys, ARGVS)).map((argument) => argument.valid)
      );
      const schema = mergeAllDeep(values(pick(keys, SCHEMAS)));
      values(pick(keys, TEST_CASES)).forEach((testCase) => {
        // @ts-expect-error schema will include additional keys not expected by the function signature
        testCase.valid(schema, argv.join(" ").split(" "));
      });
    });
    describe("invalid", () => {
      const argv = mergeArrays(
        values(pick(keys, ARGVS)).map((argument) => argument.invalid)
      );
      const schema = mergeAllDeep(values(pick(keys, SCHEMAS)));
      values(pick(keys, TEST_CASES)).forEach((testCase) => {
        // @ts-expect-error schema will include additional keys not expected by the function signature
        testCase.invalid(schema, argv.join(" ").split(" "));
      });
    });
    describe("not provided", () => {
      const argv = mergeArrays(
        values(pick(keys, ARGVS)).map((argument) => argument["not provided"])
      );
      const schema = mergeAllDeep(values(pick(keys, SCHEMAS)));
      values(pick(keys, TEST_CASES)).forEach((testCase) => {
        // @ts-expect-error schema will include additional keys not expected by the function signature
        testCase["not provided"](schema, argv.join(" ").split(" "));
      });
    });
  });
};

runTestScenarios(["single argument"]);
runTestScenarios(["single argument with enums"]);
runTestScenarios(["single option"]);
runTestScenarios(["single boolean option"]);
runTestScenarios(["single positional"]);
runTestScenarios(["single option", "single argument"]);
runTestScenarios(["single boolean option", "single argument"]);
runTestScenarios(["single boolean option", "single argument with enums"]);
runTestScenarios(["single positional", "single option", "single argument"]);
runTestScenarios([
  "single positional",
  "single option",
  "single argument with enums",
]);
runTestScenarios([
  "single positional",
  "single boolean option",
  "single argument",
]);
runTestScenarios([
  "single positional",
  "single option",
  "single boolean option",
  "single argument",
]);

describe("commands with positional", () => {
  const command = "foo";
  const value = randomstring.generate({ charset: "numeric", length: 8 });
  const schema = {
    commands: {
      [command]: {
        positionals: [
          {
            type: "number",
          },
        ] as const,
      },
    },
  } as const;
  const argv = [command, value];
  describe("with command provided", () => {
    describe("with valid positional provided", () => {
      const result = declarativeCliParser(schema, { argv });
      it("commands should be defined", () => {
        expect(result.commands).not.toBeUndefined();
      });
      it("commands.bar should be defined", () => {
        expect(result.commands[command]).not.toBeUndefined();
      });
      it(`commands.bar.positionals.value should be valid & ${Number(
        value
      )}`, () => {
        expect(result.commands[command].positionals!.valid).toBe(true);
        expect(result.commands[command].positionals!.value).toStrictEqual([
          Number(value),
        ]);
      });
    });
  });
});

describe("convertArgumentToJSONSchema", () => {
  describe("when there's a single type", () => {
    const argument: Argument & Record<string, unknown> = {
      type: "number",
      description: "foo bar",
    };
    it("should not throw", () => {
      expect(() => convertArgumentToJSONSchema(argument)).not.toThrowError(
        "Cannot convert JSON Schema to cling Argument with multiple types"
      );
    });
    it("should return the expected corresponding argument", () => {
      expect(convertArgumentToJSONSchema(argument)).toStrictEqual({
        type: "number",
        description: "foo bar",
      });
    });
    describe("array type", () => {
      const arrayArgument = {
        type: "array",
        items: {
          type: "string",
        },
      } as const;
      it("should return the expected corresponding array argument", () => {
        expect(convertArgumentToJSONSchema(arrayArgument)).toStrictEqual({
          type: "array",
          items: {
            type: "string",
          },
        });
      });
    });
    describe("string type", () => {
      describe("enum property", () => {
        const stringArgument = {
          type: "string",
          enum: ["lol"],
        } as const;
        it("should return the expected corresponding array argument", () => {
          expect(convertArgumentToJSONSchema(stringArgument)).toStrictEqual({
            type: "string",
            enum: ["lol"],
          });
        });
      });
    });
  });
});
