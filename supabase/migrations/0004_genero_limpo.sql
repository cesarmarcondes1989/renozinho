-- Limpa a semântica do campo `genero`: antes ele misturava gênero real
-- ("Masculino"/"Feminino"/"Unissex") com faixa etária ("Infantil"). Faixa
-- etária já vive na categoria (ex. "Roupa Infantil"), então nenhum produto
-- deve mais ter genero = 'Infantil'.
--
-- Remapeamento por bom senso, item a item:
--   RL-POLO-12M (polo Ralph Lauren infantil, azul marinho/branco, sem corte
--     ou cor claramente associada a um gênero) -> 'Ambos'
--   CT-BODY-6M (kit de bodies Carter's, cor rosa predominante)  -> 'Feminino'

update products set genero = 'Ambos' where sku = 'RL-POLO-12M' and genero = 'Infantil';
update products set genero = 'Feminino' where sku = 'CT-BODY-6M' and genero = 'Infantil';

-- Rede de segurança: qualquer outro produto que ainda tenha genero =
-- 'Infantil' (por exemplo cadastrado manualmente antes desta migração) cai
-- em 'Unissex', o valor mais neutro, para não ficar com um valor fora do
-- enum da aplicação ('Feminino' | 'Masculino' | 'Ambos' | 'Unissex').
update products set genero = 'Unissex' where genero = 'Infantil';
