import { assocPath, mergeRight, path } from "ramda";
import expandSchemaReferences from "./expandSchemaReferences";
import Schema from "./types";

const mergePath = <R extends Record<string, any>>(
  propPath: string[],
  value: any
) => (object: Record<string, any>): R =>
  assocPath(
    propPath,
    mergeRight(path(propPath, object) as object, value),
    object
  ) as R;

describe("with no references", () => {
  const schema: Schema = {
    definitions: {
      foo: {
        type: "string",
      },
      bar: {
        type: "number",
      },
    },
  };
  it("should return the same schema", () => {
    expect(expandSchemaReferences(schema)).toEqual(schema);
  });
});

const ARGUMENT_POSITIONS = ["options", "arguments", "definitions"];

ARGUMENT_POSITIONS.forEach((argumentPosition) => {
  const plainSchema: Schema = {
    definitions: {
      bar: {
        type: "number",
      },
    },
  };
  describe(`a single reference in ${argumentPosition}`, () => {
    const schema: Schema = mergePath<Schema>([argumentPosition], {
      foo: {
        $ref: "#/definitions/bar",
      },
    })(plainSchema);
    const expectedSchema = mergePath<Schema>([argumentPosition], {
      foo: {
        type: "number",
      },
    })(plainSchema);
    it("should resolve the reference", () => {
      expect(expandSchemaReferences(schema)).toEqual(expectedSchema);
    });
  });
});