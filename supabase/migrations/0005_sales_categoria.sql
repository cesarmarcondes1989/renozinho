-- Snapshot categoria/produto_nome on each sale at the moment it happens,
-- mirroring how custo_total_no_momento already snapshots cost. Without this,
-- a product that is later recategorized, renamed, archived, or deleted
-- (product_id is ON DELETE SET NULL) makes its historical sale impossible to
-- attribute correctly in Analytics.

alter table sales add column if not exists categoria text;
alter table sales add column if not exists produto_nome text;

update sales
set categoria = p.categoria,
    produto_nome = p.nome
from products p
where p.id = sales.product_id
  and sales.categoria is null;
