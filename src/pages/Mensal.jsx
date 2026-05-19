import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { C } from "../utils/theme";
import { buscarTodasLeituras, buscarTodasChuvas } from "../firebase/db";

dayjs.locale("pt-br");

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

export default function Mensal({ user }) {
  const hoje = dayjs();
  const [leituras, setLeituras] = useState([]);
  const [chuvas,   setChuvas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [mes,  setMes]  = useState(hoje.month());       // 0–11
  const [ano,  setAno]  = useState(hoje.year());

  useEffect(() => {
    (async () => {
      const [ls, cs] = await Promise.all([
        buscarTodasLeituras(user.uid),
        buscarTodasChuvas(user.uid),
      ]);
      setLeituras(ls);
      setChuvas(cs);
      setLoading(false);
    })();
  }, []);

  // Anos disponíveis com base nos dados
  const anosDisponiveis = [...new Set([
    ...leituras.map(l => parseInt(l.data.substring(0,4))),
    ...chuvas.map(c => parseInt(c.data.substring(0,4))),
  ])].sort((a,b) => b - a);

  if (!anosDisponiveis.includes(ano) && anosDisponiveis.length) {
    // garante que o ano selecionado seja válido
  }

  // Filtrar pelo mês/ano selecionado
  const prefixo = `${ano}-${String(mes+1).padStart(2,"0")}`;
  const lFilt = leituras.filter(l => l.data.startsWith(prefixo));
  const cFilt = chuvas.filter(c => c.data.startsWith(prefixo));

  // Montar dias únicos
  const diasSet = new Set([
    ...lFilt.map(l => l.data),
    ...cFilt.map(c => c.data),
  ]);
  const dias = [...diasSet].sort();

  // Calcular linhas
  const linhas = dias.map(data => {
    const ls = lFilt.filter(l => l.data === data);
    const manha = ls.find(l => l.turno === "manha");
    const chuva = cFilt.filter(c => c.data === data).reduce((a,c) => a + c.mm, 0);
    return {
      data,
      max:   manha?.temp_max ?? null,
      min:   manha?.temp_min ?? null,
      umid:  manha?.umidade  ?? null,
      chuva: cFilt.filter(c => c.data === data).length > 0 ? chuva : null,
    };
  });

  // Totais/médias do rodapé
  const vals = (field) => linhas.map(l => l[field]).filter(v => v !== null);
  const media = (field) => { const v = vals(field); return v.length ? (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) : "—"; };
  const sumChuva = linhas.reduce((a,l) => a + (l.chuva ?? 0), 0).toFixed(1);

  const fmt = (v, dec=1) => v !== null && v !== undefined ? Number(v).toFixed(dec) : "—";

  const handlePrint = () => window.print();

  if (loading) return (
    <div style={{ color:C.textMuted, textAlign:"center", padding:60, fontFamily:"'Inter',sans-serif" }}>
      Carregando...
    </div>
  );

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #mensal-print, #mensal-print * { visibility: visible; }
          #mensal-print { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          table { font-size: 11px; }
          th, td { padding: 6px 8px !important; }
        }
      `}</style>

      <div id="mensal-print" style={{ padding:12, maxWidth:700, margin:"0 auto", fontFamily:"'Inter',sans-serif" }}>

        {/* Filtros */}
        <div className="no-print" style={{
          background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
          padding:16, marginBottom:12,
        }}>
          <p style={{ margin:"0 0 12px", color:C.textSec, fontSize:14, fontWeight:700 }}>📅 Filtro Mensal</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>

            {/* Seletor de ano */}
            <select value={ano} onChange={e => setAno(parseInt(e.target.value))} style={selStyle}>
              {(anosDisponiveis.length ? anosDisponiveis : [hoje.year()]).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Seletor de mês */}
            <select value={mes} onChange={e => setMes(parseInt(e.target.value))} style={selStyle}>
              {MESES.map((m,i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>

            <div style={{ marginLeft:"auto" }}>
              <button onClick={handlePrint} style={{
                background:"#0ea5e9", color:"#fff", border:"none", borderRadius:8,
                padding:"9px 18px", cursor:"pointer", fontFamily:"'Inter',sans-serif",
                fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:6,
              }}>
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* Cabeçalho do relatório (visível na impressão) */}
        <div style={{ marginBottom:12 }}>
          <p style={{ margin:0, color:C.text, fontWeight:700, fontSize:16 }}>
            📋 Leituras — {MESES[mes]} de {ano}
          </p>
          {linhas.length > 0 && (
            <p style={{ margin:"2px 0 0", color:C.textMuted, fontSize:12 }}>
              {linhas.length} {linhas.length === 1 ? "dia registrado" : "dias registrados"}
            </p>
          )}
        </div>

        {/* Tabela */}
        {linhas.length === 0 ? (
          <div style={{
            background:C.surface, border:`1px solid ${C.border}`, borderRadius:12,
            padding:32, textAlign:"center", color:C.textMuted, fontSize:14,
          }}>
            Nenhum dado para {MESES[mes]} de {ano}.
          </div>
        ) : (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#1e3a5f" }}>
                  <Th>Data</Th>
                  <Th align="center">Máx (°C)</Th>
                  <Th align="center">Mín (°C)</Th>
                  <Th align="center">Umid. Rel. (%)</Th>
                  <Th align="center">Chuva (mm)</Th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr key={l.data} style={{
                    background: i % 2 === 0 ? C.surface : C.surface2,
                    borderBottom:`1px solid ${C.border}`,
                  }}>
                    <Td>
                      <span style={{ fontWeight:600, color:C.text }}>
                        {dayjs(l.data).format("DD/MM")}
                      </span>
                      <span style={{ color:C.textMuted, fontSize:11, marginLeft:6, textTransform:"capitalize" }}>
                        {dayjs(l.data).format("ddd")}
                      </span>
                    </Td>
                    <Td align="center">
                      <span style={{ color: l.max !== null ? "#f87171" : C.textMuted, fontWeight: l.max !== null ? 600 : 400 }}>
                        {fmt(l.max)}
                      </span>
                    </Td>
                    <Td align="center">
                      <span style={{ color: l.min !== null ? "#7dd3fc" : C.textMuted, fontWeight: l.min !== null ? 600 : 400 }}>
                        {fmt(l.min)}
                      </span>
                    </Td>
                    <Td align="center">
                      <span style={{ color: l.umid !== null ? "#34d399" : C.textMuted, fontWeight: l.umid !== null ? 600 : 400 }}>
                        {fmt(l.umid, 0)}
                      </span>
                    </Td>
                    <Td align="center">
                      <span style={{ color: l.chuva !== null && l.chuva > 0 ? "#818cf8" : C.textMuted, fontWeight: l.chuva > 0 ? 600 : 400 }}>
                        {l.chuva !== null ? fmt(l.chuva) : "—"}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
              {/* Rodapé com médias */}
              <tfoot>
                <tr style={{ background:"#1e3a5f", borderTop:`2px solid ${C.border}` }}>
                  <td style={{ padding:"10px 14px", color:C.textSec, fontSize:12, fontWeight:700 }}>
                    Média / Total
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"center", color:"#f87171", fontWeight:700, fontSize:13 }}>
                    {media("max")}
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"center", color:"#7dd3fc", fontWeight:700, fontSize:13 }}>
                    {media("min")}
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"center", color:"#34d399", fontWeight:700, fontSize:13 }}>
                    {media("umid")}
                  </td>
                  <td style={{ padding:"10px 14px", textAlign:"center", color:"#818cf8", fontWeight:700, fontSize:13 }}>
                    {sumChuva} mm
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

const Th = ({ children, align="left" }) => (
  <th style={{
    padding:"11px 14px", textAlign:align, color:"#94a3b8",
    fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8,
    borderBottom:`1px solid #334155`,
  }}>{children}</th>
);

const Td = ({ children, align="left" }) => (
  <td style={{ padding:"10px 14px", textAlign:align }}>{children}</td>
);

const selStyle = {
  background:"#1e293b", border:"1px solid #334155", borderRadius:8,
  padding:"9px 12px", color:"#f1f5f9", fontSize:13,
  fontFamily:"'Inter',sans-serif", cursor:"pointer", outline:"none",
};
