import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default defineConfig([
  {
    ignores: ['dist/**', 'server/src/generated/**', 'node_modules/**']
  },
  { files: ['**/*.{js,mjs,cjs,ts,d.ts,vue}'] },
  { files: ['**/*.{js,mjs,cjs,ts,d.ts,vue}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ['**/*.{js,mjs,cjs,ts,d.ts,vue}'], plugins: { js }, extends: ['js/recommended'] },
  tseslint.configs.recommended,
  pluginVue.configs['flat/essential'],
  {
    files: ['**/*.d.ts'],
    languageOptions: {
      parser: tseslint.parser
    }
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    // UI primitives are intentionally single-word (Badge, Button, Card, etc.)
    files: ['client/src/components/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    rules: {
      indent: ['error', 2, { SwitchCase: 1 }],
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      '@typescript-eslint/no-empty-object-type': ['off']
    }
  }
])
