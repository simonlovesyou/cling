/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-magic-numbers */
import { pick, mergeAll, values } from "ramda";
import randomstring from "randomstring";
import mockConsole from "jest-mock-console";
import dedent from "dedent";
import cling from ".";

// Taken from `ansi-regex`
// License: MIT
const ANSI_PATTERN = [
  "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
  "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
].join("|");

const stripAnsi = (string: string) =>
  string.replace(new RegExp(ANSI_PATTERN, "g"), "");

const exit = jest
  .spyOn(process, "exit")
  .mockImplementation(() => undefined as never);

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
      exitCode: {
        type: "integer",
        enum: [0, 1],
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
    valid: ["--exitCode 1"],
    invalid: ["--exitCode 2"],
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
            const result = cling(schema, { argv });
            expect(result.arguments!.age).not.toBeUndefined();
          });
          it("should coerce the type", () => {
            const result = cling(schema, { argv });
            expect(result.arguments!.age).toBe(25);
          });
          it("should not return any errors for the property", () => {
            expect(() => cling(schema, { argv })).not.toThrow();
          });
        });
      });
    },
    invalid: (schema: typeof SCHEMAS["single argument"], argv: string[]) => {
      describe("incorrect type", () => {
        it("should exit the process with 1", () => {
          cling(schema, { argv });
          expect(exit).toHaveBeenCalledWith(1);
        });
        it("should log the error to stdout", () => {
          const restoreConsole = mockConsole();
          cling(schema, { argv });
          expect(console.error).toHaveBeenCalledWith(
            "age: type must be number"
          );
          restoreConsole();
        });
      });
    },
    "not provided": (
      schema: typeof SCHEMAS["single argument"],
      argv: string[]
    ) => {
      describe("argument not provided", () => {
        it("should exit the process with 1", () => {
          cling(schema, { argv });
          expect(exit).toHaveBeenCalledWith(1);
        });
        it("should log the error to stdout", () => {
          const restoreConsole = mockConsole();
          cling(schema, { argv });
          expect(console.error).toHaveBeenCalledWith("age: value not provided");
          restoreConsole();
        });
      });
    },
  },
  "single option": {
    valid: (schema: typeof SCHEMAS["single option"], argv: string[]) => {
      describe("option provided", () => {
        describe("correct type", () => {
          it("should return the value", () => {
            const result = cling(schema, { argv });
            expect(result.options!.email).toBe("alex@alex.com");
          });
          it("should not return any errors for the property", () => {
            const result = cling(schema, { argv });
            // @ts-expect-error If the test works as it should then the whole dot chain should be present
            expect(result.options!.email?.error).toBe(undefined);
          });
        });
      });
    },
    invalid: (schema: typeof SCHEMAS["single option"], argv: string[]) => {
      describe("option provided", () => {
        describe("incorrect type", () => {
          it("should exit the process with 1", () => {
            cling(schema, { argv });
            expect(exit).toHaveBeenCalledWith(1);
          });
          it("should log the error to stdout", () => {
            const restoreConsole = mockConsole();
            cling(schema, { argv });
            expect(console.error).toHaveBeenCalledWith(
              'email: format must match format "email"'
            );
            restoreConsole();
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
          const result = cling(schema, { argv });
          expect(result.options!.email).toBeUndefined();
        });
        it("should not throw", () => {
          expect(() => cling(schema, { argv })).not.toThrow();
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
            const result = cling(schema, { argv });
            expect(result.arguments!.exitCode).not.toBeUndefined();
          });
          it("should coerce the type", () => {
            const result = cling(schema, { argv });
            expect(result.arguments!.exitCode).toBe(1);
          });
          it("should not return any errors for the property", () => {
            expect(() => cling(schema, { argv })).not.toThrow();
          });
        });
      });
    },
    invalid: (
      schema: typeof SCHEMAS["single argument with enums"],
      argv: string[]
    ) => {
      describe("incorrect type", () => {
        it("should exit the process with 1", () => {
          cling(schema, { argv });
          expect(exit).toHaveBeenCalledWith(1);
        });
        it("should log the error to stdout", () => {
          const restoreConsole = mockConsole();
          cling(schema, { argv });
          expect(console.error).toHaveBeenCalledWith(
            "exitCode: enum must be equal to one of the allowed values: 0, 1"
          );
          restoreConsole();
        });
      });
    },
    "not provided": (
      schema: typeof SCHEMAS["single argument with enums"],
      argv: string[]
    ) => {
      describe("argument not provided", () => {
        it("should exit the process with 1", () => {
          cling(schema, { argv });
          expect(exit).toHaveBeenCalledWith(1);
        });
        it("should log the error to stdout", () => {
          const restoreConsole = mockConsole();
          cling(schema, { argv });
          expect(console.error).toHaveBeenCalledWith(
            "exitCode: value not provided"
          );
          restoreConsole();
        });
      });
    },
  },
  "single positional": {
    valid: (schema: typeof SCHEMAS["single positional"], argv: string[]) => {
      describe("positional provided", () => {
        describe("correct type", () => {
          it("should return the value", () => {
            const result = cling(schema, { argv });
            expect(result.positionals).toStrictEqual([5]);
          });
          it("should not throw", () => {
            expect(() => cling(schema, { argv })).not.toThrow();
          });
        });
      });
    },
    invalid: (schema: typeof SCHEMAS["single positional"], argv: string[]) => {
      describe("positional provided", () => {
        describe("incorrect type", () => {
          it("should exit the process with 1", () => {
            cling(schema, { argv });
            expect(exit).toHaveBeenCalledWith(1);
          });
          it("should log the error to stdout", () => {
            const restoreConsole = mockConsole();
            cling(schema, { argv });
            expect(console.error).toHaveBeenCalledWith(
              "integer: type must be integer"
            );
            restoreConsole();
          });
        });
      });
    },
    "not provided": (
      schema: typeof SCHEMAS["single positional"],
      argv: string[]
    ) => {
      describe("positional not provided", () => {
        it("should exit the process with 1", () => {
          cling(schema, { argv });
          expect(exit).toHaveBeenCalledWith(1);
        });
        it("should log the error to stdout", () => {
          const restoreConsole = mockConsole();
          cling(schema, { argv });
          expect(console.error).toHaveBeenCalledWith(
            "integer: value not provided"
          );
          restoreConsole();
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
      const schema = mergeAll(values(pick(keys, SCHEMAS)));
      values(pick(keys, TEST_CASES)).forEach((testCase) => {
        // @ts-expect-error schema will include additional keys not expected by the function signature
        testCase.valid(schema, argv.join(" ").split(" "));
      });
    });
    describe("invalid", () => {
      const argv = mergeArrays(
        values(pick(keys, ARGVS)).map((argument) => argument.invalid)
      );
      const schema = mergeAll(values(pick(keys, SCHEMAS)));
      values(pick(keys, TEST_CASES)).forEach((testCase) => {
        // @ts-expect-error schema will include additional keys not expected by the function signature
        testCase.invalid(schema, argv.join(" ").split(" "));
      });
    });
    describe("not provided", () => {
      const argv = mergeArrays(
        values(pick(keys, ARGVS)).map((argument) => argument["not provided"])
      );
      const schema = mergeAll(values(pick(keys, SCHEMAS)));
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
runTestScenarios(["single positional"]);

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
      const result = cling(schema, { argv });
      it("commands should be defined", () => {
        expect(result.commands).not.toBeUndefined();
      });
      it("commands.bar should be defined", () => {
        expect(result.commands[command]).not.toBeUndefined();
      });
      it(`commands.bar.positionals.value should be valid & ${Number(
        value
      )}`, () => {
        expect(result.commands[command].positionals).toStrictEqual([
          Number(value),
        ]);
      });
    });
  });
});

describe("schema without --help argument", () => {
  const schema = {
    arguments: {
      bar: {
        type: "string",
        description: "Foo bar",
        alias: "b",
      },
    },
    positionals: [
      {
        type: "integer",
      },
      {
        type: "integer",
      },
    ],
  } as const;
  it("should output the help program", () => {
    mockConsole();
    cling(schema, { argv: ["--help"] });

    const log = console.log as jest.Mock;

    const mockCalls = log.mock.calls as unknown[][];

    expect(stripAnsi(mockCalls[0][0] as string)).toStrictEqual(dedent`
    test

    Usage: test [--bar | -b] <integer> <integer>

  Positionals

    --integer integer
    --integer integer

  Arguments

    -b, --bar string   Foo bar
    `);
  });
});
