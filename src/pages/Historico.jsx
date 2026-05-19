import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { C, TURNOS, getTempColor } from "../utils/theme";
import { buscarTodasLeituras, buscarTodasChuvas, salvarLeitura, deletarChuva, atualizarChuva } from "../firebase/db";
import { db } from "../firebase/config";
import { doc, deleteDoc } from "firebase/firestore";

dayjs.locale("pt-br");

// ── Modal Editar Leitura ──────────────────────────────────────────
function ModalEditar({ leitura, onSalvar, onFechar }) {
  const [seca,    setSeca]    = useState(String(leitura.temp ?? ""));
  const [umida,   setUmida]   = useState(String(leitura.temp_umida ?? ""));
  const [rel,     setRel]     = useState(String(leitura.umidade ?? ""));
  const [tmax,    setTmax]    = useState(String(leitura.temp_max ?? ""));
  const [tmin,    setTmin]    = useState(String(leitura.temp_min ?? ""));
  const [obs,     setObs]     = useState(leitura.observacao ?? "");
  const isManha = leitura.turno === "manha";
  const turno = TURNOS.find(t => t.key === leitura.turno);

  const handleSalvar = () => {
    onSalvar(leitura.data, leitura.turno, seca, umida, rel,
      isManha ? tmax : null, isManha ? tmin : null, isManha ? obs : "");
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:16 }}>
      <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:20,width:"100%",maxWidth:400 }}>
        <h3 style={{ color:C.text,margin:"0 0 16px",fontSize:15 }}>✏️ {turno?.hora} · {dayjs(leitura.data).format("DD/MM/YYYY")}</h3>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10 }}>
          <div><p style={lbl}>Seca °C</p><input type="number" step="0.1" value={seca} onChange={e=>setSeca(e.target.value)} style={inp}/></div>
          <div><p style={lbl}>Úmida °C</p><input type="number" step="0.1" value={umida} onChange={e=>setUmida(e.target.value)} style={inp}/></div>
          <div><p style={lbl}>Relativa %</p><input type="number" value={rel} onChange={e=>setRel(e.target.value)} style={inp}/></div>
        </div>
        {isManha && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
            <div><p style={lbl}>Máxima °C</p><input type="number" step="0.1" value={tmax} onChange={e=>setTmax(e.target.value)} style={inp}/></div>
            <div><p style={lbl}>Mínima °C</p><input type="number" step="0.1" value={tmin} onChange={e=>setTmin(e.target.value)} style={inp}/></div>
          </div>
        )}
        {isManha && (
          <div style={{ marginBottom:14 }}>
            <p style={lbl}>Observação</p>
            <input type="text" value={obs} onChange={e=>setObs(e.target.value)} style={inp}/>
          </div>
        )}
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={handleSalvar} style={{ flex:1,background:C.primary,color:"#fff",border:"none",borderRadius:8,padding:"11px 0",fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:14 }}>💾 Salvar</button>
          <button onClick={onFechar} style={{ flex:1,background:C.surface2,color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 0",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:14 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Editar Chuva ────────────────────────────────────────────
function ModalEditarChuva({ chuva, onSalvar, onFechar }) {
  const [mm,   setMm]   = useState(String(chuva.mm));
  const [hora, setHora] = useState(chuva.hora || "");
  const [obs,  setObs]  = useState(chuva.obs  || "");

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:16 }}>
      <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:20,width:"100%",maxWidth:380 }}>
        <h3 style={{ color:C.text,margin:"0 0 16px",fontSize:15 }}>✏️ 🌧 Chuva · {dayjs(chuva.data).format("DD/MM/YYYY")}</h3>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10 }}>
          <div><p style={lbl}>Volume (mm)</p><input type="number" step="0.1" value={mm} onChange={e=>setMm(e.target.value)} style={inp}/></div>
          <div><p style={lbl}>Horário</p><input type="text" placeholder="00:00" value={hora} onChange={e=>setHora(e.target.value)} style={inp}/></div>
        </div>
        <div style={{ marginBottom:16 }}>
          <p style={lbl}>Observação</p>
          <input type="text" value={obs} onChange={e=>setObs(e.target.value)} style={inp}/>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={()=>onSalvar(chuva.id,hora,mm,obs)} style={{ flex:1,background:C.primary,color:"#fff",border:"none",borderRadius:8,padding:"11px 0",fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:14 }}>💾 Salvar</button>
          <button onClick={onFechar} style={{ flex:1,background:C.surface2,color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 0",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:14 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Detalhe do Dia ──────────────────────────────────────────
function ModalDia({ data, leituras, chuvas, onEditar, onDeletarLeitura, onEditarChuva, onDeletarChuva, onFechar }) {
  const cs = chuvas;
  const cTotal = cs.reduce((a,c) => a + c.mm, 0);
  const dateFmt = dayjs(data).format("DD/MM/YYYY");
  const diaSemana = dayjs(data).format("dddd");

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:500,padding:"16px 12px",overflowY:"auto" }}
      onClick={e=>{ if(e.target===e.currentTarget) onFechar(); }}>
      <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:480,marginTop:8 }}>

        {/* Cabeçalho */}
        <div style={{ padding:"16px 18px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <p style={{ margin:0,fontSize:18,fontWeight:800,color:C.primary }}>📌 {dateFmt}</p>
            <p style={{ margin:"2px 0 0",fontSize:12,color:C.textMuted,textTransform:"capitalize" }}>{diaSemana}</p>
          </div>
          <button onClick={onFechar} style={{ background:"transparent",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:18,fontFamily:"'Inter',sans-serif" }}>✕</button>
        </div>

        <div style={{ padding:"12px 14px" }}>

          {/* Leituras por turno */}
          {TURNOS.map(t => {
            const r = leituras.find(l => l.turno === t.key);
            if (!r) return null;
            return (
              <div key={t.key} style={{ background:C.surface2,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:10,borderLeft:`4px solid ${t.color}` }}>
                {/* data + hora */}
                <div style={{ display:"flex",gap:14,alignItems:"center",marginBottom:10 }}>
                  <span style={{ fontSize:13,color:C.textMuted }}>📅 {dateFmt}</span>
                  <span style={{ fontSize:13,color:t.color,fontWeight:700 }}>🕐 {t.hora}</span>
                </div>

                {/* medições */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8 }}>
                  <Row ico="🌡" label="Seca" val={`${r.temp}°C`} cor={getTempColor(r.temp)}/>
                  {r.temp_umida != null && <Row ico="💧" label="Úmida" val={`${r.temp_umida}°C`} cor="#7dd3fc"/>}
                  <Row ico="💧" label="Relativa" val={`${r.umidade}%`} cor={C.green}/>
                  {t.key === "manha" && r.temp_max != null && <Row ico="🔺" label="Máx" val={`${r.temp_max}°C`} cor="#f87171"/>}
                  {t.key === "manha" && r.temp_min != null && <Row ico="🔻" label="Mín" val={`${r.temp_min}°C`} cor="#7dd3fc"/>}
                </div>

                {/* chuva total do dia (só na primeira leitura) */}
                {t.key === "manha" && (
                  <div style={{ marginBottom: r.observacao ? 8 : 0 }}>
                    <Row ico="☁️" label="Chuva" val={`${cTotal.toFixed(1)} mm`} cor={C.purple}/>
                  </div>
                )}

                {/* observação */}
                {r.observacao ? <p style={{ margin:"6px 0 10px",fontSize:13,color:C.textMuted,fontStyle:"italic" }}>📝 Obs: {r.observacao}</p> : null}

                {/* botões */}
                <div style={{ display:"flex",gap:8,marginTop:4 }}>
                  <button onClick={()=>onEditar(r)} style={btnAcao(C.primary)}>✏️ Editar</button>
                  <button onClick={()=>onDeletarLeitura(r)} style={btnAcao(C.red)}>🗑 Excluir</button>
                </div>
              </div>
            );
          })}

          {/* Chuvas detalhadas */}
          {cs.length > 0 && (
            <div style={{ background:C.surface2,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:10 }}>
              <p style={{ margin:"0 0 10px",color:C.purple,fontWeight:700,fontSize:14 }}>🌧 Eventos de Chuva</p>
              {cs.map(c => (
                <div key={c.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:8,marginBottom:8,borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <span style={{ color:C.purple,fontWeight:700,fontSize:15 }}>{c.mm}mm</span>
                    <span style={{ color:C.textMuted,fontSize:13,marginLeft:10 }}>🕐 {c.hora}</span>
                    {c.obs && <p style={{ margin:"2px 0 0",fontSize:12,color:C.textMuted,fontStyle:"italic" }}>{c.obs}</p>}
                  </div>
                  <div style={{ display:"flex",gap:6 }}>
                    <button onClick={()=>onEditarChuva(c)} style={btnAcao(C.primary)}>✏️</button>
                    <button onClick={()=>onDeletarChuva(c.id)} style={btnAcao(C.red)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Se não tem nada registrado */}
          {leituras.length === 0 && cs.length === 0 && (
            <p style={{ color:C.textMuted,textAlign:"center",padding:20 }}>Nenhum dado registrado.</p>
          )}

          <button onClick={onFechar} style={{ width:"100%",background:C.surface2,border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:10,padding:"11px 0",cursor:"pointer",fontSize:14,fontFamily:"'Inter',sans-serif",marginTop:4 }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

const Row = ({ ico, label, val, cor }) => (
  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
    <span style={{ fontSize:14 }}>{ico}</span>
    <span style={{ fontSize:13,color:C.textMuted }}>{label}:</span>
    <span style={{ fontSize:14,fontWeight:700,color: cor || C.text }}>{val}</span>
  </div>
);

// ── Tela principal ────────────────────────────────────────────────
export default function Historico({ user }) {
  const [leituras,      setLeituras]      = useState([]);
  const [chuvas,        setChuvas]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [diaSelecionado,setDiaSelecionado] = useState(null);
  const [editando,      setEditando]      = useState(null);
  const [editandoChuva, setEditandoChuva] = useState(null);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg,cor=C.green) => { setToast({msg,cor}); setTimeout(()=>setToast(null),2500); };

  const carregar = async () => {
    const [ls,cs] = await Promise.all([buscarTodasLeituras(user.uid), buscarTodasChuvas(user.uid)]);
    setLeituras(ls); setChuvas(cs); setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const dias = [...new Set([...leituras.map(l=>l.data), ...chuvas.map(c=>c.data)])].sort((a,b)=>b.localeCompare(a));

  const handleEditar = async (data, turno, seca, umida, rel, tmax, tmin, obs) => {
    await salvarLeitura(user.uid, data, turno, seca, umida, rel, tmax, tmin, obs);
    showToast("✓ Leitura atualizada!"); setEditando(null); carregar();
  };

  const handleDeletarLeitura = async (leitura) => {
    const tl = TURNOS.find(t=>t.key===leitura.turno)?.hora;
    if (!confirm(`Excluir ${tl} de ${dayjs(leitura.data).format("DD/MM/YYYY")}?`)) return;
    await deleteDoc(doc(db,"leituras",`${user.uid}_${leitura.data}_${leitura.turno}`));
    showToast("Excluído.",C.red);
    setDiaSelecionado(null);
    carregar();
  };

  const handleDeletarChuva = async (id) => {
    if (!confirm("Excluir este evento de chuva?")) return;
    await deletarChuva(id); showToast("Excluído.",C.red);
    setDiaSelecionado(null);
    carregar();
  };

  const handleEditarChuva = async (id, hora, mm, obs) => {
    await atualizarChuva(id, hora, mm, obs);
    showToast("✓ Chuva atualizada!"); setEditandoChuva(null); carregar();
  };

  if (loading) return <div style={{ color:C.textMuted,textAlign:"center",padding:60,fontFamily:"'Inter',sans-serif" }}>Carregando...</div>;
  if (!dias.length) return (
    <div style={{ color:C.textMuted,textAlign:"center",padding:60,fontFamily:"'Inter',sans-serif" }}>
      <p style={{ fontSize:40 }}>📋</p><p>Nenhum registro ainda.</p>
    </div>
  );

  return (
    <div style={{ padding:12,maxWidth:700,margin:"0 auto",fontFamily:"'Inter',sans-serif" }}>
      {toast && <div style={{ position:"fixed",top:16,right:16,left:16,background:toast.cor,color:"#fff",padding:"12px 16px",borderRadius:10,fontWeight:700,fontSize:14,zIndex:999,textAlign:"center" }}>{toast.msg}</div>}

      {/* Modal detalhe */}
      {diaSelecionado && (
        <ModalDia
          data={diaSelecionado}
          leituras={leituras.filter(l=>l.data===diaSelecionado)}
          chuvas={chuvas.filter(c=>c.data===diaSelecionado)}
          onEditar={r=>{ setEditando(r); }}
          onDeletarLeitura={handleDeletarLeitura}
          onEditarChuva={c=>setEditandoChuva(c)}
          onDeletarChuva={handleDeletarChuva}
          onFechar={()=>setDiaSelecionado(null)}
        />
      )}

      {editando      && <ModalEditar      leitura={editando}      onSalvar={handleEditar}      onFechar={()=>setEditando(null)} />}
      {editandoChuva && <ModalEditarChuva chuva={editandoChuva}   onSalvar={handleEditarChuva} onFechar={()=>setEditandoChuva(null)} />}

      {/* Lista de dias */}
      {dias.map(d => {
        const ls = leituras.filter(l=>l.data===d);
        const cs = chuvas.filter(c=>c.data===d);
        const cTotal = cs.reduce((a,c)=>a+c.mm,0);
        const temDados = ls.length > 0;

        return (
          <div key={d} onClick={()=>setDiaSelecionado(d)}
            style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:10,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer" }}>
            <div>
              <p style={{ margin:0,color:C.text,fontSize:15,fontWeight:700 }}>{dayjs(d).format("DD/MM/YYYY")}</p>
              <p style={{ margin:"3px 0 0",color:C.textMuted,fontSize:12,textTransform:"capitalize" }}>{dayjs(d).format("dddd")}</p>
              {temDados && (
                <p style={{ margin:"4px 0 0",fontSize:12,color:C.textSec }}>
                  {ls.length} turno{ls.length>1?"s":""} registrado{ls.length>1?"s":""}
                </p>
              )}
            </div>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
              {cs.length > 0
                ? <span style={{ background:"#312e81",color:"#a5b4fc",borderRadius:20,padding:"3px 12px",fontSize:12,whiteSpace:"nowrap" }}>🌧 {cTotal.toFixed(1)}mm</span>
                : <span style={{ fontSize:18 }}>☀️</span>
              }
              <span style={{ color:C.textMuted,fontSize:11 }}>ver detalhes ›</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const btnAcao = (cor) => ({ background:cor,border:"none",color:"#fff",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Inter',sans-serif" });
const lbl = { margin:"0 0 5px",fontSize:11,color:C.textMuted,textTransform:"uppercase",letterSpacing:.9 };
const inp = { width:"100%",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:15,fontFamily:"'Inter',sans-serif",boxSizing:"border-box",outline:"none" };
