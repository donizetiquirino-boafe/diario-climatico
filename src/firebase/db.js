import {
  collection, doc, setDoc, getDocs, deleteDoc,
  query, where, orderBy, addDoc, getDoc, updateDoc
} from "firebase/firestore";
import { db } from "./config";

// ── helpers ───────────────────────────────────────────────────────
const leituraId = (uid, data, turno) => `${uid}_${data}_${turno}`;

// ── Temperatura / Umidade ─────────────────────────────────────────

export const salvarLeitura = async (uid, data, turno, temp, tempUmida, umidade, tempMax=null, tempMin=null, obs="") => {
  const id = leituraId(uid, data, turno);
  await setDoc(doc(db, "leituras", id), {
    uid, data, turno,
    temp:      parseFloat(temp),
    temp_umida: tempUmida !== null && tempUmida !== "" ? parseFloat(tempUmida) : null,
    umidade:   parseFloat(umidade),
    temp_max:  tempMax !== null && tempMax !== "" ? parseFloat(tempMax) : null,
    temp_min:  tempMin !== null && tempMin !== "" ? parseFloat(tempMin) : null,
    observacao: obs || "",
    atualizadoEm: new Date().toISOString()
  });
};

export const buscarLeiturasDia = async (uid, data) => {
  const q = query(
    collection(db, "leituras"),
    where("uid", "==", uid),
    where("data", "==", data)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};

export const buscarTodasLeituras = async (uid) => {
  const q = query(
    collection(db, "leituras"),
    where("uid", "==", uid),
    orderBy("data", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};

// ── Chuva ─────────────────────────────────────────────────────────

export const salvarChuva = async (uid, data, hora, mm, obs) => {
  await addDoc(collection(db, "chuvas"), {
    uid, data, hora,
    mm: parseFloat(mm),
    obs: obs || "",
    criadoEm: new Date().toISOString()
  });
};

export const buscarTodasChuvas = async (uid) => {
  const q = query(
    collection(db, "chuvas"),
    where("uid", "==", uid),
    orderBy("data", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const buscarChuvasDia = async (uid, data) => {
  const q = query(
    collection(db, "chuvas"),
    where("uid", "==", uid),
    where("data", "==", data),
    orderBy("hora", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deletarChuva = async (id) => {
  await deleteDoc(doc(db, "chuvas", id));
};

export const atualizarChuva = async (id, hora, mm, obs) => {
  await updateDoc(doc(db, "chuvas", id), {
    hora,
    mm: parseFloat(mm),
    obs: obs || "",
    atualizadoEm: new Date().toISOString()
  });
};
