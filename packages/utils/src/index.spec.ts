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
      description: "foo bar"
    };
    it("should not throw", () => {
      expect(() => convertJSONSchemaToArgument(schema)).not.toThrowError("Cannot convert JSON Schema to cling Argument with multiple types");
    });
    it('should return the expected corresponding argument', () => {
      expect(convertJSONSchemaToArgument(schema)).toStrictEqual({
        type: 'number',
        description: 'foo bar'
      });
    });
    describe('array type', () => {
      const arraySchema: JSONSchema7 = {
        type: "array",
        items: {
          type: 'string'
        }
      };
      it('should return the expected corresponding array argument', () => {
        expect(convertJSONSchemaToArgument(arraySchema)).toStrictEqual({
          type: 'array',
          items: {
            type: 'string'
          }
        });
      });
    })
    describe('string type', () => {
      describe('enum property', () => {
        const stringSchema: JSONSchema7 = {
          type: "string",
          enum: ['lol']
        };
        it('should return the expected corresponding array argument', () => {
          expect(convertJSONSchemaToArgument(stringSchema)).toStrictEqual({
            type: 'string',
            enum: ['lol']
          });
        });
      })
    })
  });
});
