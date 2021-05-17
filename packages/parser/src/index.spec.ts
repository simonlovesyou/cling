import declarativeCliParser from ".";
import Schema, { CommandSchema } from "./types";
import { mergeDeepRight, pipe } from "ramda";
import randomstring from "randomstring";

type Scenario = {
  schema: Schema | CommandSchema;
  argv: string[];
  testCase: (schema: Schema, argv: string[]) => any;
  name?: string;
};

const SCENARIOS: Record<string, Scenario> = {
  "single argument": {
    schema: {
      arguments: {
        age: {
          type: "number" as "number",
        },
      },
    },
    argv: "--age 25".split(" "),
    testCase: (schema, argv) => {
      describe("argument provided", () => {
        describe("correct type", () => {
          it("should return the argument", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.arguments!.age).not.toBeUndefined();
          });
          it("should consider the argument valid", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.arguments!.age.valid).not.toBeUndefined();
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.arguments!.age.value).toBe(25);
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.arguments!.age.error).toBe(undefined);
          });
        });
        describe("incorrect type", () => {
          const argv = "--age lol".split(" ");
          it("should return that the argument is not valid", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.arguments!.age.valid).toBe(false);
          });
          it("should return an error for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.arguments!.age.error).toEqual(
              new Error("type must be number")
            );
          });
        });
      });
    },
  },
  "single option": {
    schema: {
      options: {
        name: {
          type: "string" as "string",
        },
      },
    },
    argv: "--name Alex".split(" "),
    testCase: (schema, argv) => {
      describe("option provided", () => {
        describe("correct type", () => {
          it("should return the argument", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.options!.name).not.toBeUndefined();
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.options!.name.value).toBe("Alex");
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.options!.name.error).toBe(undefined);
          });
        });
      });
    },
  },
  "single positional": {
    schema: {
      positionals: [
        {
          type: "integer",
        },
      ],
    },
    argv: ["5"],
    testCase: (schema, argv) => {
      describe("positional provided", () => {
        describe("correct type", () => {
          it("should return that the positional argument is valid", () => {
            const result = declarativeCliParser(schema, { argv });
            console.log(result);
            // @ts-expect-error
            expect(result.positionals.valid).toBe(true);
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-expect-error
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
  },
};

const mergeSchemas = (
  schemaA: Schema | CommandSchema,
  schemaB: Schema | CommandSchema
) => mergeDeepRight(schemaA, schemaB);

const runTestScenarios = (scenarioNames: string[]) => {
  const scenarios = Object.entries(SCENARIOS).reduce(
    (acc: Scenario[], [scenarioName, scenario]) =>
      scenarioNames.includes(scenarioName) ? [...acc, scenario] : acc,
    []
  );
  const schema = scenarios.reduce(
    (acc, scenario) => mergeSchemas(acc, scenario.schema),
    {}
  );
  const argv = scenarios.reduce(
    (acc: string[], scenario) => [...scenario.argv, ...acc],
    []
  ) as string[];

  const testCase = scenarios.reduce(
    (acc, scenario) => () => {
      acc(schema, argv);
      scenario.testCase(schema, argv);
    },
    (schema: Schema | CommandSchema, argv: string[]) => {}
  );
  describe(scenarioNames.join(" & "), () => {
    testCase(schema, argv);
  });
};

runTestScenarios(["single argument"]);
runTestScenarios(["single option"]);
runTestScenarios(["single positional"]);
runTestScenarios(["single command"]);
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
