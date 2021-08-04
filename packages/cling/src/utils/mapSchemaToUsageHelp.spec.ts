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
    arguments: {
      email: {
        type: "string",
      },
    },
  } as const);
  it("should return the correct usage guide", () => {
    expect(mapSchemaUsageToHelp(schemaFixture.get(), "lol")).toStrictEqual([
      { content: "Usage: lol [--email]", header: "lol" },
      {
        header: "Arguments",
        optionList: [
          {
            alias: undefined,
            description: undefined,
            name: "email",
            typeLabel: "string",
          },
        ],
      },
    ]);
  });
  describe("with alias", () => {
    const schema = schemaFixture.addValueAtPath(
      ["arguments", "email", "alias"],
      "e"
    );
    it("should return the correct usage guide", () => {
      expect(mapSchemaUsageToHelp(schema.get(), "lol")).toStrictEqual([
        { content: "Usage: lol [--email | -e]", header: "lol" },
        {
          header: "Arguments",
          optionList: [
            {
              alias: "e",
              description: undefined,
              name: "email",
              typeLabel: "string",
            },
          ],
        },
      ]);
    });
  });
});

describe("multiple arguments", () => {
  const schemaFixture = testFixture({
    arguments: {
      email: {
        type: "string",
      },
      name: {
        type: "string",
      },
    },
  } as const);
  it("should return the correct usage guide", () => {
    console.log(schemaFixture.get());
    expect(mapSchemaUsageToHelp(schemaFixture.get(), "lol")).toStrictEqual([
      { content: "Usage: lol [--email] [--name]", header: "lol" },
      {
        header: "Arguments",
        optionList: [
          {
            alias: undefined,
            description: undefined,
            name: "email",
            typeLabel: "string",
          },
          {
            alias: undefined,
            description: undefined,
            name: "name",
            typeLabel: "string",
          },
        ],
      },
    ]);
  });
  describe("with alias", () => {
    const schema = schemaFixture.addValueAtPath(
      ["arguments", "email", "alias"],
      "e"
    );
    it("should return the correct usage guide", () => {
      expect(mapSchemaUsageToHelp(schema.get(), "lol")).toStrictEqual([
        { content: "Usage: lol [--email | -e] [--name]", header: "lol" },
        {
          header: "Arguments",
          optionList: [
            {
              alias: "e",
              description: undefined,
              name: "email",
              typeLabel: "string",
            },
            {
              alias: undefined,
              description: undefined,
              name: "name",
              typeLabel: "string",
            },
          ],
        },
      ]);
    });
  });
});

describe("single positional", () => {
  const schemaFixture = testFixture({
    positionals: [
      {
        type: "string",
      },
    ],
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
