// Script de importação de chuvas para o Firestore
// Execute: node importar_chuvas.mjs

import { readFileSync } from "fs";

const API_KEY    = "AIzaSyDQ6KC0RAvA0xaxGqCYVRX3f2QRw3FE7ZU";
const PROJECT_ID = "diario-climatico";
const UID        = "IKgOWOLPuCRMvKNur6OH4fiE9ng1";
const URL        = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/chuvas?key=${API_KEY}`;

const registros = JSON.parse(readFileSync("./chuvas_import.json", "utf-8"));

console.log(`\n📂 Importando ${registros.length} registros de chuva...\n`);

let ok = 0, erros = 0;

for (const r of registros) {
  const doc = {
    fields: {
      uid:      { stringValue: UID },
      data:     { stringValue: r.data },
      hora:     { stringValue: r.hora },
      mm:       { doubleValue: r.mm },
      obs:      { stringValue: r.obs || "" },
      criadoEm: { stringValue: new Date().toISOString() },
    }
  };

  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });

    if (res.ok) {
      ok++;
      console.log(`  ✅ ${r.data}  ${r.hora}  ${r.mm}mm`);
    } else {
      erros++;
      const err = await res.text();
      console.log(`  ❌ ${r.data} — Erro ${res.status}: ${err.substring(0, 80)}`);
    }
  } catch (e) {
    erros++;
    console.log(`  ❌ ${r.data} — Exceção: ${e.message}`);
  }

  // Pequena pausa para não sobrecarregar a API
  await new Promise(r => setTimeout(r, 120));
}

console.log(`\n✅ Importados: ${ok}  |  ❌ Erros: ${erros}`);
console.log("Pronto! Verifique no app.\n");
