import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { TURNOS } from "./theme";

const agruparPorDia = (leituras, chuvas) => {
  const dias = [...new Set([
    ...leituras.map(l => l.data),
    ...chuvas.map(c => c.data)
  ])].sort((a, b) => b.localeCompare(a));

  return dias.map(data => {
    const ls = leituras.filter(l => l.data === data);
    const cs = chuvas.filter(c => c.data === data);
    const get = (turno, campo) => ls.find(l => l.turno === turno)?.[campo] ?? null;
    return {
      data,
      manha_temp:    get("manha", "temp"),
      manha_umi:     get("manha", "umidade"),
      tarde_temp:    get("tarde", "temp"),
      tarde_umi:     get("tarde", "umidade"),
      noite_temp:    get("noite", "temp"),
      noite_umi:     get("noite", "umidade"),
      chuvas:        cs,
      chuva_total:   cs.reduce((a, c) => a + c.mm, 0),
      chuva_eventos: cs.length,
    };
  });
};

const fmtTU = (temp, umi) => temp != null ? `${temp}C / ${umi}%` : "-";
const fmtChuva = (total, eventos, cs) => {
  if (eventos === 0) return "Sem chuva";
  const detalhes = cs.map(c => `${c.hora}: ${c.mm}mm${c.obs ? ` (${c.obs})` : ""}`).join(", ");
  return `${total.toFixed(1)}mm (${eventos}x)\n${detalhes}`;
};

export const exportarPDF = (leituras, chuvas, periodo = "") => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dias = agruparPorDia(leituras, chuvas);
  const temps = leituras.map(l => l.temp);
  const umis  = leituras.map(l => l.umidade);
  const cTotal = chuvas.reduce((a, c) => a + c.mm, 0);

  // Cabecalho simples fundo branco
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 30, "F");
  doc.setDrawColor(203, 213, 225);
  doc.line(0, 30, 210, 30);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Diario Climatico", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Relatorio gerado em ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 20);
  if (periodo) doc.text(`Periodo: ${periodo}`, 14, 26);

  // Cards de estatisticas - fundo claro
  const stats = [
    { l: "Temp. Max",   v: temps.length ? `${Math.max(...temps).toFixed(1)}C` : "-" },
    { l: "Temp. Min",   v: temps.length ? `${Math.min(...temps).toFixed(1)}C` : "-" },
    { l: "Temp. Media", v: temps.length ? `${(temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1)}C` : "-" },
    { l: "Umid. Media", v: umis.length  ? `${(umis.reduce((a,b)=>a+b,0)/umis.length).toFixed(0)}%` : "-" },
    { l: "Chuva Total", v: `${cTotal.toFixed(1)}mm` },
    { l: "Dias",        v: `${dias.length}` },
  ];

  let sx = 14;
  stats.forEach(s => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(sx, 34, 29, 18, 2, 2, "FD");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(s.l.toUpperCase(), sx + 2, 39);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(s.v, sx + 2, 47);
    doc.setFont("helvetica", "normal");
    sx += 31;
  });

  // Tabela principal - historico completo
  autoTable(doc, {
    startY: 58,
    head: [[
      "Data",
      "07:00\nTemp / Umi",
      "11:00\nTemp / Umi",
      "15:00\nTemp / Umi",
      "Chuva",
    ]],
    body: dias.map(d => [
      dayjs(d.data).format("DD/MM/YYYY"),
      fmtTU(d.manha_temp, d.manha_umi),
      fmtTU(d.tarde_temp, d.tarde_umi),
      fmtTU(d.noite_temp, d.noite_umi),
      fmtChuva(d.chuva_total, d.chuva_eventos, d.chuvas),
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
      lineColor: [51, 65, 85],
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 26 },
      1: { cellWidth: 36 },
      2: { cellWidth: 36 },
      3: { cellWidth: 36 },
      4: { cellWidth: 56 },
    },
    rowPageBreak: "avoid",
  });

  doc.save(`diario-climatico-${dayjs().format("YYYY-MM-DD")}.pdf`);
};

// Excel
export const exportarExcel = (leituras, chuvas) => {
  const wb = XLSX.utils.book_new();
  const dias = agruparPorDia(leituras, chuvas);

  const resumo = dias.map(d => ({
    "Data":              dayjs(d.data).format("DD/MM/YYYY"),
    "07:00 Temp (C)":   d.manha_temp ?? "",
    "07:00 Umidade (%)":d.manha_umi  ?? "",
    "11:00 Temp (C)":   d.tarde_temp ?? "",
    "11:00 Umidade (%)":d.tarde_umi  ?? "",
    "15:00 Temp (C)":   d.noite_temp ?? "",
    "15:00 Umidade (%)":d.noite_umi  ?? "",
    "Chuva Total (mm)": d.chuva_total > 0 ? d.chuva_total : 0,
    "Eventos Chuva":    d.chuva_eventos,
    "Detalhe Chuva":    d.chuvas.map(c => `${c.hora}: ${c.mm}mm${c.obs ? ` (${c.obs})` : ""}`).join(" | "),
  }));

  const ws1 = XLSX.utils.json_to_sheet(resumo);
  ws1["!cols"] = [{ wch:14 },{ wch:14 },{ wch:16 },{ wch:14 },{ wch:16 },{ wch:14 },{ wch:16 },{ wch:14 },{ wch:14 },{ wch:40 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Historico Completo");

  XLSX.writeFile(wb, `diario-climatico-${dayjs().format("YYYY-MM-DD")}.xlsx`);
};
