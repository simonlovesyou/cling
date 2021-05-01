# @cling/parser

Write a declarative & serializeable schema inspired by JSON schema describing your CLI application & use it to parse/validate the arguments.

## Usage

Supply a schema to `@cling/parser` and it will parse the CLI arguments according to the schema.

```js
import clingParser from '@cling/parser'

const navalFate = {
  "name": "ship",
  "description": "Naval Fate",
  "commands": {
    "new": {
      "description": "Create a new ship",
      "arguments": {
        "name": {
          "$ref": "#/definitions/name"
        },
      }
    },
    "move": {
      "description": "Move a ship",
      "arguments": {
        "name": {
          "$ref": "#/definitions/name"
        },
        "x": {
          "$ref": "#/definitions/x"
        },
        "y": {
          "$ref": "#/definitions/y"
        },
        "speed": {
          "type": "number",
          "description": "Speed in knots"
        }
      },
      "required": ["name", "x", "y"]
    },
    "shoot": {
      "description": "Shoot with a ship",
      "arguments": {
        "x": {
          "$ref": "#/definitions/x"
        },
        "y": {
          "$ref": "#/definitions/y"
        }
      }
    }
  },
  "definitions": {
    "name": {
      "type": "string",
      "description": "Ship name"
    },
    "x": {
      "type": "integer"
    },
    "y": {
      "type": "integer"
    }
  },
  "options": {
    "help": {
      "type": "boolean",
      "alias": "h"
    }
  }
}

const parsedArguments = clingParser(navalFate)

if(parsedArguments.new) {
  console.log(`Creating ship ${parsedArguments.new.arguments.name}`)
}
```
