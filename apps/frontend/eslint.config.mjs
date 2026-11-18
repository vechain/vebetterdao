import next from "eslint-config-next"

// react-hooks v7's React Compiler rules arrived with eslint-config-next 16; warn until the code is migrated.
const KEPT_AS_IS = ["react-hooks/rules-of-hooks", "react-hooks/exhaustive-deps"]
const compilerRules = Object.keys(next.find(c => c.name === "next").rules)
  .filter(rule => rule.startsWith("react-hooks/") && !KEPT_AS_IS.includes(rule))
  .map(rule => [rule, "warn"])

export default [
  ...next,
  { rules: Object.fromEntries(compilerRules) },
  { ignores: ["dist/**", "src/api/indexer/schema.d.ts", "styled-system/**"] },
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/display-name": "off",
      "import/no-anonymous-default-export": "off",
      "react/no-children-prop": "warn",
      "react/no-unescaped-entities": "warn",
      "react/jsx-no-literals": "error",
      "react/no-array-index-key": "warn",
      "no-console": ["error", { allow: ["error", "warn", "info"] }],
      "no-duplicate-imports": "error",
      "import/no-named-as-default-member": 0,
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "unknown"],
          pathGroups: [{ pattern: "@/**", group: "internal", position: "before" }],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 0 }],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
]
