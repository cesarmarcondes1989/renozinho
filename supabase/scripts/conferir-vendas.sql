-- Diagnóstico: peças marcadas como "vendido" que NÃO têm venda registrada.
-- Elas aparecem como vendidas no estoque, mas não entram no "Lucro no mês"
-- nem no Analytics, porque esses números vêm da tabela `sales`.
--
-- Isso acontecia por dois motivos (ambos corrigidos no app):
--   1. O registro da venda falhava no banco e o app dava baixa no estoque
--      assim mesmo, sem avisar.
--   2. A peça foi marcada como "Vendido" pela tela de editar, que só muda o
--      status e não registra venda nenhuma.
--
-- Rode no SQL Editor do Supabase para ver o que está inconsistente:

select p.id,
       p.nome,
       p.categoria,
       p.preco_venda,
       p.custo_total,
       p.qtd,
       p.status
from products p
left join sales s on s.product_id = p.id
where p.status = 'vendido'
  and s.id is null
  and coalesce(p.arquivado, false) = false
order by p.id;

-- ---------------------------------------------------------------------------
-- CORREÇÃO A — a peça foi mesmo vendida e você quer contabilizar a venda.
-- Ajuste o id, o preço e o canal, e rode. O lucro é calculado em cima do
-- custo total gravado na própria peça.
--
-- insert into sales (product_id, preco_final, canal, taxa_canal,
--                    custo_total_no_momento, lucro, categoria, produto_nome,
--                    vendido_em)
-- select p.id,
--        <PRECO_FINAL>,          -- ex.: 139
--        '<CANAL>',              -- Instagram, WhatsApp, Shopee, Mercado Livre, Presencial
--        0,                      -- taxa do canal (0.14 para Shopee, 0.16 ML)
--        p.custo_total,
--        <PRECO_FINAL> - p.custo_total,
--        p.categoria,
--        p.nome,
--        now()                   -- ou a data real da venda
-- from products p
-- where p.id = <ID_DA_PECA>;

-- ---------------------------------------------------------------------------
-- CORREÇÃO B — a peça não foi vendida (foi marcada por engano) e você quer
-- devolvê-la ao estoque para registrar a venda pelo app, do jeito certo.
--
-- update products
-- set status = 'disponivel',
--     qtd = 1
-- where id = <ID_DA_PECA>;
