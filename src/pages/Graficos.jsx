import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, ResponsiveContainer
} from "recharts";
import { C, TURNOS, getTempColor } from "../utils/theme";
import { buscarTodasLeituras, buscarTodasChuvas } from "../firebase/db";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontFamily:"'Inter',sans-serif" }}>
      <p style={{ color:C.textMuted, fontSize:11, margin:"0 0 6px" }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color, margin:"2px 0", fontSize:13 }}>
          {p.name}: <strong>{p.value ?? "—"}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Graficos({ user }) {
  const [leituras, setLeituras] = useState([]);
  const [chuvas,   setChuvas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [periodo,  setPeriodo]  = useState(30);

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

  const corte = dayjs().subtract(periodo, "day").format("YYYY-MM-DD");

  const lFilt = useMemo(() => leituras.filter(l => l.data >= corte), [leituras, corte]);
  const cFilt = useMemo(() => chuvas.filter(c => c.data >= corte), [chuvas, corte]);

  const dias = useMemo(() => {
    const set = new Set([...lFilt.map(l=>l.data), ...cFilt.map(c=>c.data)]);
    return [...set].sort();
  }, [lFilt, cFilt]);

  const chartData = useMemo(() => dias.map(d => {
    const ls = lFilt.filter(l => l.data === d);
    const cs = cFilt.filter(c => c.data === d);
    const get = (turno, campo) => ls.find(l => l.turno === turno)?.[campo] ?? null;
    return {
      dia: d.slice(5),
      "Manhã": get("manha","temp"),
      "Tarde": get("tarde","temp"),
      "Noite": get("noite","temp"),
      "Umi Manhã": get("manha","umidade"),
      "Umi Tarde": get("tarde","umidade"),
      "Umi Noite": get("noite","umidade"),
      "Chuva": cs.length ? +cs.reduce((a,c)=>a+c.mm,0).toFixed(1) : 0,
    };
  }), [dias, lFilt, cFilt]);

  const stats = useMemo(() => {
    const temps = lFilt.map(l => l.temp);
    const umis  = lFilt.map(l => l.umidade);
    if (!temps.length) return null;
    return {
      tMax: Math.max(...temps).toFixed(1),
      tMin: Math.min(...temps).toFixed(1),
      tMed: (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1),
      uMed: (umis.reduce((a,b)=>a+b,0)/umis.length).toFixed(0),
      cTotal: cFilt.reduce((a,c)=>a+c.mm,0).toFixed(1),
      cEv: cFilt.length,
    };
  }, [lFilt, cFilt]);

  if (loading) return <div style={{ color:C.textMuted, textAlign:"center", padding:60, fontFamily:"'Inter',sans-serif" }}>Carregando...</div>;

  return (
    <div style={{ padding:16, maxWidth:900, margin:"0 auto", fontFamily:"'Inter',sans-serif" }}>

      {/* filtro período */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {[7,15,30,90,365].map(d => (
          <button key={d} onClick={()=>setPeriodo(d)} style={{
            padding:"7px 16px", borderRadius:20, border:`1px solid ${C.border}`,
            background: periodo===d ? C.primary : C.surface,
            color: periodo===d ? "#fff" : C.textMuted,
            cursor:"pointer", fontSize:13, fontFamily:"'Inter',sans-serif", fontWeight: periodo===d ? 700 : 400,
          }}>
            {d === 365 ? "1 ano" : `${d} dias`}
          </button>
        ))}
      </div>

      {/* estatísticas */}
      {stats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          {[
            { l:"Temp. Máx",    v:`${stats.tMax}°C`,    c:C.red    },
            { l:"Temp. Mín",    v:`${stats.tMin}°C`,    c:C.blue   },
            { l:"Temp. Média",  v:`${stats.tMed}°C`,    c:C.yellow },
            { l:"Umid. Média",  v:`${stats.uMed}%`,     c:C.green  },
            { l:"Chuva Total",  v:`${stats.cTotal}mm`,  c:C.purple },
            { l:"Eventos",      v:`${stats.cEv}x`,      c:"#a78bfa"},
          ].map((s,i) => (
            <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
              <p style={{ margin:"0 0 4px", fontSize:9, color:C.textMuted, textTransform:"uppercase", letterSpacing:1 }}>{s.l}</p>
              <p style={{ margin:0, fontSize:22, fontWeight:800, color:s.c }}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* gráfico temperatura */}
      <div style={chartCard}>
        <p style={chartTitle}>🌡 Temperatura por turno (°C)</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top:5, right:10, left:-15, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.surface2} />
            <XAxis dataKey="dia" tick={{ fill:C.textMuted, fontSize:11 }} tickLine={false} />
            <YAxis tick={{ fill:C.textMuted, fontSize:11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:12, color:C.textMuted }} />
            <Line type="monotone" dataKey="Manhã" stroke="#7dd3fc" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="Tarde" stroke="#fbbf24" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="Noite" stroke="#818cf8" strokeWidth={2} dot={{ r:3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* gráfico umidade */}
      <div style={chartCard}>
        <p style={chartTitle}>💧 Umidade por turno (%)</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top:5, right:10, left:-15, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.surface2} />
            <XAxis dataKey="dia" tick={{ fill:C.textMuted, fontSize:11 }} tickLine={false} />
            <YAxis domain={[0,100]} tick={{ fill:C.textMuted, fontSize:11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:12, color:C.textMuted }} />
            <Line type="monotone" dataKey="Umi Manhã" stroke="#7dd3fc" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="Umi Tarde" stroke="#fbbf24" strokeWidth={2} dot={{ r:3 }} connectNulls />
            <Line type="monotone" dataKey="Umi Noite" stroke="#818cf8" strokeWidth={2} dot={{ r:3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* gráfico chuva */}
      <div style={chartCard}>
        <p style={chartTitle}>🌧 Chuva acumulada por dia (mm)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top:5, right:10, left:-15, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.surface2} />
            <XAxis dataKey="dia" tick={{ fill:C.textMuted, fontSize:11 }} tickLine={false} />
            <YAxis tick={{ fill:C.textMuted, fontSize:11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Chuva" name="Chuva (mm)" fill={C.purple} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const chartCard = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:16 };
const chartTitle = { margin:"0 0 16px", color:C.textSec, fontSize:14, fontWeight:700 };
