import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { C, TURNOS, getTempColor } from "../utils/theme";
import { buscarTodasLeituras, buscarTodasChuvas } from "../firebase/db";
import { exportarPDF, exportarExcel } from "../utils/exports";

export default function Relatorios({ user }) {
  const [leituras, setLeituras] = useState([]);
  const [chuvas,   setChuvas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dataIni,  setDataIni]  = useState(dayjs().subtract(30,"day").format("YYYY-MM-DD"));
  const [dataFim,  setDataFim]  = useState(dayjs().format("YYYY-MM-DD"));
  const [gerando,  setGerando]  = useState("");

  useEffect(() => {
    (async () => {
      const [ls, cs] = await Promise.all([buscarTodasLeituras(user.uid), buscarTodasChuvas(user.uid)]);
      setLeituras(ls); setChuvas(cs); setLoading(false);
    })();
  }, []);

  const lFilt = leituras.filter(l => l.data >= dataIni && l.data <= dataFim);
  const cFilt = chuvas.filter(c => c.data >= dataIni && c.data <= dataFim);
  const periodo = `${dayjs(dataIni).format("DD/MM/YYYY")} a ${dayjs(dataFim).format("DD/MM/YYYY")}`;

  // agrupar por dia para exibição
  const diasUnicos = [...new Set([...lFilt.map(l=>l.data), ...cFilt.map(c=>c.data)])].sort((a,b)=>b.localeCompare(a));

  const handlePDF = () => {
    setGerando("pdf");
    setTimeout(() => { exportarPDF(lFilt, cFilt, periodo); setGerando(""); }, 100);
  };

  const handleExcel = () => {
    setGerando("excel");
    setTimeout(() => { exportarExcel(lFilt, cFilt); setGerando(""); }, 100);
  };

  const temps  = lFilt.map(l => l.temp);
  const umis   = lFilt.map(l => l.umidade);
  const cTotal = cFilt.reduce((a,c) => a+c.mm, 0);

  if (loading) return <div style={{ color:C.textMuted,textAlign:"center",padding:60,fontFamily:"'Inter',sans-serif" }}>Carregando...</div>;

  return (
    <div style={{ padding:12,maxWidth:700,margin:"0 auto",fontFamily:"'Inter',sans-serif" }}>

      {/* Período */}
      <div style={card}>
        <h2 style={secTitle}>📅 Período</h2>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
          <div><Label>Data inicial</Label><input type="date" value={dataIni} onChange={e=>setDataIni(e.target.value)} style={inp}/></div>
          <div><Label>Data final</Label><input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)} style={inp}/></div>
        </div>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {[{l:"7d",d:7},{l:"15d",d:15},{l:"30d",d:30},{l:"3m",d:90},{l:"1a",d:365}].map(({l,d})=>(
            <button key={d} onClick={()=>{setDataIni(dayjs().subtract(d,"day").format("YYYY-MM-DD"));setDataFim(dayjs().format("YYYY-MM-DD"));}} style={{
              padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:C.surface2,color:C.textMuted,cursor:"pointer",fontSize:12,fontFamily:"'Inter',sans-serif"
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      {lFilt.length > 0 && (
        <div style={card}>
          <h2 style={secTitle}>📊 Resumo</h2>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10 }}>
            {[
              {l:"Temp. Máx",  v:temps.length?`${Math.max(...temps).toFixed(1)}°C`:"—", c:C.red},
              {l:"Temp. Mín",  v:temps.length?`${Math.min(...temps).toFixed(1)}°C`:"—", c:C.blue},
              {l:"Temp. Méd",  v:temps.length?`${(temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1)}°C`:"—", c:C.yellow},
              {l:"Umid. Méd",  v:umis.length?`${(umis.reduce((a,b)=>a+b,0)/umis.length).toFixed(0)}%`:"—", c:C.green},
              {l:"Chuva Total",v:`${cTotal.toFixed(1)}mm`, c:C.purple},
              {l:"Dias",       v:`${diasUnicos.length}`, c:C.primary},
            ].map((s,i)=>(
              <div key={i} style={{ background:C.surface2,borderRadius:8,padding:"10px 12px" }}>
                <p style={{ margin:"0 0 3px",fontSize:9,color:C.textMuted,textTransform:"uppercase",letterSpacing:1 }}>{s.l}</p>
                <p style={{ margin:0,fontSize:18,fontWeight:800,color:s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico completo */}
      {diasUnicos.length > 0 && (
        <div style={card}>
          <h2 style={secTitle}>📋 Histórico do período</h2>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {diasUnicos.map(d => {
              const ls = lFilt.filter(l=>l.data===d);
              const cs = cFilt.filter(c=>c.data===d);
              const cT = cs.reduce((a,c)=>a+c.mm,0);
              return (
                <div key={d} style={{ background:C.surface2,borderRadius:12,overflow:"hidden" }}>
                  {/* cabeçalho do dia */}
                  <div style={{ padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}` }}>
                    <div>
                      <span style={{ color:C.text,fontWeight:700,fontSize:14 }}>{dayjs(d).format("DD/MM/YYYY")}</span>
                      <span style={{ color:C.textMuted,fontSize:11,marginLeft:8,textTransform:"capitalize" }}>{dayjs(d).format("dddd")}</span>
                    </div>
                    {cs.length>0
                      ? <span style={{ color:C.purple,fontSize:12,fontWeight:600 }}>🌧 {cT.toFixed(1)}mm</span>
                      : <span style={{ fontSize:14 }}>☀️</span>}
                  </div>

                  {/* linha: 07:00 | Relativa | Máx | Mín */}
                  {TURNOS.map(t => {
                    const r = ls.find(l=>l.turno===t.key);
                    if (!r) return null;
                    const isManha = t.key === "manha";
                    return (
                      <div key={t.key} style={{ padding:"10px 14px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${C.border}`,borderLeft:`3px solid ${t.color}` }}>
                        <span style={{ fontSize:13,color:t.color,fontWeight:700,width:44,flexShrink:0 }}>{t.hora}</span>
                        <span style={{ fontSize:13,color:C.green,flex:1 }}>{r.umidade}%<span style={{fontSize:11,color:C.textMuted,marginLeft:3}}>rel</span></span>
                        {isManha && r.temp_max != null && <span style={{ fontSize:13,color:"#f87171" }}>🔺{r.temp_max}°C</span>}
                        {isManha && r.temp_min != null && <span style={{ fontSize:13,color:"#7dd3fc" }}>🔻{r.temp_min}°C</span>}
                      </div>
                    );
                  })}

                  {/* linha: chuva */}
                  {cs.length > 0 && (
                    <div style={{ padding:"8px 14px",borderLeft:`3px solid ${C.purple}` }}>
                      {cs.map(c=>(
                        <div key={c.id} style={{ fontSize:12,color:C.textMuted,lineHeight:1.8 }}>
                          🌧 {c.hora} · <strong style={{ color:C.purple }}>{c.mm}mm</strong>{c.obs ? ` · ${c.obs}` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exportar */}
      <div style={card}>
        <h2 style={secTitle}>📤 Exportar</h2>
        {lFilt.length===0 && cFilt.length===0
          ? <p style={{ color:C.textMuted,fontSize:13 }}>Nenhum dado neste período.</p>
          : <p style={{ color:C.textMuted,fontSize:12,marginBottom:16 }}>{lFilt.length} leituras · {cFilt.length} eventos de chuva · {periodo}</p>
        }
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <button onClick={handlePDF} disabled={!lFilt.length&&!cFilt.length||gerando==="pdf"} style={{
            background:(lFilt.length||cFilt.length)?"#dc2626":C.surface2,
            color:(lFilt.length||cFilt.length)?"#fff":C.textMuted,
            border:"none",borderRadius:10,padding:"16px 8px",cursor:"pointer",fontFamily:"'Inter',sans-serif",
            opacity:gerando==="pdf"?0.6:1,
          }}>
            <p style={{ margin:"0 0 4px",fontSize:22 }}>📄</p>
            <p style={{ margin:"0 0 2px",fontWeight:700,fontSize:14 }}>PDF</p>
            <p style={{ margin:0,fontSize:11,opacity:.8 }}>Para impressão</p>
            {gerando==="pdf"&&<p style={{ margin:"4px 0 0",fontSize:11 }}>Gerando...</p>}
          </button>
          <button onClick={handleExcel} disabled={!lFilt.length&&!cFilt.length||gerando==="excel"} style={{
            background:(lFilt.length||cFilt.length)?"#166534":C.surface2,
            color:(lFilt.length||cFilt.length)?"#fff":C.textMuted,
            border:"none",borderRadius:10,padding:"16px 8px",cursor:"pointer",fontFamily:"'Inter',sans-serif",
            opacity:gerando==="excel"?0.6:1,
          }}>
            <p style={{ margin:"0 0 4px",fontSize:22 }}>📊</p>
            <p style={{ margin:"0 0 2px",fontWeight:700,fontSize:14 }}>Excel</p>
            <p style={{ margin:0,fontSize:11,opacity:.8 }}>Histórico completo</p>
            {gerando==="excel"&&<p style={{ margin:"4px 0 0",fontSize:11 }}>Gerando...</p>}
          </button>
        </div>
      </div>
    </div>
  );
}

const Label = ({children}) => <p style={{ margin:"0 0 5px",fontSize:11,color:C.textMuted,textTransform:"uppercase",letterSpacing:.9 }}>{children}</p>;
const card    = { background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:12 };
const secTitle= { margin:"0 0 14px",color:C.textSec,fontSize:14,fontWeight:700 };
const inp     = { width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,fontFamily:"'Inter',sans-serif",boxSizing:"border-box",outline:"none" };
