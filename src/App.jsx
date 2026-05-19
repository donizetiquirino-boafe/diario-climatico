import { useState } from "react";
import { C } from "./utils/theme";
import Registrar  from "./pages/Registrar";
import Historico  from "./pages/Historico";
import Graficos   from "./pages/Graficos";
import Relatorios    from "./pages/Relatorios";
import Mensal        from "./pages/Mensal";
import Pluviometrico from "./pages/Pluviometrico";

const USER = { uid: "IKgOWOLPuCRMvKNur6OH4fiE9ng1", email: "donizetiquirino@gmail.com" };
const PIN_CORRETO = "197326";

const TABS = [
  { key:"registrar",  label:"✏️ Registrar" },
  { key:"historico",  label:"📋 Histórico" },
  { key:"graficos",   label:"📈 Gráficos"  },
  { key:"relatorios", label:"📤 Relatórios" },
  { key:"mensal",        label:"📅 Mensal"        },
  { key:"pluviometrico", label:"🌧️ Pluviométrico" },
];

function TelaPIN({ onSuccess }) {
  const [pin, setPin]     = useState("");
  const [erro, setErro]   = useState(false);
  const [shake, setShake] = useState(false);

  const verificar = () => {
    if (pin === PIN_CORRETO) {
      sessionStorage.setItem("pin_ok", "1");
      onSuccess();
    } else {
      setErro(true);
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") verificar();
  };

  return (
    <div style={{
      minHeight:"100vh", background:C.bg, display:"flex",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'Inter',sans-serif", padding:16,
    }}>
      <div style={{
        background:C.surface, border:`1px solid ${C.border}`,
        borderRadius:20, padding:"40px 32px", width:"100%", maxWidth:340,
        textAlign:"center",
        animation: shake ? "shake 0.4s ease" : "none",
      }}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-6px)}
            80%{transform:translateX(6px)}
          }
        `}</style>

        <div style={{ fontSize:42, marginBottom:12 }}>🌡</div>
        <h2 style={{ margin:"0 0 4px", color:C.text, fontSize:20, fontWeight:800 }}>
          Diário Climático
        </h2>
        <p style={{ margin:"0 0 28px", color:C.textMuted, fontSize:13 }}>
          Digite o PIN para acessar
        </p>

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value); setErro(false); }}
          onKeyDown={handleKey}
          autoFocus
          placeholder="••••••"
          style={{
            width:"100%", background:C.surface2,
            border:`2px solid ${erro ? "#f87171" : pin.length > 0 ? C.primary : C.border}`,
            borderRadius:12, padding:"14px 16px", color:C.text,
            fontSize:24, textAlign:"center", letterSpacing:8,
            fontFamily:"'Inter',sans-serif", outline:"none",
            boxSizing:"border-box", transition:"border-color 0.2s",
          }}
        />

        {erro && (
          <p style={{ margin:"10px 0 0", color:"#f87171", fontSize:13 }}>
            PIN incorreto. Tente novamente.
          </p>
        )}

        <button onClick={verificar} style={{
          marginTop:20, width:"100%", background:C.primary, color:"#fff",
          border:"none", borderRadius:12, padding:"14px", fontSize:15,
          fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif",
          transition:"opacity 0.15s",
        }}>
          Entrar
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [aba, setAba]         = useState("registrar");
  const [autenticado, setAuth] = useState(
    sessionStorage.getItem("pin_ok") === "1"
  );

  if (!autenticado) {
    return <TelaPIN onSuccess={() => setAuth(true)} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"0 16px" }}>
          <div style={{ padding:"12px 0 0" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:22 }}>🌡</span>
              <span style={{ color:C.text, fontWeight:700, fontSize:17 }}>Diário Climático</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:0, marginTop:8, overflowX:"auto" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={()=>setAba(t.key)} style={{
                padding:"10px 18px", border:"none", cursor:"pointer", fontSize:13,
                fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap",
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
        {aba === "registrar"  && <Registrar  user={USER} />}
        {aba === "historico"  && <Historico  key={Date.now()} user={USER} />}
        {aba === "graficos"   && <Graficos   user={USER} />}
        {aba === "relatorios" && <Relatorios user={USER} />}
        {aba === "mensal"        && <Mensal        user={USER} />}
        {aba === "pluviometrico" && <Pluviometrico user={USER} />}
      </div>
    </div>
  );
}
