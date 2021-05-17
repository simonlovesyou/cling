declare module 'json-schema-deref-sync' {
  import { JSONSchema7 } from "json-schema";

  export function deref(object: JSONSchema7): JSONSchema7
}