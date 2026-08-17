# Import Hub

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
- **Buscar por foto**: demonstração de busca visual por similaridade.

### O que é real x o que é simulado

| Funcionalidade | Status |
|---|---|
| CRUD de peças e categorias no Supabase | ✅ Real |
| Cálculo de custo, margem, markup e sugestões de preço | ✅ Real (matemática pura) |
| Registro de venda, cálculo de taxa de canal e lucro | ✅ Real |
| Baixa de estoque (qtd e status ao vender) | ✅ Real |
| Análise de foto por IA no wizard (passo "Analisando" + campos extraídos) | 🧪 Simulado — os campos vêm de um exemplo fixo, com um `setTimeout` para imitar o tempo de processamento |
| Busca por foto (tela "Buscar por foto") | 🧪 Simulado — compara com uma lista fixa de resultados, não com um modelo de visão computacional real |
| Chat "Perguntar ao estoque" no Analytics | 🧪 Simulado — respostas pré-escritas (perguntas e respostas fixas), não é uma IA real consultando o banco |
| Geração de texto de anúncio | 🧪 Modelo de texto (template), não é geração por IA |

Quando o app roda sem Supabase configurado, ele cai automaticamente para os
dados de exemplo em memória (os mesmos do protótipo original), então nunca
quebra por falta de variável de ambiente — só perde a persistência.

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
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public
   key**.
4. Copie `.env.example` para `.env.local` e preencha:

   ```bash
   cp .env.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica
   ```

5. Reinicie `npm run dev`. O app passa a ler e escrever direto no seu banco.

> A `SUPABASE_SERVICE_ROLE_KEY` não é usada em nenhum lugar do app (todo o
> acesso é feito pelo cliente com a anon key). Nunca coloque essa chave em uma
> variável `NEXT_PUBLIC_*`.

## Como fazer deploy na Vercel

1. Suba este repositório no GitHub (já feito, se você está lendo isso pelo
   GitHub).
2. Na Vercel, clique em **Add New → Project** e importe o repositório. O
   framework Next.js é detectado automaticamente — zero configuração de
   build.
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
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
