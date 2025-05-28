module.exports = {
  // Arquivos TypeScript e JavaScript
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write', 'git add'],

  // Arquivos JSON
  '*.json': ['prettier --write', 'git add'],

  // Arquivos CSS
  '*.{css,scss,sass}': ['prettier --write', 'git add'],

  // Arquivos Markdown
  '*.{md,mdx}': ['prettier --write', 'git add'],

  // Arquivos de configuração
  '*.{yml,yaml}': ['prettier --write', 'git add'],

  // Verificar tipos TypeScript apenas em arquivos TS
  '*.{ts,tsx}': [() => 'tsc --noEmit'],
};
