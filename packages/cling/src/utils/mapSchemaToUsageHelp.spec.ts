import mapSchemaUsageToHelp from "./mapSchemaToUsageHelp";
import { assocPath, identity } from "ramda";

const testFixture = <T>(object: T) => ({
  addValueAtPath: <TValue>(path: string[], value: TValue) =>
    testFixture(assocPath(path, value, object)),
  get: () => object,
});

describe("single option", () => {
  const schemaFixture = testFixture({
    options: {
      help: {
        type: "boolean",
      },
    },
  } as const);
  it("should return the correct usage guide", () => {
    expect(mapSchemaUsageToHelp(schemaFixture.get(), "lol")).toStrictEqual([
      { content: "Usage: lol  [--help]", header: "lol" },
      {
        header: "Options",
        optionList: [
          {
            alias: undefined,
            description: undefined,
            name: "help",
            typeLabel: "boolean",
          },
        ],
      },
    ]);
  });
  describe("with alias", () => {
    const schema = schemaFixture.addValueAtPath(
      ["options", "help", "alias"],
      "h"
    );
  });
});

describe("single argument", () => {
  const schemaFixture = testFixture({
    options: {
      help: {
        type: "boolean",
      },
    },
  } as const);
  it("should return the correct usage guide", () => {
    expect(mapSchemaUsageToHelp(schemaFixture.get(), "lol")).toStrictEqual([
      { content: "Usage: lol  [--help]", header: "lol" },
      {
        header: "Options",
        optionList: [
          {
            alias: undefined,
            description: undefined,
            name: "help",
            typeLabel: "boolean",
          },
        ],
      },
    ]);
  });
  describe("with alias", () => {
    const schema = schemaFixture.addValueAtPath(
      ["options", "help", "alias"],
      "h"
    );
    it("should return the correct usage guide", () => {
      expect(mapSchemaUsageToHelp(schema.get(), "lol")).toStrictEqual([
        { content: "Usage: lol  [--help | -h]", header: "lol" },
        {
          header: "Options",
          optionList: [
            {
              alias: "h",
              description: undefined,
              name: "help",
              typeLabel: "boolean",
            },
          ],
        },
      ]);
    });
  });
});
