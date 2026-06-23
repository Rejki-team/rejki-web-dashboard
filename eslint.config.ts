import vue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// ESLint flat config (ESLint 9+/10) untuk proyek Vue 3 + TypeScript.
// - `eslint-plugin-vue` aturan SFC.
// - `@vue/eslint-config-typescript` mengintegrasikan typescript-eslint untuk <script lang="ts">.
// - `skip-formatting` menonaktifkan aturan stilistik agar Prettier yang menangani format
//   (menghindari konflik ESLint vs Prettier).
export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'],
  },
  ...vue.configs['flat/recommended'],
  ...vueTsEslintConfig(),
  skipFormatting,
]
