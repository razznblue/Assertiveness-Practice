
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import globals from 'globals'

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        REACT_APP_ENV: 'readonly',
      },
    },
    rules: {
      'import/no-anonymous-default-export': 'off',
    },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])
