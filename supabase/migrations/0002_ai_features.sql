-- Import Hub - suporte a IA real (OpenAI): fotos reais no Storage + cache de
-- embeddings dos produtos para a busca por foto.
-- Rode este arquivo no SQL Editor do seu projeto Supabase (ou via supabase db push)
-- depois de já ter rodado 0001_init.sql.

-- ===================== Storage: bucket de fotos =====================
-- Bucket público de leitura para as fotos enviadas no wizard (cadastro de
-- peça) e na busca por foto. Upload é feito pelo cliente com a anon key,
-- mesmo modelo de acesso liberado usado nas tabelas do protótipo.
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "product-photos: public read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

create policy "product-photos: public upload"
  on storage.objects for insert
  with check (bucket_id = 'product-photos');

-- ===================== products.embedding =====================
-- Cache do embedding de texto (nome + marca + categoria + cor + descrição +
-- tags) de cada peça, usado pela "busca por foto" para comparar com a
-- descrição gerada pela visão do modelo. Guardado como jsonb (array de
-- floats) em vez de um tipo `vector` do pgvector, porque não há garantia de
-- que a extensão pgvector esteja habilitada no projeto — a similaridade de
-- cosseno é calculada em JavaScript no servidor (ver app/api/ai/busca-foto).
alter table products add column if not exists embedding jsonb;
alter table products add column if not exists embedding_texto text;
