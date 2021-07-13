import cling from ".";
import { pick, mergeAll, values } from "ramda";
import randomstring from "randomstring";
import mockConsole from "jest-mock-console";
import dedent from "dedent";

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
  .mockImplementation((number: number | undefined) => undefined as never);

const mergeArrays = <T extends any[][]>(arrs: T) =>
  arrs.reduce((acc, arr) => [...acc, ...arr], []);

const SCHEMAS = {
  "single argument": {
    arguments: {
      age: {
        type: "number",
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
  "single positional": {
    valid: (schema: typeof SCHEMAS["single positional"], argv: string[]) => {
      describe("positional provided", () => {
        describe("correct type", () => {
          it("should return the value", () => {
            const result = cling(schema, { argv });
            expect(result.positionals).toEqual([5]);
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

const ARGVS = {
  "single argument": {
    valid: ["--age 25"],
    invalid: ["--age Bar"],
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

const runTestScenarios = (keys: (keyof typeof SCHEMAS)[]) => {
  describe(keys.join(" & "), () => {
    describe("valid", () => {
      const argv = mergeArrays(
        values(pick(keys, ARGVS)).map((arg) => arg.valid)
      );
      const schema = mergeAll(values(pick(keys, SCHEMAS)));
      values(pick(keys, TEST_CASES)).forEach((testCase) => {
        // @ts-ignore
        testCase.valid(schema, argv.join(" ").split(" "));
      });
    });
    describe("invalid", () => {
      const argv = mergeArrays(
        values(pick(keys, ARGVS)).map((arg) => arg.invalid)
      );
      const schema = mergeAll(values(pick(keys, SCHEMAS)));
      values(pick(keys, TEST_CASES)).forEach((testCase) => {
        // @ts-ignore
        testCase.invalid(schema, argv.join(" ").split(" "));
      });
    });
    describe("not provided", () => {
      const argv = mergeArrays(
        values(pick(keys, ARGVS)).map((arg) => arg["not provided"])
      );
      const schema = mergeAll(values(pick(keys, SCHEMAS)));
      values(pick(keys, TEST_CASES)).forEach((testCase) => {
        // @ts-ignore
        testCase["not provided"](schema, argv.join(" ").split(" "));
      });
    });
  });
};

runTestScenarios(["single argument"]);
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
      const res = cling(schema, { argv });
      it("commands should be defined", () => {
        expect(res.commands).not.toBeUndefined();
      });
      it("commands.bar should be defined", () => {
        expect(res.commands[command]).not.toBeUndefined();
      });
      it(`commands.bar.positionals.value should be valid & ${Number(
        value
      )}`, () => {
        expect(res.commands[command].positionals).toEqual([Number(value)]);
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

    // @ts-expect-error
    expect(stripAnsi(console.log.mock.calls[0][0])).toStrictEqual(dedent`
    test

      Usage: test [--bar | -b]  <integer> <integer> 


    Arguments

      -b, --bar string   Foo bar
    `);
  });
});
