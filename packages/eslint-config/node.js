import globals from "globals";
import base from "./base.js";

export default [
  ...base,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
