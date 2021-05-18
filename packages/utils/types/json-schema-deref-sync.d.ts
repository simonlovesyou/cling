declare module 'json-schema-deref-sync' {
  import { JSONSchema7 } from "json-schema";

  export default function deref(object: JSONSchema7): JSONSchema7
}