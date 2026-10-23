import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const layer = (from, forbidden, packages = []) => ({
  files: [`src/${from}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          ...forbidden.map((f) => ({ group: [`**/${f}/**`, `**/${f}`], message: `${from} must not import ${f} (layer rule, concept/10 §2)` })),
          ...packages.map((p) => ({ group: [p, `${p}/**`], message: `${from} must not import ${p} (pure core, concept/10 §2)` })),
        ],
      },
    ],
  },
});

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'public/assets', 'dev-dist', 'playwright-report', 'test-results', 'concept', 'art'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  layer('core', ['content', 'render', 'ui', 'app', 'input', 'persistence', 'i18n', 'platform'], ['@babylonjs/*', 'preact', '@preact/*']),
  layer('content', ['render', 'ui', 'app', 'input', 'persistence']),
  layer('render', ['ui', 'app', 'persistence']),
  layer('ui', ['render', 'app']),
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage'],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG in state (concept/10 §4).' },
        { object: 'Date', property: 'now', message: 'No wall clock in core (concept/10 §4).' },
      ],
    },
  },
);
