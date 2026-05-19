export const TURNOS = [
  { key: "manha", label: "Manhã",  hora: "07:00", emoji: "🌅", color: "#7dd3fc" },
  { key: "tarde", label: "Tarde",  hora: "11:00", emoji: "☀️", color: "#fbbf24" },
  { key: "noite", label: "Noite",  hora: "15:00", emoji: "🌙", color: "#818cf8" },
];

export const getTempColor = (t) => {
  if (t === null || t === undefined) return "#475569";
  if (t <= 15) return "#7dd3fc";
  if (t <= 20) return "#34d399";
  if (t <= 26) return "#fbbf24";
  return "#f87171";
};

export const C = {
  bg:        "#020817",
  surface:   "#0f172a",
  surface2:  "#1e293b",
  border:    "#334155",
  primary:   "#0ea5e9",
  purple:    "#818cf8",
  green:     "#34d399",
  yellow:    "#fbbf24",
  red:       "#f87171",
  blue:      "#7dd3fc",
  text:      "#f1f5f9",
  textSec:   "#94a3b8",
  textMuted: "#475569",
  textDim:   "#334155",
};
