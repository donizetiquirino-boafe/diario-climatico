// Script para deletar os últimos 51 registros da coleção chuvas
// Execute: node deletar_duplicados.mjs

const API_KEY    = "AIzaSyDQ6KC0RAvA0xaxGqCYVRX3f2QRw3FE7ZU";
const PROJECT_ID = "diario-climatico";
const UID        = "IKgOWOLPuCRMvKNur6OH4fiE9ng1";
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// 1. Busca todos os documentos da coleção chuvas
async function listarChuvas() {
  let docs = [];
  let pageToken = null;

  do {
    const url = `${BASE_URL}/chuvas?key=${API_KEY}&pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.documents) docs = docs.concat(data.documents);
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return docs;
}

const todos = await listarChuvas();
console.log(`\n📂 Total de registros encontrados: ${todos.length}`);

// 2. Filtra só os do UID correto e ordena por criadoEm (mais recentes primeiro)
const filtrados = todos
  .filter(d => d.fields?.uid?.stringValue === UID)
  .sort((a, b) => {
    const ta = a.fields?.criadoEm?.stringValue || "";
    const tb = b.fields?.criadoEm?.stringValue || "";
    return tb.localeCompare(ta); // mais recente primeiro
  });

const paraApagar = filtrados.slice(0, 51);

console.log(`\n🗑️  Apagando os 51 mais recentes:\n`);

let ok = 0, erros = 0;

for (const doc of paraApagar) {
  const name = doc.name; // ex: projects/.../documents/chuvas/XYZABC
  const docPath = name.split("/documents/")[1]; // ex: chuvas/XYZABC
  const url = `${BASE_URL}/${docPath}?key=${API_KEY}`;

  const data   = doc.fields?.data?.stringValue || "?";
  const hora   = doc.fields?.hora?.stringValue || "?";
  const mm     = doc.fields?.mm?.doubleValue   || "?";
  const criado = doc.fields?.criadoEm?.stringValue?.substring(0, 19) || "?";

  const res = await fetch(url, { method: "DELETE" });

  if (res.ok) {
    ok++;
    console.log(`  ✅ ${data} ${hora} ${mm}mm  (criado: ${criado})`);
  } else {
    erros++;
    console.log(`  ❌ ${data} — Erro ${res.status}`);
  }

  await new Promise(r => setTimeout(r, 100));
}

console.log(`\n✅ Deletados: ${ok}  |  ❌ Erros: ${erros}\n`);
