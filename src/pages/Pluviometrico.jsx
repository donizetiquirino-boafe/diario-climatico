import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { buscarTodasChuvas } from "../firebase/db";

dayjs.locale("pt-br");

const MESES_CURTOS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DIAS_NO_MES  = (ano, mes) => new Date(ano, mes + 1, 0).getDate();

// Médias históricas 1975–2025 (mm/mês)
const MEDIA_HIST = [336.39,233.04,226.10,106.33,57.33,19.98,13.96,19.35,67.76,153.91,230.69,338.47];

// Cores por ano para o gráfico
const CORES_ANO = {
  2020:"#4472c4", 2021:"#ed7d31", 2022:"#a9d18e",
  2023:"#ffc000", 2024:"#5b9bd5", 2025:"#70ad47", 2026:"#ff0000",
};

// ── Formata valor numérico para exibição ──────────────────────────
const fmt = v => {
  if (!v || v === 0) return "";
  return Number.isInteger(v) ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, "");
};

// ── Estilos da tabela (planilha) ─────────────────────────────────
const TH = {
  background: "#c55a11",
  color: "#fff",
  padding: "5px 8px",
  fontWeight: 700,
  fontSize: 12,
  textAlign: "center",
  border: "1px solid #8b3a00",
  whiteSpace: "nowrap",
};
const TD_DIA = (i) => ({
  background: i % 2 === 0 ? "#f4b183" : "#ffd966",
  color: "#3d1c00",
  padding: "3px 6px",
  fontWeight: 700,
  fontSize: 12,
  textAlign: "center",
  border: "1px solid #c97a3a",
  width: 30,
});
const TD_VALOR = (i) => ({
  background: i % 2 === 0 ? "#fce4d6" : "#fff2cc",
  color: "#3d1c00",
  padding: "3px 6px",
  fontSize: 11.5,
  textAlign: "center",
  border: "1px solid #ddd",
  minWidth: 52,
});
const TD_TT = {
  background: "#e2741a",
  color: "#fff",
  padding: "4px 6px",
  fontWeight: 700,
  fontSize: 12,
  textAlign: "center",
  border: "1px solid #8b3a00",
};
const TD_MEDIA = {
  background: "#a9d18e",
  color: "#1a3a00",
  padding: "4px 6px",
  fontWeight: 700,
  fontSize: 12,
  textAlign: "center",
  border: "1px solid #5a9e30",
};

export default function Pluviometrico({ user }) {
  const hoje        = dayjs();
  const [chuvas,    setChuvas]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [ano,       setAno]      = useState(hoje.year());
  const [agora,     setAgora]    = useState(dayjs());
  const printRef    = useRef(null);

  // Atualiza relógio a cada minuto
  useEffect(() => {
    const t = setInterval(() => setAgora(dayjs()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const cs = await buscarTodasChuvas(user.uid);
      setChuvas(cs);
      setLoading(false);
    })();
  }, []);

  // ── Anos disponíveis nos dados ──────────────────────────────────
  const anosDisp = [...new Set(chuvas.map(c => parseInt(c.data.substring(0,4))))].sort();
  if (!anosDisp.includes(ano) && anosDisp.length) {/* manter seleção */}

  // ── Grid dia × mês para o ano selecionado ─────────────────────
  // grid[dia0][mes0] = total mm
  const grid = Array.from({length:31}, () => Array(12).fill(0));
  chuvas
    .filter(c => c.data.startsWith(String(ano)))
    .forEach(c => {
      const partes = c.data.split("-");
      const m = parseInt(partes[1]) - 1;
      const d = parseInt(partes[2]) - 1;
      if (d >= 0 && d < 31 && m >= 0 && m < 12) grid[d][m] += c.mm;
    });

  // Totais mensais
  const totMes = MESES_CURTOS.map((_,m) =>
    grid.reduce((s, row) => s + (row[m] || 0), 0)
  );
  const totalAno = totMes.reduce((a,b) => a + b, 0);

  // ── Dados do gráfico comparativo ───────────────────────────────
  const anosGraf = [2020,2021,2022,2023,2024,2025,2026].filter(a =>
    chuvas.some(c => c.data.startsWith(String(a)))
  );

  const dadosGraf = MESES_CURTOS.map((mes, m) => {
    const obj = { mes };
    anosGraf.forEach(a => {
      const tot = chuvas
        .filter(c => c.data.startsWith(`${a}-${String(m+1).padStart(2,"0")}`))
        .reduce((s,c) => s + c.mm, 0);
      obj[a] = tot || 0;
    });
    return obj;
  });
  // Linha "Total do ano"
  const totGraf = { mes: "Total do ano" };
  anosGraf.forEach(a => {
    totGraf[a] = chuvas
      .filter(c => c.data.startsWith(String(a)))
      .reduce((s,c) => s + c.mm, 0);
  });
  dadosGraf.push(totGraf);

  // ── Imprimir ───────────────────────────────────────────────────
  const imprimir = () => {
    const conteudo = printRef.current?.innerHTML || "";
    const win = window.open("","_blank","width=850,height=600");
    win.document.write(`
      <!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>Pluviométrico ${ano}</title>
        <style>
          @page{size:A4 landscape;margin:8mm 10mm}
          body{font-family:'Calibri',sans-serif;font-size:10pt;margin:0}
          table{border-collapse:collapse;width:100%}
          th,td{border:1px solid #ccc;padding:3px 5px;text-align:center;font-size:9pt}
          .no-print{display:none}
          img{max-height:40px}
        </style>
      </head><body>${conteudo}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div style={{padding:"16px 12px", fontFamily:"'Calibri',sans-serif"}}>

      {/* ── ÁREA IMPRIMÍVEL ── */}
      <div ref={printRef}>

        {/* Cabeçalho */}
        <div style={{
          background:"#1a3a6e", color:"#fff",
          padding:"10px 16px", borderRadius:"8px 8px 0 0",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:0,
        }}>
          <div>
            <div style={{fontWeight:800, fontSize:15, letterSpacing:0.5}}>
              {"<<< "}DADOS PLUVIOMÉTRICOS — FAZENDA BOA FÉ{" — "}CONQUISTA-MG{" >>>"}
            </div>
            <div style={{fontSize:11, marginTop:2, opacity:0.8}}>
              Sistema Meteorológico · Donizete Quirino
            </div>
          </div>
          <img src="/logo.png" alt="Araunah Farming"
            style={{height:48, width:"auto", objectFit:"contain"}}
            onError={e => e.target.style.display="none"} />
        </div>

        {/* Barra ANO / POSIÇÃO */}
        <div style={{
          background:"#f4b183", padding:"6px 14px",
          display:"flex", alignItems:"center", gap:32,
          borderLeft:"1px solid #c97a3a", borderRight:"1px solid #c97a3a",
        }}>
          <div style={{fontWeight:700, fontSize:13, color:"#3d1c00"}}>
            ANO:&nbsp;
            <select
              value={ano}
              onChange={e => setAno(parseInt(e.target.value))}
              style={{
                fontWeight:700, fontSize:13, color:"#3d1c00",
                background:"#fff3cc", border:"1px solid #c97a3a",
                borderRadius:4, padding:"2px 6px", cursor:"pointer",
              }}
            >
              {[...new Set([...anosDisp, hoje.year()])].sort().map(a =>
                <option key={a} value={a}>{a}</option>
              )}
            </select>
          </div>
          <div style={{fontWeight:700, fontSize:13, color:"#3d1c00"}}>
            POSIÇÃO ==&gt;&nbsp;
            <span style={{color:"#1a3a6e"}}>
              {agora.format("DD/MM/YYYY HH:mm")}
            </span>
          </div>
        </div>

        {/* Tabela pluviométrica */}
        {loading ? (
          <div style={{padding:40, textAlign:"center", color:"#888"}}>Carregando dados...</div>
        ) : (
          <div style={{overflowX:"auto"}}>
            <table style={{borderCollapse:"collapse", width:"100%", minWidth:700}}>
              <thead>
                <tr>
                  <th style={TH}>Dia</th>
                  {MESES_CURTOS.map(m => <th key={m} style={TH}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {Array.from({length:31}, (_,d) => {
                  // Verifica se algum mês tem esse dia
                  const temDados = grid[d].some(v => v > 0);
                  // Verifica se o dia existe em algum mês do ano selecionado
                  const diaExiste = MESES_CURTOS.some((_,m) => d < DIAS_NO_MES(ano, m));
                  if (!diaExiste && !temDados) return null;
                  return (
                    <tr key={d}>
                      <td style={TD_DIA(d)}>{String(d+1).padStart(2,"0")}</td>
                      {MESES_CURTOS.map((_,m) => {
                        const v = grid[d][m];
                        const existe = d < DIAS_NO_MES(ano, m);
                        return (
                          <td key={m} style={{
                            ...TD_VALOR(d),
                            color: v > 0 ? "#1a3a6e" : (existe ? "#bbb" : "#e0e0e0"),
                            fontWeight: v > 0 ? 700 : 400,
                          }}>
                            {existe ? (v > 0 ? fmt(v) : "") : ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Linha Total do Ano */}
                <tr>
                  <td style={TD_TT}>TT {ano}</td>
                  {totMes.map((t,m) => (
                    <td key={m} style={TD_TT}>{t > 0 ? fmt(t) : "0,00"}</td>
                  ))}
                </tr>

                {/* Linha Média Histórica */}
                <tr>
                  <td style={{...TD_MEDIA, fontSize:10, lineHeight:"1.2"}}>
                    Média<br/>1975–2025
                  </td>
                  {MEDIA_HIST.map((v,m) => (
                    <td key={m} style={TD_MEDIA}>{v.toFixed(2).replace(".",",")}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Gráfico comparativo */}
        {!loading && anosGraf.length > 0 && (
          <div style={{marginTop:28}}>
            <h3 style={{
              textAlign:"center", color:"#1a3a6e",
              fontSize:15, fontWeight:700, margin:"0 0 12px",
            }}>
              Comparativo entre os anos {Math.min(...anosGraf)} a {Math.max(...anosGraf)}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dadosGraf} margin={{top:5, right:20, left:0, bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="mes" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:10}} />
                <Tooltip formatter={(v) => `${fmt(v)} mm`} />
                <Legend />
                {anosGraf.map(a => (
                  <Bar key={a} dataKey={a} name={String(a)}
                    fill={CORES_ANO[a] || "#888"} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>{/* fim printRef */}

      {/* Botão imprimir (fora da área de impressão) */}
      <div style={{marginTop:20, textAlign:"right"}} className="no-print-btn">
        <button onClick={imprimir} style={{
          background:"#1a3a6e", color:"#fff",
          border:"none", borderRadius:8,
          padding:"10px 24px", fontSize:14, fontWeight:700,
          cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8,
        }}>
          🖨️ Imprimir
        </button>
      </div>

      <style>{`
        @media print { .no-print-btn { display:none } }
      `}</style>
    </div>
  );
}
