/** @type {import('prettier').Config} */
module.exports = {
  // Configurações básicas
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  endOfLine: 'lf',
  printWidth: 80,
  arrowParens: 'always',
  bracketSpacing: true,
  bracketSameLine: false,

  // Configurações específicas por tipo de arquivo
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: '*.{ts,tsx}',
      options: {
        parser: 'typescript',
        semi: false,
        singleQuote: true,
      },
    },
    {
      files: '*.{js,jsx}',
      options: {
        parser: 'babel',
      },
    },
    {
      files: '*.css',
      options: {
        parser: 'css',
        singleQuote: false,
      },
    },
    {
      files: '*.scss',
      options: {
        parser: 'scss',
        singleQuote: false,
      },
    },
    {
      files: '*.html',
      options: {
        parser: 'html',
        printWidth: 120,
      },
    },
    {
      files: '*.yaml',
      options: {
        parser: 'yaml',
        tabWidth: 2,
      },
    },
    {
      files: '*.yml',
      options: {
        parser: 'yaml',
        tabWidth: 2,
      },
    },
  ],

  // Plugins
  plugins: [
    'prettier-plugin-tailwindcss', // Ordena classes do Tailwind
  ],

  // Configurações específicas do Tailwind
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva'],

  // Ignorar arquivos
  ignore: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '*.min.js',
    '*.min.css',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
  ],
};
