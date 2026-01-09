# PIX API — Documentação (UI customizada)

Este projeto é uma interface estática para visualização da especificação OpenAPI (Swagger) da API PIX do Banco BV. É uma versão personalizada do Swagger UI com melhorias visuais e de usabilidade (sidebar organizada, painel de exemplos à direita e suporte responsivo para dispositivos móveis). Pode ser usado localmente ou publicado em um serviço estático (ex.: GitHub Pages).

Por que usei/montei isso
- Melhor leitura das operações: sidebar limpa e pesquisável.
- Acesso rápido a exemplos de request/response sem precisar abrir cada operação.
- Layout responsivo e usável em celular, tablet e desktop.
- Projeto leve e facilmente hospedável como site estático.

O que tem aqui
- `index.html` — página principal (HTML + CSS + JavaScript embutidos).
  - Carrega o Swagger UI e o YAML/JSON da API (configurado em `SWAGGER_URL`).
  - Constrói uma sidebar customizada a partir do DOM do Swagger.
  - Mostra exemplos de resposta em um painel lateral com botões para copiar/expandir.
  - Remoção de elementos indesejados gerados pelo Swagger (ex.: contadores “0”).
  - Comportamento off-canvas para sidebar em telas pequenas.

Funcionalidades principais
- Sidebar com:
  - Lista de seções (h2) e tags (grupos de endpoints).
  - Busca por endpoints/títulos.
  - Destaque da operação ativa.
- Painel de exemplos (direita):
  - Barra superior com método + caminho.
  - “Response samples” com badges por status (200, 4xx, 5xx).
  - Visualização do content-type e corpo da resposta com destaque de sintaxe.
  - Botões Copy / Expand / Collapse.
- Heurísticas para extrair exemplos mesmo quando o Swagger rendeia o DOM de formas variadas.
- Suporte básico a mobile (sidebar off-canvas e painel acessível).

Como usar (local)
1. Clone o repositório ou copie os arquivos para uma pasta local.
2. (Opcional) Atualize a variável `SWAGGER_URL` em `index.html` para apontar ao seu `pix.yaml`:
   ```js
   const SWAGGER_URL = "https://meu-host/meu-pix.yaml";
   ```
3. Sirva o diretório com um servidor estático. Exemplos:
   - Python 3:
     ```
     python -m http.server 8000
     ```
   - Node (http-server):
     ```
     npx http-server -p 8000
     ```
4. Abra no navegador: `http://localhost:8000`.

Deploy (GitHub Pages)
- Coloque `index.html` na raiz do repositório.
- Ative GitHub Pages em Settings → Pages apontando para a branch/árvore correta.
- A URL pública será disponibilizada pelo GitHub Pages.

Personalizações rápidas
- Alterar arquivo OpenAPI: atualize `SWAGGER_URL` no topo do `index.html`.
- Cores e espaçamentos: variáveis CSS em `:root` (no início do arquivo).
- Separar CSS/JS: é possível extrair o conteúdo inline para `styles.css` e `app.js`.

Soluções rápidas (troubleshooting)
- Tela em branco / nada carregado:
  - Verifique se `SWAGGER_URL` aponta para um OpenAPI válido.
  - Veja o console do navegador para erros de CORS ou 404.
- Endpoints não aparecem na sidebar:
  - Confirme que o Swagger UI renderizou (há um pequeno delay antes da construção da sidebar).
- Exemplos não aparecem:
  - Alguns specs não incluem blocos `<pre>`/`<code>` para exemplos; nesse caso o painel mostra mensagem de fallback.
- Ainda aparecem “0” ao lado do sidebar:
  - Abra o DevTools → Elements e compartilhe o nó (se quiser, eu ajusto o seletor para remover o caso específico).

Observações técnicas
- A sidebar é construída a partir do DOM que o Swagger UI injeta. Por isso o script observa mutações e reconstrói o menu sempre que necessário.
- O projeto foi pensado para ser simples de hospedar (static site) e fácil de integrar em um portfólio.

 *Este arquivo README foi escrito para descrever o projeto de forma clara e apresentar instruções práticas para uso e deploy.

Bom uso!
