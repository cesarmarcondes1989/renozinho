-- Import Hub - fotos reais no produto + exclusão (soft delete) de peças.
-- Rode este arquivo no SQL Editor do seu projeto Supabase (ou via supabase db push)
-- depois de já ter rodado 0001_init.sql e 0002_ai_features.sql.

-- ===================== products.fotos =====================
-- URLs (bucket product-photos) das fotos tiradas/escolhidas no wizard ou
-- adicionadas depois na edição da peça. Guardado como jsonb (array de
-- strings) em vez de uma coluna única, pra suportar várias fotos por peça
-- (frente/verso/etiqueta/defeito) e reordenação simples no cliente.
alter table products add column if not exists fotos jsonb not null default '[]';

-- ===================== products.arquivado (soft delete) =====================
-- Excluir uma peça definitivamente quebraria o histórico em `sales`
-- (sales.product_id referencia products.id com `on delete set null`, então
-- um hard delete não dá erro de FK, mas perde a ligação da venda com a peça
-- vendida). Preferimos soft delete: a peça é marcada como arquivada e some
-- de todas as listagens/buscas/contagens normais, mas as vendas antigas
-- continuam íntegras e consultáveis.
alter table products add column if not exists arquivado boolean not null default false;

create index if not exists products_arquivado_idx on products(arquivado);
create index if not exists products_categoria_idx2 on products(categoria, arquivado);
