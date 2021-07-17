/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-magic-numbers, @typescript-eslint/explicit-function-return-type */
import { assocPath } from "ramda";
import mapSchemaUsageToHelp from "./mapSchemaToUsageHelp";

const testFixture = <T>(object: T) => ({
  addValueAtPath: <TValue>(path: (number | string)[], value: TValue) =>
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
      { content: "Usage: lol [--help]", header: "lol" },
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
      { content: "Usage: lol [--help]", header: "lol" },
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
        { content: "Usage: lol [--help | -h]", header: "lol" },
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

describe("single positional", () => {
  const schemaFixture = testFixture({
    positionals: [{
      type: "string",
    }],
  } as const);
  it("should return the correct usage guide", () => {
    expect(mapSchemaUsageToHelp(schemaFixture.get(), "lol")).toStrictEqual([
      { content: "Usage: lol <string>", header: "lol" },
      {
        header: "Positionals",
        optionList: [
          {
            description: undefined,
            name: "string",
            typeLabel: "string",
          },
        ],
      },
    ]);
  });
  describe("with name", () => {
    const schema = schemaFixture.addValueAtPath(
      ["positionals", 0, "name"],
      "bar"
    );
    it("should return the correct usage guide", () => {
      expect(mapSchemaUsageToHelp(schema.get(), "lol")).toStrictEqual([
        { content: "Usage: lol <bar>", header: "lol" },
        {
          header: "Positionals",
          optionList: [
            {
              description: undefined,
              name: "bar",
              typeLabel: "string",
            },
          ],
        },
      ]);
    });
  });
});