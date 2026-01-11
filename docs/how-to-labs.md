HOW TO

Após instalação e leitura do readme.me seguir os passos

abaixo para execução da aplicação e simulação.

node bench-browser-mem-v2.js
O script executa testes com:

1, 5, 10 e 20 abas

Chromium

Firefox

📊 Resultados
Ao final da execução, são gerados:

results-<timestamp>.json

results-<timestamp>.csv

Colunas:

baseline_mb → memória do browser sem abas

total_mb → memória total com N abas

per_tab_mb → custo real por aba

📁 Estrutura do projeto
pgsql
Copiar código
browserbench/
├── bench-browser-mem-v2.js
├── results-*.json
├── results-*.csv
├── package.json
└── README.md
⚠️ Observações importantes
Safari não é benchmarkável no Linux

WebKit ≠ Safari real

Extensões e perfis de usuário alteram resultados

Headful mode é obrigatório para métricas realistas
