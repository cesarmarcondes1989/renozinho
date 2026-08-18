-- Reset completo do banco: apaga TODOS os registros de produtos, categorias
-- e vendas (inclusive os itens de exemplo/demo que vieram das migrations).
-- Não apaga nada da estrutura (tabelas, colunas, policies) — só os dados.
--
-- Como rodar: cole este arquivo inteiro no SQL Editor do seu projeto
-- Supabase (Project → SQL Editor → New query) e execute.
--
-- ATENÇÃO: isso é destrutivo e não tem volta. Se você tem peças/vendas
-- reais cadastradas que quer manter, NÃO rode este script.

truncate table sales, products, categories restart identity cascade;

-- Se quiser já recomeçar com as categorias básicas (sem as peças de
-- exemplo), descomente o bloco abaixo antes de rodar:
--
-- insert into categories (nome, icone, hue, subs) values
--   ('Roupa Infantil', '☻', 330, array['Bodies','Conjuntos','Polos']),
--   ('Roupa Feminina', '✿', 12, array['Vestidos','Leggings']),
--   ('Roupa Masculina', '▲', 96, array['Moletons','Camisetas']),
--   ('Calçados', '▮', 190, array['Tênis','Sandálias']),
--   ('Eletrônicos', '◈', 240, array[]::text[]),
--   ('Acessórios', '◇', 24, array['Bolsas','Óculos','Perfumes']),
--   ('Pomadas', '●', 46, array['Assadura','Vitaminas']);
