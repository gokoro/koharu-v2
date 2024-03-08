/* eslint-env node */
module.exports = {
  extends: ['plugin:perfectionist/recommended-natural'],
  parser: '@typescript-eslint/parser',
  root: true,
  rules: {
    'perfectionist/sort-objects': 'off',
  },
}
