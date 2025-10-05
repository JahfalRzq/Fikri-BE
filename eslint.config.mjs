import baseConfig from "@yopem/eslint-config/base"
import reactConfig from "@yopem/eslint-config/react"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**", "api/**"],
  },
  ...baseConfig,
  ...reactConfig,
  {
    rules: {
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/dot-notation": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
      "@typescript-eslint/prefer-promise-reject-errors": "off",
      "@typescript-eslint/prefer-regexp-exec": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "prettier/prettier": "off",
      "no-console": ["warn", { allow: ["error", "warn", "info"] }],
      "no-constant-binary-expression": "off",
    },
  },
]
