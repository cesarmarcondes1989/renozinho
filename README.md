# Renozinho Muambeiro

Protótipo funcional de um app de gestão de estoque e revenda para quem compra
peças nos EUA (roupas, tênis, cosméticos, eletrônicos etc.) e revende no
Brasil. Feito com Next.js (App Router, TypeScript) e Supabase como banco de
dados/backend, pronto para deploy na Vercel.

## O que tem no app

- **Início**: capital parado, valor potencial, lucro do mês, estoque baixo e
  peças paradas há mais tempo.
- **Estoque**: busca, filtros por chip, ordenação e visão em grade/lista.
- **Ficha da peça**: preço, margem, detalhamento de custo, especificações,
  variações, gerar texto de anúncio e registrar venda.
- **Categorias**: contagem e valor por categoria.
- **Nova peça (wizard de 5 passos)**: fotos → "análise por IA" (simulada) →
  revisão dos campos extraídos → calculadora de custo/preço/margem em tempo
  real → confirmação, com gravação real no Supabase.
- **Registrar venda**: escolha de canal (Instagram, WhatsApp, Shopee, Mercado
  Livre, Presencial), cálculo de taxa e lucro real, baixa de estoque.
- **Analytics**: receita, lucro, ticket médio, giro, receita por mês,
  categorias por lucro, canais de venda, melhores margens e um chat
  "Perguntar ao estoque".
- **Buscar por foto**: busca por similaridade usando IA real (descrição por
  visão computacional + embeddings de texto).

### O que é real x o que é simulado

| Funcionalidade | Status |
|---|---|
| CRUD de peças e categorias no Supabase | ✅ Real |
| Cálculo de custo, margem, markup e sugestões de preço | ✅ Real (matemática pura) |
| Registro de venda, cálculo de taxa de canal e lucro | ✅ Real |
| Baixa de estoque (qtd e status ao vender) | ✅ Real |
| Análise de foto por IA no wizard (passo "Analisando" + campos extraídos) | ✅ IA real via OpenAI (`gpt-4o-mini`, visão) |
| Busca por foto (tela "Buscar por foto") | ✅ IA real, com uma ressalva — veja abaixo |
| Chat "Perguntar ao estoque" no Analytics | ✅ IA real via OpenAI (`gpt-4o-mini`), respondendo com base nos dados reais do seu estoque e vendas |
| Geração de texto de anúncio | ✅ IA real via OpenAI (`gpt-4o-mini`) |

> **Ressalva sobre "Buscar por foto"**: a busca não faz comparação visual
> pixel a pixel / embedding de imagem. Ela usa o modelo de visão (`gpt-4o-mini`)
> para *descrever em texto* o item da foto (tipo, marca, cor, material,
> características) e depois compara essa descrição, via embeddings de texto
> (`text-embedding-3-small`) e similaridade de cosseno, com uma descrição
> equivalente gerada a partir dos campos de cada peça do seu estoque. Na
> prática funciona bem para achar peças parecidas, mas é semelhança
> textual/semântica derivada da visão, não uma busca visual de verdade.

Todas as chamadas de IA acontecem em rotas de servidor
(`app/api/ai/*/route.ts`) — a chave da OpenAI nunca é enviada ao navegador.
Se `OPENAI_API_KEY` não estiver configurada, essas rotas retornam um erro
amigável (`{"error": "OPENAI_API_KEY não configurada"}`, HTTP 503) e a
interface mostra a mensagem no lugar do resultado, sem quebrar a tela — o
resto do app (CRUD, vendas, cálculos) continua funcionando normalmente.

Quando o app roda sem Supabase configurado, ele cai automaticamente para os
dados de exemplo em memória (os mesmos do protótipo original), então nunca
quebra por falta de variável de ambiente — só perde a persistência. As fotos
do wizard e da busca por foto também funcionam sem Supabase: nesse caso elas
não ficam salvas em Storage, mas são enviadas para a IA como base64 (a
análise continua funcionando).

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sem configurar o Supabase, o app já funciona com
dados de exemplo (modo somente leitura para o restante da sessão, já que não
há banco para persistir).

## Como configurar o Supabase

1. Crie um projeto em https://supabase.com.
2. No **SQL Editor** do projeto, rode o conteúdo de
   `supabase/migrations/0001_init.sql` — ele cria as tabelas `products`,
   `categories` e `sales`, com RLS liberado para leitura/escrita (uso
   individual, sem autenticação) e popula com os mesmos dados de exemplo do
   protótipo.
3. Em seguida rode `supabase/migrations/0002_ai_features.sql` — ele cria o
   bucket de Storage `product-photos` (leitura pública, upload liberado) usado
   pelas fotos do wizard e da busca por foto, e adiciona as colunas
   `embedding`/`embedding_texto` em `products`, usadas como cache do
   embedding de cada peça na busca por foto.
4. Em **Project Settings → API**, copie a **Project URL** e a **anon public
   key**.
5. (Opcional) Se quiser apagar os dados de exemplo e começar do zero, rode
   `supabase/scripts/reset-database.sql` no SQL Editor — ele limpa todos os
   registros de `products`, `categories` e `sales` (sem mexer na estrutura
   das tabelas). É destrutivo e não tem volta.
5. Copie `.env.example` para `.env.local` e preencha:

   ```bash
   cp .env.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica
   OPENAI_API_KEY=sk-...
   ```

6. Reinicie `npm run dev`. O app passa a ler e escrever direto no seu banco.

> A `SUPABASE_SERVICE_ROLE_KEY` não é usada em nenhum lugar do app (todo o
> acesso é feito pelo cliente com a anon key). Nunca coloque essa chave em uma
> variável `NEXT_PUBLIC_*`.

## Como configurar a OpenAI (recursos de IA)

1. Crie uma chave em https://platform.openai.com/api-keys.
2. Defina `OPENAI_API_KEY=sk-...` em `.env.local` (e, no deploy, nas
   variáveis de ambiente do projeto na Vercel). **Nunca** use o prefixo
   `NEXT_PUBLIC_` nessa variável — ela só é lida pelas rotas de servidor em
   `app/api/ai/*`, nunca pelo navegador.
3. Sem essa variável configurada, o app inteiro continua funcionando
   normalmente — só os 4 recursos de IA (geração de anúncio, análise de foto,
   busca por foto e chat do estoque) ficam desabilitados, mostrando uma
   mensagem de erro amigável em vez de travar a tela.

Modelos usados: `gpt-4o-mini` (chat + visão, para análise de foto, geração de
anúncio, descrição da busca por foto e o chat do estoque) e
`text-embedding-3-small` (embeddings de texto, para a busca por foto).

## Como fazer deploy na Vercel

1. Suba este repositório no GitHub (já feito, se você está lendo isso pelo
   GitHub).
2. Na Vercel, clique em **Add New → Project** e importe o repositório. O
   framework Next.js é detectado automaticamente — zero configuração de
   build.
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. Clique em **Deploy**.

## Stack

- Next.js 14 (App Router) + TypeScript
- Sem Tailwind: o layout original (fundo escuro `#080906`, acento
  verde-limão `#C6FF4F`, fonte Manrope) foi portado com estilos inline
  usando um pequeno helper `css()` (`lib/css.ts`) que converte strings
  `"prop:valor;prop2:valor2"` em objetos `React.CSSProperties`, preservando o
  visual original do protótipo.
- `@supabase/supabase-js` no cliente (`"use client"` em toda a árvore de UI).
- Estrutura: `lib/` para tipos, dados de exemplo, cliente Supabase e helpers;
  `components/screens/*` para cada tela do app; `components/ImportHubApp.tsx`
  concentra estado, navegação e o "shell" do app.

## Estrutura de dados (resumo)

- **products** — peça de estoque: nome, marca, categoria, cor, tamanho,
  custo em dólar/frete/cotação/taxas, custo total, preço de venda,
  quantidade, local, status (`disponivel`/`reservado`/`em_transito`/
  `vendido`), SKU, tags, variações (`jsonb`) etc.
- **categories** — nome, ícone, matiz de cor (hue) e sub-tags.
- **sales** — venda registrada: peça, preço final, canal, taxa do canal,
  custo no momento da venda e lucro.

Veja o DDL completo e os dados de exemplo em
`supabase/migrations/0001_init.sql`.
