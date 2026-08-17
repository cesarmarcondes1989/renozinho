-- Import Hub - schema inicial + dados de exemplo
-- Rode este arquivo no SQL Editor do seu projeto Supabase (ou via supabase db push).

create table if not exists categories (
  id bigint generated always as identity primary key,
  nome text not null unique,
  icone text not null default '●',
  hue int not null default 96,
  subs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id bigint generated always as identity primary key,
  nome text not null,
  marca text not null default '',
  categoria text not null default '',
  cor text not null default '',
  cor2 text not null default '',
  tamanho text not null default '',
  sistema text not null default '',
  material text not null default '',
  genero text not null default '',
  condicao text not null default '',
  custo_usd numeric not null default 0,
  frete_usd numeric not null default 0,
  cotacao numeric not null default 5.42,
  taxa numeric not null default 0,
  outros_custos numeric not null default 0,
  custo_total numeric not null default 0,
  preco_venda numeric not null default 0,
  qtd int not null default 1,
  local text not null default '',
  status text not null default 'disponivel' check (status in ('disponivel','reservado','em_transito','vendido')),
  fornecedor text not null default '',
  lote text not null default '',
  sku text not null default '',
  hue int not null default 96,
  descricao text not null default '',
  tags text[] not null default '{}',
  variacoes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id bigint generated always as identity primary key,
  product_id bigint references products(id) on delete set null,
  preco_final numeric not null,
  canal text not null,
  taxa_canal numeric not null default 0,
  custo_total_no_momento numeric not null default 0,
  lucro numeric not null default 0,
  vendido_em timestamptz not null default now()
);

create index if not exists sales_product_id_idx on sales(product_id);
create index if not exists products_status_idx on products(status);
create index if not exists products_categoria_idx on products(categoria);

-- Row Level Security: liberado para leitura/escrita pública via anon key,
-- adequado para o protótipo (uso individual, sem multiusuário/autenticação).
-- Se for usar com múltiplos usuários, troque por políticas com auth.uid().
alter table categories enable row level security;
alter table products enable row level security;
alter table sales enable row level security;

create policy "categories: public read" on categories for select using (true);
create policy "categories: public write" on categories for insert with check (true);
create policy "categories: public update" on categories for update using (true);
create policy "categories: public delete" on categories for delete using (true);

create policy "products: public read" on products for select using (true);
create policy "products: public write" on products for insert with check (true);
create policy "products: public update" on products for update using (true);
create policy "products: public delete" on products for delete using (true);

create policy "sales: public read" on sales for select using (true);
create policy "sales: public write" on sales for insert with check (true);
create policy "sales: public update" on sales for update using (true);
create policy "sales: public delete" on sales for delete using (true);

-- ===================== Seed: categorias =====================
insert into categories (nome, icone, hue, subs) values
  ('Roupa Infantil', '☻', 330, array['Bodies','Conjuntos','Polos']),
  ('Roupa Feminina', '✿', 12, array['Vestidos','Leggings']),
  ('Roupa Masculina', '▲', 96, array['Moletons','Camisetas']),
  ('Calçados', '▮', 190, array['Tênis','Sandálias']),
  ('Eletrônicos', '◈', 240, array[]::text[]),
  ('Acessórios', '◇', 24, array['Bolsas','Óculos','Perfumes']),
  ('Pomadas', '●', 46, array['Assadura','Vitaminas'])
on conflict (nome) do nothing;

-- ===================== Seed: produtos =====================
-- custo_total = round((custo_usd + frete_usd) * cotacao + taxa)
-- created_at ajustado para simular "dias parado" igual ao protótipo original,
-- tomando 2026-08-17 como data de referência.

insert into products (nome, marca, categoria, cor, cor2, tamanho, sistema, material, genero, condicao, custo_usd, frete_usd, cotacao, taxa, outros_custos, custo_total, preco_venda, qtd, local, status, fornecedor, lote, sku, hue, descricao, tags, variacoes, created_at) values
('Camiseta Polo Ralph Lauren infantil','Ralph Lauren','Roupa Infantil','Azul marinho','Branco','12 meses','US','Algodão pima','Infantil','Novo com etiqueta',10,2,5.42,8,0,73,100,1,'Caixa 3','disponivel','Ralph Lauren Outlet, Orlando','Viagem Orlando · jul/26','RL-POLO-12M',208,'Polo clássica infantil em algodão pima, azul marinho com pônei bordado. Novinha com etiqueta, comprada em outlet nos EUA. Tamanho 12 meses.',array['pônei bordado','outlet','algodão pima'],'[{"label":"12 meses · Azul marinho","sku":"RL-POLO-12M","qtd":1}]'::jsonb, now() - interval '18 days'),
('Vestido Tommy Hilfiger feminino','Tommy Hilfiger','Roupa Feminina','Azul listrado','Branco','M','US','Viscose','Feminino','Novo com etiqueta',15,2.5,5.42,11,0,106,180,2,'Armário','disponivel','Tommy Outlet, Miami','Viagem Orlando · jul/26','TH-VEST-M',12,'Vestido midi Tommy Hilfiger em viscose leve, listras azul e branco. Peça original comprada nos EUA, novo com etiqueta. Cai bem em M.',array['midi','listrado','original'],'[{"label":"M · Azul listrado","sku":"TH-VEST-M","qtd":1},{"label":"G · Azul listrado","sku":"TH-VEST-G","qtd":1}]'::jsonb, now() - interval '24 days'),
('Pomada A&D uso infantil 454g','A&D','Pomadas','—','—','454 g','US','Lanolina e vaselina','Unissex','Novo',17,3,5.42,12,0,120,200,10,'Caixa 1','disponivel','Costco','Viagem Orlando · jul/26','AD-454',46,'Pomada A&D original americana, pote grande de 454g. Proteção para assaduras, a preferida das mães. Lote novo, validade longa.',array['importado','pote grande','best seller'],'[{"label":"454 g","sku":"AD-454","qtd":10}]'::jsonb, now() - interval '9 days'),
('Tênis Nike Air Force 1 branco','Nike','Calçados','Branco','—','US 9','US','Couro','Masculino','Novo com etiqueta',78,9,5.42,52,0,524,849,1,'Caixa 2','disponivel','Nike Factory Store','Viagem Orlando · jul/26','NK-AF1-9',190,'Air Force 1 branco na caixa, tamanho US 9. Clássico que não sai de moda, comprado direto na Nike Factory Store.',array['na caixa','clássico'],'[{"label":"US 9 · Branco","sku":"NK-AF1-9","qtd":1}]'::jsonb, now() - interval '41 days'),
('Fone Apple AirPods 4','Apple','Eletrônicos','Branco','—','Único','—','Plástico','Unissex','Novo com etiqueta',119,6,5.42,78,0,755,1290,2,'Com a Ana','reservado','Best Buy','Pedido Amazon · ago/26','AP-AP4',240,'AirPods 4 selados, comprados na Best Buy. Nota fiscal americana disponível. Entrega imediata.',array['selado','com nota'],'[{"label":"Único","sku":"AP-AP4","qtd":2}]'::jsonb, now() - interval '6 days'),
('Conjunto Carter''s body 5 peças','Carter''s','Roupa Infantil','Rosa','Cinza','6 meses','US','Algodão','Infantil','Novo com etiqueta',22,3,5.42,16,0,151,230,3,'Caixa 3','disponivel','Carter''s Outlet','Viagem Orlando · jul/26','CT-BODY-6M',330,'Kit com 5 bodies Carter''s em algodão, estampas mescladas rosa e cinza. Tamanho 6 meses, todos novos com etiqueta.',array['kit 5 peças','enxoval'],'[{"label":"6 meses · Rosa","sku":"CT-BODY-6M","qtd":2},{"label":"9 meses · Rosa","sku":"CT-BODY-9M","qtd":1}]'::jsonb, now() - interval '12 days'),
('Bolsa Michael Kors couro caramelo','Michael Kors','Acessórios','Caramelo','Dourado','Único','—','Couro saffiano','Feminino','Novo sem etiqueta',96,8,5.42,64,0,627,990,1,'Armário','disponivel','MK Outlet','Viagem Miami · mai/26','MK-TOTE',24,'Bolsa tote Michael Kors em couro saffiano caramelo com ferragens douradas. Sem etiqueta, nunca usada.',array['couro','saffiano','tote'],'[{"label":"Único · Caramelo","sku":"MK-TOTE","qtd":1}]'::jsonb, now() - interval '96 days'),
('Perfume Victoria''s Secret Bombshell','Victoria''s Secret','Acessórios','—','—','100 ml','—','—','Feminino','Novo com etiqueta',38,4,5.42,26,0,254,420,4,'Caixa 1','disponivel','Victoria''s Secret','Pedido Amazon · ago/26','VS-BOMB-100',0,'Bombshell 100ml lacrado, o perfume mais vendido da Victoria''s Secret. Comprado em loja física nos EUA.',array['lacrado','100ml'],'[{"label":"100 ml","sku":"VS-BOMB-100","qtd":4}]'::jsonb, now() - interval '15 days'),
('Moletom Champion Reverse Weave','Champion','Roupa Masculina','Cinza mescla','—','L','US','Moletom flanelado','Masculino','Seminovo',34,5,5.42,23,0,234,390,1,'Caixa 2','disponivel','Thrift store, Atlanta','Viagem Miami · mai/26','CH-RW-L',96,'Moletom Champion Reverse Weave cinza mescla, tamanho L. Seminovo, sem furos nem manchas, etiqueta antiga.',array['vintage','reverse weave'],'[{"label":"L · Cinza mescla","sku":"CH-RW-L","qtd":1}]'::jsonb, now() - interval '118 days'),
('Óculos Ray-Ban Aviator clássico','Ray-Ban','Acessórios','Dourado','Verde G15','58 mm','—','Metal','Unissex','Novo com etiqueta',88,5,5.42,58,0,562,920,1,'Armário','em_transito','Sunglass Hut','Pedido Amazon · ago/26','RB-AVI-58',60,'Ray-Ban Aviator dourado com lente verde G15, 58mm. Na caixa com case e flanela, comprado na Sunglass Hut.',array['na caixa','G15'],'[{"label":"58 mm · Dourado","sku":"RB-AVI-58","qtd":1}]'::jsonb, now() - interval '3 days'),
('Legging Nike Pro feminina','Nike','Roupa Feminina','Preto','—','P','BR','Dri-FIT','Feminino','Novo com etiqueta',26,3,5.42,18,0,175,249,2,'Caixa 3','disponivel','Nike Factory Store','Viagem Orlando · jul/26','NK-PRO-P',268,'Legging Nike Pro preta em tecido Dri-FIT, cintura alta. Tamanho P, nova com etiqueta.',array['dri-fit','cintura alta'],'[{"label":"P · Preto","sku":"NK-PRO-P","qtd":1},{"label":"M · Preto","sku":"NK-PRO-M","qtd":1}]'::jsonb, now() - interval '31 days'),
('Vitamina Centrum Adults 425 cápsulas','Centrum','Pomadas','—','—','425 un','—','—','Unissex','Novo',29,6,5.42,20,0,210,340,6,'Caixa 1','disponivel','Costco','Viagem Orlando · jul/26','CTR-425',150,'Centrum Adults pote gigante de 425 cápsulas, lacrado. Validade 2028, comprado no Costco.',array['pote gigante','lacrado'],'[{"label":"425 un","sku":"CTR-425","qtd":6}]'::jsonb, now() - interval '22 days')
on conflict do nothing;
