module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh', 'storybook'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:storybook/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: ['ui-*'], message: 'UI cannot import logic-*, data-* or workers' },
          { group: ['logic-*'], message: 'Logic cannot import ui-* or react' },
          {
            group: ['data-*'],
            message: 'Data layer imports only utils, not ui-* nor logic-* nor state-*',
          },
        ],
      },
    ],
  },
};
