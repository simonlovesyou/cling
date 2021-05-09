import { convertJSONSchemaToArgument } from ".";
import { JSONSchema7 } from "json-schema";

describe("convertJSONSchemaToArgument", () => {
  describe("when there's multiple types", () => {
    const schema: JSONSchema7 = {
      type: ["integer", "number"],
    };
    it("should throw", () => {
      expect(() => convertJSONSchemaToArgument(schema)).toThrowError("Cannot convert JSON Schema to cling Argument with multiple types");
    });
  });
  describe("when there's a single type", () => {
    const schema: JSONSchema7 = {
      type: "number",
    };
    it("should not throw", () => {
      expect(() => convertJSONSchemaToArgument(schema)).not.toThrowError("Cannot convert JSON Schema to cling Argument with multiple types");
    });
  });
});
