module.exports = {
  "extends": ["../eslint-config/.eslintrc.js"],
  "settings": {
    "import/resolver": {
      typescript: {
        "project": "./tsconfig.json",
      }
    }
  },
  "rules": {
    "comma-dangle": ["off"],
    "no-unused-vars": ["off"],
    "no-redeclare": ["off"],
    "brace-style": ["off"],
  }
}