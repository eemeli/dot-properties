import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfig(
  [
    {
      files: ['**/*.js'],
      languageOptions: { globals: globals.node },
      plugins: { js },
      extends: ['js/recommended']
    },
    { files: ['tests/*.js'], languageOptions: { globals: globals.jest } },
    {
      rules: {
        'no-control-regex': 0
      }
    }
  ],
  eslintConfigPrettier
)
