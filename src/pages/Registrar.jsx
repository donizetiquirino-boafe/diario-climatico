import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { C, TURNOS } from "../utils/theme";
import { salvarLeitura, salvarChuva, buscarChuvasDia, deletarChuva,
         buscarTodasLeituras, buscarTodasChuvas } from "../firebase/db";
import { exportarExcel, exportarPDF } from "../utils/exports";

dayjs.locale("pt-br");

const hoje     = () => dayjs().format("YYYY-MM-DD");
const horaAtual = () => dayjs().format("HH:mm");

const campoVazio = () => ({ seca:"", umida:"", relativa:"", tempMax:"", tempMin:"" });

// ── Calendário ────────────────────────────────────────────────────
function Calendario({ valor, onChange, onFechar }) {
  const [mes, setMes] = useState(dayjs(valor || hoje()));
  const inicioMes = mes.startOf("month");
  const diasMes   = mes.daysInMonth();
  const diaSemana = inicioMes.day();
  const hoje_     = dayjs().format("YYYY-MM-DD");
  const semana    = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const celulas   = Array(diaSemana).fill(null).concat(Array.from({ length: diasMes }, (_,i) => i+1));

  return (
    <div style={{ position:"absolute", zIndex:300, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, boxShadow:"0 10px 40px rgba(0,0,0,0.6)", minWidth:260, top:"110%", left:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <button onClick={()=>setMes(m=>m.subtract(1,"month"))} style={navBtn}>‹</button>
        <span style={{ color:C.text, fontWeight:700, fontSize:14, textTransform:"capitalize" }}>{mes.format("MMMM YYYY")}</span>
        <button onClick={()=>setMes(m=>m.add(1,"month"))} style={navBtn}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {semana.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, color:C.textMuted }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {celulas.map((d,i) => {
          if (!d) return <div key={i}/>;
          const ds = mes.date(d).format("YYYY-MM-DD");
          const sel = ds === valor, eh = ds === hoje_;
          return (
            <button key={i} onClick={()=>{ onChange(ds); onFechar(); }} style={{
              background: sel ? C.primary : eh ? C.surface2 : "transparent",
              color:      sel ? "#fff"    : eh ? C.primary  : C.text,
              border:     eh && !sel ? `1px solid ${C.primary}` : "none",
              borderRadius:6, padding:"5px 0", fontSize:13, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight: sel?700:400,
            }}>{d}</button>
          );
        })}
      </div>
      <button onClick={onFechar} style={{ marginTop:10, width:"100%", background:C.surface2, border:`1px solid ${C.border}`, color:C.textMuted, borderRadius:8, padding:"7px 0", fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Fechar</button>
    </div>
  );
}

const IcoCalendario = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.55, flexShrink:0 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
  </svg>
);

function CampoData({ valor, onChange }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      <div onClick={()=>setAberto(a=>!a)} style={{ ...inp, background:C.surface2, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", userSelect:"none" }}>
        <span style={{ fontSize:16, fontWeight:600 }}>{dayjs(valor).format("DD/MM/YYYY")}</span>
        <IcoCalendario />
      </div>
      <p style={{ color:C.textMuted, fontSize:12, margin:"5px 0 0", textTransform:"capitalize" }}>{dayjs(valor).format("dddd, DD [de] MMMM [de] YYYY")}</p>
      {aberto && <Calendario valor={valor} onChange={onChange} onFechar={()=>setAberto(false)} />}
    </div>
  );
}

// ── Campo com label flutuante ─────────────────────────────────────
function Campo({ label, type="number", step, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  const flutuando = focused || value !== "";
  return (
    <div style={{ position:"relative", marginBottom:4 }}>
      <label style={{
        position:"absolute", left:12, top: flutuando ? 6 : 14,
        fontSize: flutuando ? 10 : 14,
        color: focused ? C.primary : C.textMuted,
        transition:"all 0.18s ease", pointerEvents:"none",
        textTransform: flutuando ? "uppercase" : "none",
        letterSpacing: flutuando ? 0.7 : 0,
        fontFamily:"'Inter',sans-serif",
      }}>{label}</label>
      <input
        type={type} step={step}
        value={value}
        placeholder={flutuando ? (placeholder||"") : ""}
        onChange={onChange}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
        style={{ ...inp, paddingTop: flutuando ? 22 : 14, paddingBottom: flutuando ? 6 : 14,
          borderColor: focused ? C.primary : C.border }}
      />
    </div>
  );
}

// ── Tela principal ────────────────────────────────────────────────
export default function Registrar({ user }) {
  const [data,       setData]       = useState(hoje());
  const [turnoAtivo, setTurnoAtivo] = useState("manha");
  const [vals,       setVals]       = useState({ manha: campoVazio(), tarde: campoVazio(), noite: campoVazio() });
  const [obs,        setObs]        = useState("");
  const [chuvaHora,  setChuvaHora]  = useState(horaAtual());
  const [chuvaMm,    setChuvaMm]    = useState("");
  const [chuvaObs,   setChuvaObs]   = useState("");
  const [chuvasDia,  setChuvasDia]  = useState([]);
  const [toast,      setToast]      = useState(null);
  const [loading,    setLoading]    = useState(false);

  const showToast = (msg, cor=C.primary) => { setToast({msg,cor}); setTimeout(()=>setToast(null),2500); };

  const carregarDia = async (d) => {
    const cs = await buscarChuvasDia(user.uid, d);
    setVals({ manha: campoVazio(), tarde: campoVazio(), noite: campoVazio() });
    setObs("");
    setChuvaMm(""); setChuvaObs(""); setChuvaHora(horaAtual());
    setChuvasDia(cs);
  };

  useEffect(() => { carregarDia(data); }, [data]);

  const setVal = (turno, campo, valor) => setVals(v=>({...v,[turno]:{...v[turno],[campo]:valor}}));

  const handleSalvar = async () => {
    const t = vals[turnoAtivo];
    if (!t.seca || !t.relativa) { showToast("⚠️ Preencha ao menos Seca e Relativa.", C.yellow); return; }
    setLoading(true);
    try {
      const isManha = turnoAtivo === "manha";
      await salvarLeitura(
        user.uid, data, turnoAtivo,
        t.seca, t.umida, t.relativa,
        isManha ? t.tempMax : null,
        isManha ? t.tempMin : null,
        isManha ? obs : ""
      );
      showToast("✓ Registro salvo!");
    } catch (err) {
      showToast("❌ Erro: " + err.message, C.red);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarChuva = async () => {
    if (!chuvaMm) return;
    await salvarChuva(user.uid, data, chuvaHora, chuvaMm, chuvaObs);
    showToast("✓ Chuva registrada!", C.purple);
    setChuvaMm(""); setChuvaObs(""); setChuvaHora(horaAtual());
    carregarDia(data);
  };

  const handleDeletarChuva = async (id) => {
    if (!confirm("Remover este evento de chuva?")) return;
    await deletarChuva(id); carregarDia(data);
  };

  const handleExcel = async () => {
    try {
      showToast("Gerando Excel...", C.yellow);
      const [ls, cs] = await Promise.all([buscarTodasLeituras(user.uid), buscarTodasChuvas(user.uid)]);
      exportarExcel(ls, cs);
    } catch(err) { showToast("❌ Erro: " + err.message, C.red); }
  };

  const handlePDF = async () => {
    try {
      showToast("Gerando PDF...", C.yellow);
      const [ls, cs] = await Promise.all([buscarTodasLeituras(user.uid), buscarTodasChuvas(user.uid)]);
      exportarPDF(ls, cs);
    } catch(err) { showToast("❌ Erro: " + err.message, C.red); }
  };

  const t = vals[turnoAtivo];
  const isManha = turnoAtivo === "manha";

  return (
    <div style={{ padding:16, maxWidth:700, margin:"0 auto" }}>
      {toast && <div style={{ position:"fixed",top:20,right:20,left:20,background:toast.cor,color:"#fff",padding:"12px 22px",borderRadius:10,fontWeight:700,fontSize:14,zIndex:999,textAlign:"center" }}>{toast.msg}</div>}

      {/* Data + seletor de turno */}
      <div style={card}>
        <Label>📅 Data do Registro</Label>
        <CampoData valor={data} onChange={d=>{ setData(d); setObs(""); }} />
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          {TURNOS.map(t => (
            <button key={t.key} onClick={()=>setTurnoAtivo(t.key)} style={{
              flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer",
              background: turnoAtivo===t.key ? C.primary : C.surface2,
              color:      turnoAtivo===t.key ? "#fff"    : C.textMuted,
              fontWeight: turnoAtivo===t.key ? 700 : 400,
              fontSize:14, fontFamily:"'Inter',sans-serif",
            }}>{t.hora}</button>
          ))}
        </div>
      </div>

      {/* Temperatura e Umidade */}
      <div style={card}>
        <h2 style={secTitle}>🌡 Temperatura / Umidade — {TURNOS.find(x=>x.key===turnoAtivo)?.hora}</h2>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          <Campo label="Seca"       step="0.1" placeholder="°C" value={t.seca}    onChange={e=>setVal(turnoAtivo,"seca",e.target.value)}/>
          <Campo label="Úmida"      step="0.1" placeholder="°C" value={t.umida}   onChange={e=>setVal(turnoAtivo,"umida",e.target.value)}/>
          <Campo label="Relativa %" placeholder="%" value={t.relativa} onChange={e=>setVal(turnoAtivo,"relativa",e.target.value)}/>
        </div>
        {isManha && (
          <>
            <p style={{ margin:"14px 0 4px", color:C.textMuted, fontSize:12, fontWeight:600 }}>EXTREMAS</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Campo label="Máxima °C" step="0.1" value={t.tempMax} onChange={e=>setVal("manha","tempMax",e.target.value)}/>
              <Campo label="Mínima °C" step="0.1" value={t.tempMin} onChange={e=>setVal("manha","tempMin",e.target.value)}/>
            </div>
          </>
        )}
      </div>

      {/* Chuva */}
      <div style={card}>
        <h2 style={secTitle}>🌧 Registro de Chuvas</h2>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Campo label="Horário" type="time" value={chuvaHora} onChange={e=>setChuvaHora(e.target.value)}/>
          <Campo label="Volume (mm)" step="0.1" placeholder="ex: 12.5" value={chuvaMm} onChange={e=>setChuvaMm(e.target.value)}/>
        </div>
        <button onClick={handleSalvarChuva} disabled={!chuvaMm} style={{ ...btnBase, background:chuvaMm?C.purple:"#334155", marginTop:12, opacity:chuvaMm?1:0.5 }}>➕ Adicionar evento de chuva</button>

        {chuvasDia.length > 0 && (
          <div style={{ marginTop:14 }}>
            <Label>Eventos deste dia</Label>
            {chuvasDia.map(c => (
              <div key={c.id} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                <div>
                  <span style={{ color:C.purple, fontWeight:700, fontSize:16 }}>{c.mm}mm</span>
                  <span style={{ color:C.textMuted, fontSize:13, marginLeft:10 }}>{c.hora}</span>
                  {c.obs && <p style={{ margin:"2px 0 0", fontSize:12, color:C.textMuted, fontStyle:"italic" }}>{c.obs}</p>}
                </div>
                <button onClick={()=>handleDeletarChuva(c.id)} style={{ background:"transparent", border:"none", color:C.red, cursor:"pointer", fontSize:18 }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observação */}
      <div style={card}>
        <h2 style={secTitle}>📝 Observação</h2>
        <Campo label="Observação geral do dia" type="text" value={obs} onChange={e=>setObs(e.target.value)}/>
      </div>

      {/* Botões */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:4 }}>
        <button onClick={handleSalvar} disabled={loading} style={{ ...btnBase, background:C.primary }}>
          {loading ? "Salvando..." : "💾 SALVAR REGISTROS"}
        </button>
        <button onClick={handleExcel} style={{ ...btnBase, background:"#16a34a" }}>
          📊 EXPORTAR EXCEL
        </button>
        <button onClick={handlePDF} style={{ ...btnBase, background:C.red }}>
          📄 GERAR PDF
        </button>
      </div>
    </div>
  );
}

const Label   = ({children}) => <p style={{ margin:"0 0 5px", fontSize:11, color:C.textMuted, textTransform:"uppercase", letterSpacing:.9 }}>{children}</p>;
const card    = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:16, position:"relative" };
const secTitle= { margin:"0 0 16px", color:C.textSec, fontSize:15, fontWeight:700 };
const btnBase = { width:"100%", color:"#fff", border:"none", borderRadius:10, padding:"13px 0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif" };
const inp     = { width:"100%", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", color:C.text, fontSize:15, fontFamily:"'Inter',sans-serif", boxSizing:"border-box", outline:"none" };
const navBtn  = { background:"transparent", border:`1px solid ${C.border}`, color:C.text, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:18, fontFamily:"'Inter',sans-serif" };
