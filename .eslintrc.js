module.exports = {
  root: true,
  plugins:[
    'node'
  ],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  env: {
    browser: false,
    node: true,
    mocha: true,
    es6: true
  },
  rules: {
    'node/exports-style': ['error', 'module.exports'],
    'node/no-unpublished-require': 0
  }
};
