import declarativeCliParser from ".";
import { pick, mergeAll, values } from "ramda";
import randomstring from "randomstring";

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
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments.age).not.toBeUndefined();
          });
          it("should consider the argument valid", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments.age.valid).not.toBeUndefined();
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.arguments.age.value).toBe(25);
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-expect-error
            expect(result.arguments.age?.error).toBe(undefined);
          });
        });
      });
    },
    invalid: (schema: typeof SCHEMAS["single argument"], argv: string[]) => {
      describe("incorrect type", () => {
        it("should return that the argument is not valid", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments.age.valid).toBe(false);
        });
        it("should return an error for the property", () => {
          const result = declarativeCliParser(schema, { argv });
          // @ts-expect-error
          expect(result.arguments.age?.error).toEqual(
            new Error("type must be number")
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
          expect(result.arguments.age).not.toBeUndefined();
        });
        it("the argument should not be valid", () => {
          const result = declarativeCliParser(schema, { argv });
          expect(result.arguments.age.valid).toBe(false);
        });
        it("has an argument error", () => {
          const result = declarativeCliParser(schema, { argv });
          // @ts-expect-error
          expect(result.arguments.age.error).toEqual(
            new Error("value not provided")
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
            expect(result.options.email).not.toBeUndefined();
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options.email?.value).toBe("alex@alex.com");
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-expect-error
            expect(result.options.email?.error).toBe(undefined);
          });
        });
      });
    },
    invalid: (schema: typeof SCHEMAS["single option"], argv: string[]) => {
      describe("option provided", () => {
        describe("incorrect type", () => {
          it("should return the argument", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options.email).not.toBeUndefined();
          });
          it("should return the argument provided", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.options.email?.value).toBe("alex");
          });
          it("should return errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-expect-error
            expect(result.options.email?.error).toEqual(
              new Error('format must match format "email"')
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
          expect(result.options.email).toBeUndefined();
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
            expect(result.positionals.valid).toBe(true);
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.positionals.value[0]).toBe(5);
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-expect-error
            expect(result.positionals.error).toBe(undefined);
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
            expect(result.positionals.value[0]).toBe("bar");
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-expect-error
            expect(result.positionals.error).toEqual(
              new Error("type must be integer")
            );
          });
        });
      });
    },
    "not provided": () => {},
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
runTestScenarios(["single option", "single argument"]);
runTestScenarios(["single positional", "single option", "single argument"]);

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
      const res = declarativeCliParser(schema, { argv });
      it("commands should be defined", () => {
        expect(res.commands).not.toBeUndefined();
      });
      it("commands.bar should be defined", () => {
        expect(res.commands[command]).not.toBeUndefined();
      });
      it(`commands.bar.positionals.value should be valid & ${Number(
        value
      )}`, () => {
        expect(res.commands[command].positionals.valid).toBe(true);
        expect(res.commands[command].positionals.value).toEqual([
          Number(value),
        ]);
      });
    });
  });
});
