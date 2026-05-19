import { useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, provider } from "../firebase/config";
import { C } from "../utils/theme";

export default function Login() {
  const [modo,    setModo]    = useState("login");
  const [email,   setEmail]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [erro,    setErro]    = useState("");
  const [ok,      setOk]      = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setErro(""); setOk(""); };

  const handleGoogle = async () => {
    try { await signInWithPopup(auth, provider); }
    catch { setErro("Erro ao entrar com Google."); }
  };

  const handleEmailLogin = async () => {
    reset(); setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, senha); }
    catch { setErro("E-mail ou senha incorretos."); }
    setLoading(false);
  };

  const handleCadastro = async () => {
    reset(); setLoading(true);
    try { await createUserWithEmailAndPassword(auth, email, senha); }
    catch (e) {
      if (e.code === "auth/email-already-in-use") setErro("E-mail já cadastrado.");
      else if (e.code === "auth/weak-password")   setErro("Senha fraca — mínimo 6 caracteres.");
      else setErro("Erro ao cadastrar.");
    }
    setLoading(false);
  };

  const handleRecuperar = async () => {
    reset(); setLoading(true);
    try { await sendPasswordResetEmail(auth, email); setOk("E-mail de recuperação enviado!"); }
    catch { setErro("E-mail não encontrado."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',sans-serif" }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"40px 36px", maxWidth:360, width:"90%", boxShadow:"0 25px 60px rgba(0,0,0,0.5)" }}>

        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:48 }}>🌡</div>
          <h1 style={{ color:C.text, margin:"8px 0 4px", fontSize:22, fontWeight:700 }}>Diário Climático</h1>
          <p style={{ color:C.textMuted, fontSize:13 }}>
            {modo === "login" ? "Entre na sua conta" : modo === "cadastro" ? "Crie sua conta" : "Recuperar senha"}
          </p>
        </div>

        <div style={{ marginBottom:12 }}>
          <p style={lbl}>E-mail</p>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);reset();}} placeholder="seu@email.com" style={inp} />
        </div>

        {modo !== "recuperar" && (
          <div style={{ marginBottom:16 }}>
            <p style={lbl}>Senha</p>
            <input type="password" value={senha} onChange={e=>{setSenha(e.target.value);reset();}} placeholder="••••••••" style={inp} />
          </div>
        )}

        {erro && <p style={{ color:C.red,   fontSize:13, margin:"0 0 12px", textAlign:"center" }}>{erro}</p>}
        {ok   && <p style={{ color:C.green, fontSize:13, margin:"0 0 12px", textAlign:"center" }}>{ok}</p>}

        {modo === "login"     && <button onClick={handleEmailLogin} disabled={loading} style={btnBlue}>{loading ? "Entrando..."    : "🔑 Entrar"}</button>}
        {modo === "cadastro"  && <button onClick={handleCadastro}  disabled={loading} style={btnBlue}>{loading ? "Cadastrando..." : "✅ Criar conta"}</button>}
        {modo === "recuperar" && <button onClick={handleRecuperar} disabled={loading} style={btnBlue}>{loading ? "Enviando..."    : "📧 Enviar link de recuperação"}</button>}

        <div style={{ textAlign:"center", marginTop:14, fontSize:13 }}>
          {modo === "login" && <>
            <span style={{ color:C.textMuted }}>Não tem conta? </span>
            <span style={lnk} onClick={()=>{setModo("cadastro");reset();}}>Cadastrar</span><br/>
            <span style={lnk} onClick={()=>{setModo("recuperar");reset();}}>Esqueci minha senha</span>
          </>}
          {modo !== "login" && <span style={lnk} onClick={()=>{setModo("login");reset();}}>← Voltar ao login</span>}
        </div>

        {modo === "login" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"20px 0" }}>
            <div style={{ flex:1, height:1, background:C.border }}/><span style={{ color:C.textMuted, fontSize:12 }}>ou</span><div style={{ flex:1, height:1, background:C.border }}/>
          </div>
          <button onClick={handleGoogle} style={btnGoogle}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>
        </>}
      </div>
    </div>
  );
}

const lbl     = { margin:"0 0 5px", fontSize:11, color:"#475569", textTransform:"uppercase", letterSpacing:.9 };
const inp     = { width:"100%", background:"#1e293b", border:"1px solid #334155", borderRadius:8, padding:"11px 12px", color:"#f1f5f9", fontSize:15, fontFamily:"'Inter',sans-serif", boxSizing:"border-box", outline:"none" };
const btnBlue = { width:"100%", background:"#0ea5e9", color:"#fff", border:"none", borderRadius:10, padding:"13px 0", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif" };
const btnGoogle = { width:"100%", background:"#fff", color:"#1f2937", border:"none", borderRadius:10, padding:"12px 0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:10 };
const lnk     = { color:"#0ea5e9", cursor:"pointer", textDecoration:"underline" };
