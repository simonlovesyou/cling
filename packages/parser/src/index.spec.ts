import declarativeCliParser from ".";
import Schema from "./types";
import { mergeDeepRight, pipe } from "ramda";

type Scenario = {
  schema: Schema;
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
          it("should return the positional argument", () => {
            const result = declarativeCliParser(schema, { argv });
            expect(result.positionals![0]).not.toBeUndefined();
          });
          it("should coerce the type", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-expect-error
            expect(result.positionals![0].value).toBe(5);
          });
          it("should not return any errors for the property", () => {
            const result = declarativeCliParser(schema, { argv });
            // @ts-ignore
            expect(result.positionals![0].error).toBe(undefined);
          });
        });
      });
    },
  },
  "single command": {
    schema: {
      commands: {
        bar: {},
      },
    },
    argv: ["bar"],
    testCase: (schema, argv) => {
      describe.skip("command provided", () => {
        it("should return the command", () => {
          const result = declarativeCliParser(schema, { argv });
          // @ts-ignore
          expect(result.commands!.bar).not.toBeUndefined();
        });
        it("should not return any errors for the property", () => {
          const result = declarativeCliParser(schema, { argv });
          // @ts-ignore
          expect(result.commands!.bar!.error).toBe(undefined);
        });
      });
    },
  },
};

const mergeSchemas = (schemaA: Schema, schemaB: Schema) =>
  mergeDeepRight(schemaA, schemaB);

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
    (schema: Schema, argv: string[]) => {}
  );
  describe(scenarioNames.join(" & "), () => {
    testCase(schema, argv);
  });
};

runTestScenarios(["single argument"]);
runTestScenarios(["single option"]);
runTestScenarios(["single positional"]);
// runTestScenarios(['single command'])
runTestScenarios(["single option", "single argument"]);
runTestScenarios(["single positional", "single option", "single argument"]);
