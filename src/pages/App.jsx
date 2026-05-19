import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import { C } from "./utils/theme";
import Login      from "./pages/Login";
import Registrar  from "./pages/Registrar";
import Historico  from "./pages/Historico";
import Graficos   from "./pages/Graficos";
import Relatorios from "./pages/Relatorios";

const TABS = [
  { key:"registrar",  label:"✏️ Registrar" },
  { key:"historico",  label:"📋 Histórico" },
  { key:"graficos",   label:"📈 Gráficos"  },
  { key:"relatorios", label:"📤 Relatórios" },
];

export default function App() {
  const [user, setUser] = useState(undefined);
  const [aba,  setAba]  = useState("registrar");

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u || null));
  }, []);

  if (user === undefined) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:C.textMuted, fontFamily:"Georgia,serif" }}>Carregando...</p>
    </div>
  );

  if (!user) return <Login />;

  const handleSair = () => {
    if (confirm("Deseja sair da conta?")) signOut(auth);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Georgia,serif" }}>

      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"0 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0 0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:22 }}>🌡</span>
              <span style={{ color:C.text, fontWeight:700, fontSize:17 }}>Diário Climático</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 12px", maxWidth:200, overflow:"hidden" }}>
                <span style={{ color:C.textMuted, fontSize:11 }}>👤 </span>
                <span style={{ color:C.textSec, fontSize:12 }}>{user.email}</span>
              </div>
              <button onClick={handleSair} style={{
                background:C.red, border:"none", color:"#fff",
                borderRadius:8, padding:"6px 14px", cursor:"pointer",
                fontSize:13, fontWeight:700, fontFamily:"Georgia,serif"
              }}>
                Sair
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:0, marginTop:8, overflowX:"auto" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={()=>setAba(t.key)} style={{
                padding:"10px 18px", border:"none", cursor:"pointer", fontSize:13,
                fontFamily:"Georgia,serif", whiteSpace:"nowrap",
                background: aba===t.key ? C.primary : "transparent",
                color:      aba===t.key ? "#fff"    : C.textMuted,
                borderRadius:"8px 8px 0 0",
                fontWeight: aba===t.key ? 700 : 400,
                transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        {aba === "registrar"  && <Registrar  user={user} />}
        {aba === "historico"  && <Historico  user={user} />}
        {aba === "graficos"   && <Graficos   user={user} />}
        {aba === "relatorios" && <Relatorios user={user} />}
      </div>
    </div>
  );
}
