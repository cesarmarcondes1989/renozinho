// Teste da gravação de venda. Roda com: node --test lib/vendas.test.mjs
// (compilado antes via tsc para .test-build/, veja package.json "test")
import { test } from "node:test";
import assert from "node:assert/strict";
import { registrarVenda, isColunaInexistente } from "../.test-build/lib/vendas.js";

const VENDA = {
  product_id: 7,
  preco_final: 139,
  canal: "Instagram",
  taxa_canal: 0,
  custo_total_no_momento: 73,
  lucro: 66,
  vendido_em: "2026-08-18T00:00:00.000Z",
  categoria: "Roupa Infantil",
  produto_nome: "Vestido Rosa Infantil",
};

/** Fake do supabase que registra o que foi inserido e responde conforme o roteiro. */
function fakeClient(respostas) {
  const inserts = [];
  return {
    inserts,
    from() {
      return {
        insert(row) {
          inserts.push(row);
          const r = respostas[inserts.length - 1];
          return { select: () => ({ single: async () => r }) };
        },
      };
    },
  };
}

test("banco atualizado: grava numa tentativa, com os campos de snapshot", async () => {
  const c = fakeClient([{ data: { id: 1, ...VENDA }, error: null }]);
  const { data, error } = await registrarVenda(c, VENDA);
  assert.equal(error, null);
  assert.equal(data.id, 1);
  assert.equal(c.inserts.length, 1);
  assert.equal(c.inserts[0].categoria, "Roupa Infantil");
});

test("migration 0005 não aplicada: repete sem os campos novos e grava mesmo assim", async () => {
  const c = fakeClient([
    { data: null, error: { code: "42703", message: 'column "categoria" of relation "sales" does not exist' } },
    { data: { id: 2 }, error: null },
  ]);
  const { data, error } = await registrarVenda(c, VENDA);
  assert.equal(error, null, "deveria ter gravado na segunda tentativa");
  assert.equal(data.id, 2);
  assert.equal(c.inserts.length, 2);
  assert.equal(c.inserts[1].categoria, undefined, "2a tentativa não pode mandar a coluna que não existe");
  assert.equal(c.inserts[1].preco_final, 139, "os dados essenciais da venda continuam indo");
});

test("erro real (ex.: permissão): devolve o erro em vez de fingir sucesso", async () => {
  const c = fakeClient([{ data: null, error: { code: "42501", message: "permission denied for table sales" } }]);
  const { data, error } = await registrarVenda(c, VENDA);
  assert.notEqual(error, null, "o erro precisa chegar em quem chamou");
  assert.equal(data, null);
  assert.equal(c.inserts.length, 1, "não deve tentar de novo num erro que não é de coluna");
});

test("isColunaInexistente reconhece os formatos de erro relevantes", () => {
  assert.equal(isColunaInexistente({ code: "42703" }), true);
  assert.equal(isColunaInexistente({ code: "PGRST204" }), true);
  assert.equal(isColunaInexistente({ message: "Column 'produto_nome' not found" }), true);
  assert.equal(isColunaInexistente({ code: "42501", message: "permission denied" }), false);
  assert.equal(isColunaInexistente(null), false);
});
