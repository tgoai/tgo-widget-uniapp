import uni from '@uni-helper/eslint-config'

export default uni({
  unocss: true,
  rules: {
    'no-console': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
    'style/max-statements-per-line': 'off',
    'ts/ban-ts-comment': 'off',
    'unused-imports/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    'ts/no-use-before-define': 'off',
    'no-useless-return': 'off',
    'vue/html-self-closing': 'off',
    'no-cond-assign': 'off',
    'regexp/no-super-linear-backtracking': 'off',
    'ts/consistent-type-definitions': 'off',
  },
  ignores: [
    'src/uni_modules/**/*',
    'src/lib/**/*',
  ],
})
