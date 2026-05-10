"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

// ── Supabase ───────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/client";
const CASAL_ID = "casal"; // linha única compartilhada pelo casal

// ── Mobile hook ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

// ── Constants ──────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const CARD_COLORS = ["#7C3AED","#EF4444","#0EA5E9","#22C55E","#F59E0B","#EC4899","#8B5CF6","#14B8A6"];
const fmt = (v) => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(v || 0);
const fmtK = (v) => Math.abs(v||0) >= 1000 ? `R$${((v||0)/1000).toFixed(1)}k` : `R$${(v||0).toFixed(0)}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const emptyYear = () => Array.from({ length:12 }, (_, i) => ({ month:i, receitas:[], despesas:[], investimentos:[] }));
const sumArr = (arr) => (arr||[]).reduce((s, x) => s + (x.valor||0), 0);

// ── Styles: LIGHT THEME ────────────────────────────────────────────────────
const T = {
  // layout
  bg: "#F1F5F9",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFC",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  // text
  text: "#0F172A",
  textSub: "#64748B",
  textMuted: "#94A3B8",
  // accent
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
  green: "#16A34A",
  greenLight: "#DCFCE7",
  red: "#DC2626",
  redLight: "#FEE2E2",
  blue: "#0284C7",
  blueLight: "#E0F2FE",
  amber: "#D97706",
  amberLight: "#FEF3C7",
};

const shadow = "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)";
const shadowMd = "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)";

// helpers
const card = (extra) => ({ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"18px", boxShadow:shadow, marginBottom:"14px", ...extra });
const metCard = (col, lightCol) => ({ background:T.surface, border:`1px solid ${col}30`, borderRadius:"12px", padding:"18px", boxShadow:shadow, position:"relative", overflow:"hidden" });
const btnPrimary = (col="#7C3AED") => ({ padding:"9px 18px", borderRadius:"9px", border:"none", cursor:"pointer", background:col, color:"#fff", fontWeight:600, fontSize:"13px", boxShadow:`0 2px 8px ${col}40` });
const btnOutline = (col="#7C3AED") => ({ padding:"8px 16px", borderRadius:"9px", border:`1.5px solid ${col}`, cursor:"pointer", background:"transparent", color:col, fontWeight:600, fontSize:"12px" });
const btnGhost = { padding:"8px 14px", borderRadius:"9px", border:`1px solid ${T.border}`, cursor:"pointer", background:T.surface, color:T.textSub, fontWeight:600, fontSize:"12px" };
const inpStyle = { background:T.surface, border:`1.5px solid ${T.borderStrong}`, borderRadius:"9px", padding:"9px 13px", color:T.text, fontSize:"13px", outline:"none", flex:1, minWidth:"90px" };
const inpDate = { background:T.surface, border:`1.5px solid ${T.borderStrong}`, borderRadius:"9px", padding:"9px 13px", color:T.text, fontSize:"13px", outline:"none", width:"155px" };
const selStyle = { background:T.surface, border:`1.5px solid ${T.borderStrong}`, borderRadius:"9px", padding:"9px 13px", color:T.text, fontSize:"13px", outline:"none", flex:1 };
const tag = (bg, col) => ({ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:"20px", fontSize:"11px", fontWeight:600, background:bg, color:col });
const chip2 = (col) => ({ display:"inline-flex", padding:"2px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:700, background:`${col}15`, color:col, border:`1px solid ${col}30` });
const navI = (a) => ({ display:"flex", alignItems:"center", gap:"10px", padding:"9px 12px", borderRadius:"10px", cursor:"pointer", color: a ? T.purple : T.textSub, background: a ? T.purpleLight : "transparent", fontWeight: a ? 600 : 400, fontSize:"14px", transition:"all 0.15s" });
const subNavI = (a) => ({ display:"flex", alignItems:"center", gap:"8px", padding:"7px 12px", borderRadius:"8px", cursor:"pointer", color: a ? T.purple : T.textSub, background: a ? T.purpleLight : "transparent", fontWeight: a ? 600 : 400, fontSize:"13px" });
const toggleB = (a) => ({ padding:"6px 14px", borderRadius:"8px", border:"none", cursor:"pointer", background: a ? T.purple : "transparent", color: a ? "#fff" : T.textSub, fontSize:"12px", fontWeight:600, transition:"all 0.15s" });
const remB = { background:T.redLight, border:`1px solid #FECACA`, color:T.red, borderRadius:"6px", cursor:"pointer", padding:"3px 8px", fontSize:"11px", fontWeight:600 };
const itemRow = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:"10px", marginBottom:"5px", background:T.surfaceAlt, border:`1px solid ${T.border}` };
const subT = (a) => ({ padding:"7px 16px", borderRadius:"20px", border:`1.5px solid ${a ? T.purple : T.border}`, background: a ? T.purpleLight : "transparent", color: a ? T.purple : T.textSub, fontSize:"12px", fontWeight:600, cursor:"pointer" });
const tbl = { width:"100%", borderCollapse:"collapse", fontSize:"13px" };
const th = { padding:"10px 12px", textAlign:"left", color:T.textSub, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" };
const td = { padding:"9px 12px", borderBottom:`1px solid ${T.border}`, color:T.text, verticalAlign:"middle" };

// ── Tooltip ─────────────────────────────────────────────────────────────────
function CT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"10px 14px", fontSize:"12px", boxShadow:shadowMd }}>
      <p style={{ color:T.textSub, marginBottom:"5px", fontWeight:600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color:p.color, margin:"2px 0" }}>{p.name||p.dataKey}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

// ── EntryForm (fora do App para evitar remount a cada render) ─────────────
function EntryForm({ type, label, col, list, form, setForm, today, onAdd, onRemove, currentMonth }) {
  const k = type === "receita" ? "receita" : type === "despesa" ? "despesa" : "invest";
  return (
    <div style={card()}>
      <p style={{ fontSize:"13px", fontWeight:700, color:col, marginBottom:"12px" }}>{label}</p>
      <div style={{ display:"flex", gap:"8px", marginBottom:"10px", flexWrap:"wrap" }}>
        <input
          style={inpStyle}
          placeholder="Descrição"
          value={form[k]}
          onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
        />
        <input
          style={{ ...inpStyle, maxWidth:"130px" }}
          placeholder="R$ Valor"
          type="number"
          step="0.01"
          value={form[k+"Val"]}
          onChange={e => setForm(f => ({ ...f, [k+"Val"]: e.target.value }))}
        />
        <input
          type="date"
          style={inpDate}
          value={form[k+"Date"] || today}
          onChange={e => setForm(f => ({ ...f, [k+"Date"]: e.target.value }))}
        />
        <button style={btnPrimary(col)} onClick={() => onAdd(type)}>+ Adicionar</button>
      </div>
      {list.length === 0 ? (
        <p style={{ color:T.textMuted, fontSize:"13px", textAlign:"center", padding:"16px 0" }}>Nenhum item lançado</p>
      ) : list.map(item => (
        <div key={item.id} style={itemRow}>
          <div>
            <p style={{ color:T.text, fontSize:"13px", fontWeight:500, margin:0 }}>{item.desc}</p>
            <p style={{ color:T.textMuted, fontSize:"11px", margin:0 }}>{item.date}</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ color:col, fontWeight:700, fontSize:"14px" }}>{fmt(item.valor)}</span>
            <button style={remB} onClick={() => onRemove(currentMonth, type, item.id)}>✕</button>
          </div>
        </div>
      ))}
      <div style={{ textAlign:"right", borderTop:`1px solid ${T.border}`, paddingTop:"8px", marginTop:"6px" }}>
        <span style={{ color:T.textSub, fontSize:"12px" }}>Total: </span>
        <span style={{ color:col, fontWeight:700, fontSize:"14px" }}>{fmt(sumArr(list))}</span>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date().toISOString().split("T")[0];
  const CY = 2026;
  const nowM = new Date().getMonth();
  const yrMs = Array.from({ length:12 }, (_, i) => i);

  // state
  const [data, setData] = useState(emptyYear());
  const [cartoes, setCartoes] = useState([]);
  const [usoCartoes, setUsoCartoes] = useState([]);
  const [pagamentos, setPagamentos] = useState({});
  const [activeSection, setActiveSection] = useState("dashboard");
  const [cardSub, setCardSub] = useState("cadastro");
  const [faturaTab, setFaturaTab] = useState("apagar");
  const [view, setView] = useState("mes");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [form, setForm] = useState({ receita:"", receitaVal:"", receitaDate:"", despesa:"", despesaVal:"", despesaDate:"", invest:"", investVal:"", investDate:"" });
  const [novoCartao, setNovoCartao] = useState({ nome:"", diaFechamento:"", diaPagamento:"" });
  const [novoUso, setNovoUso] = useState({ cartaoId:"", data:"", descricao:"", valor:"", parcelas:"1" });
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLote, setShowLote] = useState(false);
  const [loteText, setLoteText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState(null);
  // sync
  const [syncUrl, setSyncUrl] = useState("");
  const [syncMonth, setSyncMonth] = useState(new Date().getMonth());
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncPreview, setSyncPreview] = useState(null); // { receitas, despesas, month }

  // storage load
  useEffect(() => {
    const supabase = createClient();
    // Carrega dados do Supabase
    const loadData = async () => {
      try {
        const { data: row } = await supabase
          .from("financas_compartilhadas")
          .select("*")
          .eq("id", CASAL_ID)
          .single();
        if (row) {
          // Garante estrutura correta de 12 meses
          if (row.data && Array.isArray(row.data) && row.data.length > 0) {
            const base = emptyYear();
            row.data.forEach((m, i) => {
              if (i < 12 && m) base[i] = {
                ...base[i],
                receitas: Array.isArray(m.receitas) ? m.receitas : [],
                despesas: Array.isArray(m.despesas) ? m.despesas : [],
                investimentos: Array.isArray(m.investimentos) ? m.investimentos : [],
              };
            });
            setData(base);
          }
          if (row.cartoes && Array.isArray(row.cartoes)) setCartoes(row.cartoes);
          if (row.uso_cartoes && Array.isArray(row.uso_cartoes)) setUsoCartoes(row.uso_cartoes);
          if (row.pagamentos && typeof row.pagamentos === 'object') setPagamentos(row.pagamentos);
          if (row.sync_url) setSyncUrl(row.sync_url);
        }
      } catch (_) {}
    };
    loadData();

    // Escuta mudanças em tempo real
    const channel = supabase
      .channel("financas_realtime")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "financas_compartilhadas",
        filter: `id=eq.${CASAL_ID}`,
      }, (payload) => {
        const row = payload.new;
        if (row.data && Array.isArray(row.data) && row.data.length > 0) {
          const base = emptyYear();
          row.data.forEach((m, i) => {
            if (i < 12 && m) base[i] = {
              ...base[i],
              receitas: Array.isArray(m.receitas) ? m.receitas : [],
              despesas: Array.isArray(m.despesas) ? m.despesas : [],
              investimentos: Array.isArray(m.investimentos) ? m.investimentos : [],
            };
          });
          setData(base);
        }
        if (row.cartoes && Array.isArray(row.cartoes)) setCartoes(row.cartoes);
        if (row.uso_cartoes && Array.isArray(row.uso_cartoes)) setUsoCartoes(row.uso_cartoes);
        if (row.pagamentos && typeof row.pagamentos === 'object') setPagamentos(row.pagamentos);
        if (row.sync_url) setSyncUrl(row.sync_url);
        showToast("🔄 Dados atualizados!");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const saveToSupabase = async (payload) => {
    const supabase = createClient();
    // Garante que arrays são sempre válidos antes de salvar
    const safe = {
      id: CASAL_ID,
      updated_at: new Date().toISOString(),
      data: Array.isArray(payload.data) ? payload.data : emptyYear(),
      cartoes: Array.isArray(payload.cartoes) ? payload.cartoes : [],
      uso_cartoes: Array.isArray(payload.uso_cartoes) ? payload.uso_cartoes : [],
      pagamentos: (payload.pagamentos && typeof payload.pagamentos === 'object') ? payload.pagamentos : {},
      sync_url: payload.sync_url || "",
    };
    const { error } = await supabase.from("financas_compartilhadas").upsert(safe);
    if (error) { console.error("Supabase save error:", error); throw error; }
  };

  const handleSave = async () => {
    try {
      await saveToSupabase({ data: safeData, cartoes, uso_cartoes: usoCartoes, pagamentos, sync_url: syncUrl });
      showToast("✅ Salvo! Lucas verá em instantes.");
    } catch (e) { console.error(e); showToast("Erro ao salvar — verifique o console", "error"); }
  };

  const saveSyncUrl = async () => {
    try {
      await saveToSupabase({ data, cartoes, uso_cartoes: usoCartoes, pagamentos, sync_url: syncUrl });
      showToast("✅ URL salva!");
    } catch (_) { showToast("Erro ao salvar URL", "error"); }
  };

  // financials
  // Garante 12 meses válidos SEMPRE — protege contra dados corrompidos do Supabase
  const safeData = useMemo(() => {
    const base = emptyYear();
    if (Array.isArray(data)) {
      data.forEach((m, i) => {
        if (i < 12) {
          base[i] = {
            month: i,
            receitas: Array.isArray(m?.receitas) ? m.receitas : [],
            despesas: Array.isArray(m?.despesas) ? m.despesas : [],
            investimentos: Array.isArray(m?.investimentos) ? m.investimentos : [],
          };
        }
      });
    }
    return base;
  }, [data]);

  const monthData = safeData[currentMonth];
  const recTotal = sumArr(monthData.receitas);
  const despTotal = sumArr(monthData.despesas);
  const invTotal = sumArr(monthData.investimentos);
  const saldo = recTotal - despTotal - invTotal;

  // cartao helpers
  const getInstMonths = (uso) => {
    const d = new Date(uso.data + "T12:00:00");
    const card = cartoes.find(c => c.id === uso.cartaoId);
    const diaFech = card?.diaFechamento || 1;
    let sm = d.getMonth(), sy = d.getFullYear();
    if (d.getDate() > diaFech) { sm++; if (sm > 11) { sm = 0; sy++; } }
    return Array.from({ length:uso.parcelas }, (_, i) => {
      let m = sm + i, y = sy;
      while (m > 11) { m -= 12; y++; }
      return { year:y, month:m };
    });
  };

  const fatMap = useMemo(() => {
    const r = {};
    usoCartoes.forEach(u => {
      getInstMonths(u).forEach(({ year, month }) => {
        const k = `${u.cartaoId}_${year}_${month}`;
        r[k] = (r[k]||0) + u.valorParcela;
      });
    });
    return r;
  }, [usoCartoes, cartoes]);

  const getFat = (cid, y, m) => fatMap[`${cid}_${y}_${m}`] || 0;
  const isPago = (cid, y, m) => !!pagamentos[`${cid}_${y}_${m}`];
  const togglePago = async (cid, y, m) => {
    const newPag = { ...pagamentos, [`${cid}_${y}_${m}`]: !pagamentos[`${cid}_${y}_${m}`] };
    setPagamentos(newPag);
    try {
      await saveToSupabase({ data, cartoes, uso_cartoes: usoCartoes, pagamentos: newPag, sync_url: syncUrl });
    } catch (_) {}
  };

  const faturasMes = cartoes.reduce((s, c) => s + getFat(c.id, CY, currentMonth), 0);
  const faturasPagas = cartoes.reduce((s, c) => s + (isPago(c.id, CY, currentMonth) ? getFat(c.id, CY, currentMonth) : 0), 0);
  const faturasEmAberto = faturasMes - faturasPagas;
  const saldoReal = saldo - faturasEmAberto;
  const totalAtrasado = yrMs.slice(0, nowM).reduce((s, m) => s + cartoes.reduce((ss, c) => ss + (!isPago(c.id, CY, m) ? getFat(c.id, CY, m) : 0), 0), 0);
  const totalGastoCartoes = usoCartoes.reduce((s, u) => s + u.valor, 0);
  const mesesComFat = new Set(Object.keys(fatMap).map(k => k.split("_").slice(1).join("_"))).size;
  const mediaFat = mesesComFat > 0 ? Object.values(fatMap).reduce((s, v) => s + v, 0) / mesesComFat : 0;

  const chartData = MS.map((m, i) => ({
    // safeData garante acesso seguro
    name: m,
    Receitas: sumArr(safeData[i].receitas),
    Despesas: sumArr(safeData[i].despesas),
    Cartões: cartoes.reduce((s, c) => s + getFat(c.id, CY, i), 0),
    Saldo: sumArr(safeData[i].receitas) - sumArr(safeData[i].despesas) - sumArr(safeData[i].investimentos)
      - cartoes.reduce((s, c) => s + (!isPago(c.id, CY, i) ? getFat(c.id, CY, i) : 0), 0),
  }));

  const cartaoChart = MS.map((m, i) => ({
    name: m,
    total: cartoes.reduce((s, c) => s + getFat(c.id, CY, i), 0),
  }));

  // item helpers
  const addItem = (type) => {
    const k = type === "receita" ? "receita" : type === "despesa" ? "despesa" : "invest";
    const desc = form[k], val = parseFloat((form[k+"Val"]||"0").replace(",",".")), date = form[k+"Date"] || today;
    if (!desc || !val) { showToast("Preencha descrição e valor", "error"); return; }
    const key = type === "receita" ? "receitas" : type === "despesa" ? "despesas" : "investimentos";
    setData(d => d.map((m, i) => i === currentMonth ? { ...m, [key]: [...m[key], { id:uid(), desc, valor:val, date }] } : m));
    setForm(f => ({ ...f, [k]:"", [k+"Val"]:"", [k+"Date"]:"" }));
    showToast("Item adicionado!");
  };

  const removeItem = (mi, type, id) => {
    const key = type === "receita" ? "receitas" : type === "despesa" ? "despesas" : "investimentos";
    setData(d => d.map((m, i) => i === mi ? { ...m, [key]: m[key].filter(x => x.id !== id) } : m));
  };

  const addCartao = () => {
    if (!novoCartao.nome) { showToast("Informe o nome", "error"); return; }
    setCartoes(c => [...c, { id:uid(), nome:novoCartao.nome, diaFechamento:parseInt(novoCartao.diaFechamento)||1, diaPagamento:parseInt(novoCartao.diaPagamento)||10 }]);
    setNovoCartao({ nome:"", diaFechamento:"", diaPagamento:"" });
    showToast("Cartão cadastrado!");
  };

  const addUso = () => {
    if (!novoUso.cartaoId || !novoUso.data || !novoUso.descricao || !novoUso.valor) { showToast("Preencha todos os campos", "error"); return; }
    const valor = parseFloat(novoUso.valor.replace(",",".")), parcelas = parseInt(novoUso.parcelas)||1;
    setUsoCartoes(u => [...u, { id:uid(), cartaoId:novoUso.cartaoId, data:novoUso.data, descricao:novoUso.descricao, valor, parcelas, valorParcela:parseFloat((valor/parcelas).toFixed(2)) }]);
    setNovoUso({ cartaoId:"", data:"", descricao:"", valor:"", parcelas:"1" });
    showToast("Compra adicionada!");
  };

  const processLote = () => {
    const lines = loteText.split("\n").filter(l => l.trim());
    let added = 0;
    const nd = safeData.map(m => ({ ...m, receitas:[...m.receitas], despesas:[...m.despesas], investimentos:[...m.investimentos] }));
    lines.forEach(line => {
      const [tipo, desc, val, dateStr] = line.split(";").map(p => p.trim());
      const valor = parseFloat((val||"0").replace(",","."));
      if (!tipo || !desc || isNaN(valor)) return;
      const mIdx = dateStr ? new Date(dateStr).getMonth() : currentMonth;
      const date = dateStr || today;
      if (tipo.toLowerCase().includes("rec")) nd[mIdx]?.receitas.push({ id:uid(), desc, valor, date });
      else if (tipo.toLowerCase().includes("desp")) nd[mIdx]?.despesas.push({ id:uid(), desc, valor, date });
      else if (tipo.toLowerCase().includes("inv")) nd[mIdx]?.investimentos.push({ id:uid(), desc, valor, date });
      added++;
    });
    setData(nd); setLoteText(""); setShowLote(false);
    showToast(`${added} item(s) importados!`);
  };

  // sync helpers
  const testarConexao = async () => {
    if (!syncUrl) { setSyncStatus({ ok:false, msg:"Cole a URL do Apps Script primeiro" }); return; }
    setSyncing(true); setSyncStatus(null);
    try {
      const r = await fetch(`${syncUrl}?action=test`);
      const j = await r.json();
      setSyncStatus({ ok:true, msg: j.message || "Conexão OK! ✅" });
    } catch (e) { setSyncStatus({ ok:false, msg:"Erro de conexão. Verifique a URL." }); }
    setSyncing(false);
  };

  const toItem = (x) => ({
    id: uid(),
    desc: x.description || x.descricao || x.desc || "",
    valor: parseFloat(x.amount || x.valor) || 0,
    date: x.date || x.data || today,
  });

  const lerDaPlanilha = async () => {
    if (!syncUrl) { setSyncStatus({ ok:false, msg:"Cole a URL do Apps Script primeiro" }); return; }
    setSyncing(true); setSyncStatus(null); setSyncPreview(null);
    try {
      const r = await fetch(`${syncUrl}?action=read&month=${syncMonth + 1}&year=${CY}`);
      const j = await r.json();
      if (j.error) { setSyncStatus({ ok:false, msg:`❌ ${j.error}` }); setSyncing(false); return; }

      const novasReceitas = (j.income || j.receitas || []).map(toItem);
      const todasDespesas = (j.expenses || j.despesas || []);
      const novasDespesas = todasDespesas
        .filter(x => !String(x.description||x.descricao||"").toLowerCase().includes("invest") &&
                     !String(x.description||x.descricao||"").toLowerCase().includes("aplicaç"))
        .map(toItem);
      const novosInvest = todasDespesas
        .filter(x => String(x.description||x.descricao||"").toLowerCase().includes("invest") ||
                     String(x.description||x.descricao||"").toLowerCase().includes("aplicaç"))
        .map(toItem);

      if (novasReceitas.length === 0 && novasDespesas.length === 0 && novosInvest.length === 0) {
        setSyncStatus({ ok:false, msg:`⚠️ Nenhum dado encontrado na aba "${j.sheet || (String(syncMonth+1).padStart(2,"0")+"."+String(CY).slice(-2))}". Verifique o nome da aba na planilha.` });
        setSyncing(false); return;
      }

      // Mostra prévia para o usuário confirmar
      setSyncPreview({ receitas: novasReceitas, despesas: novasDespesas, investimentos: novosInvest, month: syncMonth, sheet: j.sheet });
      setSyncStatus(null);
    } catch (e) {
      setSyncStatus({ ok:false, msg:"❌ Erro ao conectar. Verifique a URL e tente novamente." });
    }
    setSyncing(false);
  };

  const confirmarImport = async () => {
    if (!syncPreview) return;
    const { receitas, despesas, investimentos, month } = syncPreview;
    const novoData = safeData.map((m, i) => {
      if (i !== month) return m;
      return {
        ...m,
        receitas: [...m.receitas, ...receitas],
        despesas: [...m.despesas, ...despesas],
        investimentos: [...m.investimentos, ...investimentos],
      };
    });
    setData(novoData);
    // Salva automaticamente no Supabase após importar
    try {
      await saveToSupabase({ data: novoData, cartoes, uso_cartoes: usoCartoes, pagamentos, sync_url: syncUrl });
      // Update local state so dashboard reflects immediately
      setCurrentMonth(syncPreview.month);
    } catch (_) {}
    setSyncPreview(null);
    setSyncStatus({ ok:true, msg:`✅ ${MONTHS[month]} importado e salvo! ${receitas.length} receitas • ${despesas.length} despesas • ${investimentos.length} investimentos` });
    showToast(`✅ Dados de ${MONTHS[month]} salvos com sucesso!`);
  };

  // EntryForm moved outside App — see below

  const isMobile = useIsMobile();
  const sw = isMobile ? "0px" : sidebarOpen ? "220px" : "64px";
  const [mobileMenu, setMobileMenu] = useState(false);
  const navItems = [
    { key:"dashboard", icon:"📊", label:"Dashboard" },
    { key:"lancamentos", icon:"✏️", label:"Lançamentos" },
    { key:"relatorio", icon:"📈", label:"Relatório" },
    { key:"cartoes", icon:"💳", label:"Cartões" },
    { key:"sincronizar", icon:"🔄", label:"Sincronizar" },
  ];
  const cardSubNav = [["cadastro","📋","Cadastro"],["uso","🛒","Uso de Cartões"],["faturas","📄","Faturas"],["relatorio_c","📊","Relatório"],["dashcard","🖥️","Dashboard"]];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, fontFamily:"'Inter','DM Sans',system-ui,sans-serif", color:T.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── SIDEBAR ── */}
      <div style={{ width:sw, background:T.surface, borderRight:`1px solid ${T.border}`, display: isMobile ? "none" : "flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:100, transition:"width 0.25s ease", overflow:"hidden", boxShadow:"1px 0 0 #E2E8F0" }}>
        {/* Logo */}
        <div style={{ padding:"18px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:"10px", whiteSpace:"nowrap" }}>
          <div style={{ width:"34px", height:"34px", borderRadius:"10px", flexShrink:0, background:"linear-gradient(135deg,#7C3AED,#0EA5E9)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px" }}>💰</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize:"14px", fontWeight:700, color:T.text }}>Planejamento</div>
              <div style={{ fontSize:"11px", color:T.textSub }}>Financeiro</div>
            </div>
          )}
        </div>
        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:"2px", overflowY:"auto" }}>
          {navItems.map(n => (
            <div key={n.key} style={navI(activeSection === n.key)} onClick={() => setActiveSection(n.key)}>
              <span style={{ fontSize:"17px", flexShrink:0 }}>{n.icon}</span>
              {sidebarOpen && <span>{n.label}</span>}
            </div>
          ))}
          {activeSection === "cartoes" && sidebarOpen && (
            <div style={{ marginLeft:"8px", marginTop:"2px", display:"flex", flexDirection:"column", gap:"1px" }}>
              {cardSubNav.map(([k, ic, l]) => (
                <div key={k} style={subNavI(cardSub === k)} onClick={e => { e.stopPropagation(); setCardSub(k); }}>
                  <span style={{ fontSize:"13px" }}>{ic}</span><span>{l}</span>
                </div>
              ))}
            </div>
          )}
        </nav>
        {/* Collapse */}
        <div style={{ padding:"10px 8px", borderTop:`1px solid ${T.border}` }}>
          <div style={{ ...navI(false), justifyContent: sidebarOpen ? "flex-start" : "center" }} onClick={() => setSidebarOpen(s => !s)}>
            <span style={{ fontSize:"14px", flexShrink:0 }}>{sidebarOpen ? "◀" : "▶"}</span>
            {sidebarOpen && <span style={{ fontSize:"12px" }}>Recolher</span>}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main style={{ marginLeft:sw, flex:1, padding: isMobile ? "16px" : "24px", transition:"margin-left 0.25s ease", minHeight:"100vh", paddingBottom: isMobile ? "80px" : "24px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"22px", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <h1 style={{ fontSize:"20px", fontWeight:700, color:T.text, margin:0 }}>
              {{ dashboard:"Dashboard", lancamentos:"Lançamentos", relatorio:"Relatório Anual", cartoes:"Cartões de Crédito", sincronizar:"Sincronizar com Google Sheets" }[activeSection]}
            </h1>
            <p style={{ color:T.textSub, fontSize:"13px", margin:"2px 0 0" }}>Planejamento Financeiro Pessoal • {CY}</p>
          </div>
          {activeSection !== "cartoes" && activeSection !== "sincronizar" && !isMobile && (
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ display:"flex", background:T.surfaceAlt, borderRadius:"10px", padding:"3px", border:`1px solid ${T.border}`, gap:"2px" }}>
                {["mes","trimestre","ano"].map(v => (
                  <button key={v} style={toggleB(view === v)} onClick={() => setView(v)}>
                    {v === "mes" ? "Mês" : v === "trimestre" ? "Trimestre" : "Ano"}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                <button style={{ ...btnGhost, padding:"6px 10px" }} onClick={() => setCurrentMonth(m => Math.max(0, m-1))}>‹</button>
                <span style={{ fontSize:"14px", fontWeight:600, color:T.text, minWidth:"130px", textAlign:"center" }}>
                  {view === "mes" ? MONTHS[currentMonth] : view === "trimestre" ? `${Math.floor(currentMonth/3)+1}º Trimestre` : CY}
                </span>
                <button style={{ ...btnGhost, padding:"6px 10px" }} onClick={() => setCurrentMonth(m => Math.min(11, m+1))}>›</button>
              </div>
            </div>
          )}
        </div>

        {/* ── DASHBOARD ── */}
        {activeSection === "dashboard" && (
          <div>
            {/* Alert atraso */}
            {totalAtrasado > 0 && (
              <div style={{ background:T.redLight, border:`1px solid #FECACA`, borderRadius:"10px", padding:"12px 16px", marginBottom:"16px", display:"flex", alignItems:"center", gap:"12px" }}>
                <span style={{ fontSize:"20px" }}>⚠️</span>
                <div>
                  <p style={{ color:T.red, fontWeight:700, fontSize:"13px", margin:0 }}>Faturas em atraso!</p>
                  <p style={{ color:"#B91C1C", fontSize:"12px", margin:"2px 0 0" }}>Total não pago de meses anteriores: <strong>{fmt(totalAtrasado)}</strong> — acesse Cartões → Faturas.</p>
                </div>
              </div>
            )}

            {/* Metric cards row 1 */}
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap:"12px", marginBottom:"14px" }}>
              {[
                { l:"RECEITAS", v:recTotal, c:T.green, bg:T.greenLight, icon:"↑" },
                { l:"DESPESAS", v:despTotal, c:T.red, bg:T.redLight, icon:"↓" },
                { l:"INVESTIMENTOS", v:invTotal, c:T.blue, bg:T.blueLight, icon:"◆" },
                { l:"FATURAS CARTÕES", v:faturasMes, c:T.amber, bg:T.amberLight, icon:"💳", sub: faturasEmAberto > 0 ? `${fmt(faturasEmAberto)} em aberto` : "✓ Em dia" },
              ].map(m => (
                <div key={m.l} style={metCard(m.c)}>
                  <div style={{ position:"absolute", top:"-20px", right:"-20px", width:"80px", height:"80px", background:`${m.c}12`, borderRadius:"50%" }} />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
                    <p style={{ fontSize:"11px", fontWeight:600, color:T.textSub, textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>{m.l}</p>
                    <span style={{ background:m.bg, color:m.c, borderRadius:"8px", padding:"4px 8px", fontSize:"16px" }}>{m.icon}</span>
                  </div>
                  <p style={{ fontSize:"22px", fontWeight:700, color:m.c, margin:"0 0 6px" }}>{fmt(m.v)}</p>
                  {m.sub && <span style={tag(m.bg, m.c)}>{m.sub}</span>}
                  {!m.sub && <span style={tag(m.bg, m.c)}>{MONTHS[currentMonth]}</span>}
                </div>
              ))}
            </div>

            {/* Saldo row */}
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"12px", marginBottom:"14px" }}>
              <div style={{ ...card({ marginBottom:0 }), borderLeft:`4px solid #7C3AED` }}>
                <p style={{ fontSize:"11px", fontWeight:600, color:T.textSub, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 6px" }}>SALDO ORÇAMENTO</p>
                <p style={{ fontSize:"24px", fontWeight:700, color: saldo >= 0 ? T.purple : T.red, margin:"0 0 4px" }}>{fmt(saldo)}</p>
                <p style={{ fontSize:"12px", color:T.textSub, margin:0 }}>Receitas − Despesas − Investimentos</p>
              </div>
              <div style={{ ...card({ marginBottom:0 }), borderLeft:`4px solid ${saldoReal >= 0 ? T.green : T.red}` }}>
                <p style={{ fontSize:"11px", fontWeight:600, color:T.textSub, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 6px" }}>SALDO REAL (COM CARTÕES)</p>
                <p style={{ fontSize:"24px", fontWeight:700, color: saldoReal >= 0 ? T.green : T.red, margin:"0 0 4px" }}>{fmt(saldoReal)}</p>
                <p style={{ fontSize:"12px", color:T.textSub, margin:0 }}>
                  {faturasEmAberto > 0 ? `Descontando ${fmt(faturasEmAberto)} de faturas em aberto` : "Todas as faturas pagas ✓"}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap:"12px", marginBottom:"14px" }}>
              <div style={{ ...card({ marginBottom:0 }) }}>
                <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"14px" }}>📈 Evolução Anual</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                    <defs>
                      <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fill:T.textMuted, fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtK} tick={{ fill:T.textMuted, fontSize:10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CT />} />
                    <Area type="monotone" dataKey="Receitas" stroke={T.green} strokeWidth={2} fill="url(#gR)" />
                    <Area type="monotone" dataKey="Despesas" stroke={T.red} strokeWidth={2} fill="url(#gD)" />
                    <Area type="monotone" dataKey="Cartões" stroke={T.amber} strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", gap:"16px", marginTop:"8px" }}>
                  {[[T.green,"Receitas"],[T.red,"Despesas"],[T.amber,"Cartões"]].map(([c,l]) => (
                    <span key={l} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:T.textSub }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ ...card({ marginBottom:0 }) }}>
                <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"14px" }}>🏦 Distribuição — {MONTHS[currentMonth]}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {[["Receitas",recTotal,T.green,T.greenLight],["Despesas",despTotal,T.red,T.redLight],["Investimentos",invTotal,T.blue,T.blueLight],["Cartões",faturasMes,T.amber,T.amberLight]].map(([l,v,c,bg]) => {
                    const pct = recTotal > 0 ? (v/recTotal)*100 : 0;
                    return (
                      <div key={l}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"4px" }}>
                          <span style={{ color:T.textSub }}>{l}</span>
                          <span style={{ color:c, fontWeight:600 }}>{fmt(v)}</span>
                        </div>
                        <div style={{ height:6, background:T.surfaceAlt, borderRadius:4, border:`1px solid ${T.border}` }}>
                          <div style={{ height:6, width:`${Math.min(100,pct)}%`, background:c, borderRadius:4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cartões do mês */}
            {cartoes.length > 0 && (
              <div style={{ ...card({ marginBottom:"14px" }) }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
                  <p style={{ fontSize:"13px", fontWeight:600, color:T.text, margin:0 }}>💳 Cartões — {MONTHS[currentMonth]}</p>
                  <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                    {faturasPagas > 0 && <span style={tag(T.greenLight, T.green)}>✓ {fmt(faturasPagas)} pago</span>}
                    {faturasEmAberto > 0 && <span style={tag(T.redLight, T.red)}>⚡ {fmt(faturasEmAberto)} aberto</span>}
                    <span style={{ fontSize:"12px", color:T.textSub }}>Total: <strong style={{ color:T.amber }}>{fmt(faturasMes)}</strong></span>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(175px,1fr))", gap:"10px" }}>
                  {cartoes.map((c, ci) => {
                    const v = getFat(c.id, CY, currentMonth);
                    const pg = isPago(c.id, CY, currentMonth);
                    const col = CARD_COLORS[ci % 8];
                    return (
                      <div key={c.id} style={{ background: pg ? T.greenLight : v > 0 ? T.redLight : T.surfaceAlt, border:`1px solid ${pg ? "#BBF7D0" : v > 0 ? "#FECACA" : T.border}`, borderRadius:"10px", padding:"12px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                          <span style={chip2(col)}>{c.nome}</span>
                          {v > 0 && (
                            <button
                              style={{ background: pg ? T.green : T.red, border:"none", color:"#fff", borderRadius:"6px", padding:"3px 8px", fontSize:"10px", fontWeight:700, cursor:"pointer" }}
                              onClick={() => togglePago(c.id, CY, currentMonth)}>
                              {pg ? "✓ Pago" : "Pagar"}
                            </button>
                          )}
                        </div>
                        <p style={{ color: v > 0 ? (pg ? T.green : T.red) : T.textMuted, fontWeight:700, fontSize:"16px", margin:"0 0 2px" }}>{v > 0 ? fmt(v) : "Sem fatura"}</p>
                        {v > 0 && <p style={{ color:T.textSub, fontSize:"10px", margin:0 }}>Dia {c.diaPagamento} • {pg ? "Pago ✓" : "Aguardando"}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Year summary */}
            <div style={card({ marginBottom:0 })}>
              <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"14px" }}>📅 Resumo {CY}</p>
              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap:"8px" }}>
                {MONTHS.map((m, i) => {
                  const r = sumArr(safeData[i].receitas), d = sumArr(safeData[i].despesas), inv = sumArr(safeData[i].investimentos);
                  const cart = cartoes.reduce((s, c) => s + getFat(c.id, CY, i), 0);
                  const s = r - d - inv - cartoes.reduce((s2, c) => s2 + (!isPago(c.id, CY, i) ? getFat(c.id, CY, i) : 0), 0);
                  const active = i === currentMonth;
                  return (
                    <div key={i} style={{ background: active ? T.purpleLight : T.surfaceAlt, border: active ? `1.5px solid ${T.purple}` : `1px solid ${T.border}`, borderRadius:"10px", padding:"12px", cursor:"pointer", transition:"all 0.15s" }} onClick={() => setCurrentMonth(i)}>
                      <p style={{ fontSize:"11px", fontWeight:700, color: active ? T.purple : T.textSub, marginBottom:"6px" }}>{m}</p>
                      <div style={{ fontSize:"10px", display:"flex", flexDirection:"column", gap:"3px" }}>
                        {[["Rec",r,T.green],["Desp",d,T.red],["Cart",cart,T.amber],["Saldo",s,s>=0?T.purple:T.red]].map(([lbl,val,col]) => (
                          <div key={lbl} style={{ display:"flex", justifyContent:"space-between" }}>
                            <span style={{ color:T.textMuted }}>{lbl}</span>
                            <span style={{ color:col, fontWeight:lbl==="Saldo"?700:400 }}>{fmtK(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── LANÇAMENTOS ── */}
        {activeSection === "lancamentos" && (
          <div>
            <div style={{ ...card({ padding:"12px 16px", marginBottom:"14px" }), background:T.purpleLight, border:`1px solid #DDD6FE` }}>
              <p style={{ color:T.purple, fontSize:"13px", margin:0 }}>📅 Lançamentos de <strong>{MONTHS[currentMonth]} {CY}</strong></p>
            </div>
            <EntryForm type="receita" label="📥 Receitas" col={T.green}
              list={monthData.receitas} form={form} setForm={setForm}
              today={today} onAdd={addItem} onRemove={removeItem} currentMonth={currentMonth} />
            <EntryForm type="despesa" label="📤 Despesas" col={T.red}
              list={monthData.despesas} form={form} setForm={setForm}
              today={today} onAdd={addItem} onRemove={removeItem} currentMonth={currentMonth} />
            <EntryForm type="investimento" label="💎 Investimentos" col={T.blue}
              list={monthData.investimentos} form={form} setForm={setForm}
              today={today} onAdd={addItem} onRemove={removeItem} currentMonth={currentMonth} />
          </div>
        )}

        {/* ── RELATÓRIO ── */}
        {activeSection === "relatorio" && (
          <div>
            <div style={card()}>
              <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"14px" }}>📊 Performance Anual</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top:5, right:10, bottom:0, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fill:T.textMuted, fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtK} tick={{ fill:T.textMuted, fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="Receitas" fill={T.green} radius={[4,4,0,0]} />
                  <Bar dataKey="Despesas" fill={T.red} radius={[4,4,0,0]} />
                  <Bar dataKey="Cartões" fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card()}>
              <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"14px" }}>📋 Consolidado Anual</p>
              <div style={{ overflowX:"auto" }}>
                <table style={tbl}>
                  <thead>
                    <tr style={{ background:T.surfaceAlt }}>
                      {["Mês","Receitas","Despesas","Invest.","Cartões","Saldo Real"].map(h => (
                        <th key={h} style={{ ...th, textAlign: h==="Mês"?"left":"right" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS.map((m, i) => {
                      const r = sumArr(safeData[i].receitas), d = sumArr(safeData[i].despesas), inv = sumArr(safeData[i].investimentos);
                      const cart = cartoes.reduce((s, c) => s + getFat(c.id, CY, i), 0);
                      const s = r - d - inv - cartoes.reduce((s2, c) => s2 + (!isPago(c.id, CY, i) ? getFat(c.id, CY, i) : 0), 0);
                      return (
                        <tr key={i} style={{ background: i===currentMonth ? T.purpleLight : "transparent" }}>
                          <td style={{ ...td, color: i===currentMonth ? T.purple : T.text, fontWeight: i===currentMonth ? 700 : 400 }}>{m}</td>
                          <td style={{ ...td, textAlign:"right", color:T.green, fontWeight:500 }}>{fmt(r)}</td>
                          <td style={{ ...td, textAlign:"right", color:T.red, fontWeight:500 }}>{fmt(d)}</td>
                          <td style={{ ...td, textAlign:"right", color:T.blue, fontWeight:500 }}>{fmt(inv)}</td>
                          <td style={{ ...td, textAlign:"right", color:T.amber, fontWeight:500 }}>{cart > 0 ? fmt(cart) : "—"}</td>
                          <td style={{ ...td, textAlign:"right", color: s>=0?T.green:T.red, fontWeight:700 }}>{fmt(s)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop:`2px solid ${T.borderStrong}`, background:T.surfaceAlt }}>
                      <td style={{ ...td, fontWeight:700 }}>TOTAL</td>
                      {[
                        safeData.reduce((s,m)=>s+sumArr(m.receitas),0),
                        safeData.reduce((s,m)=>s+sumArr(m.despesas),0),
                        safeData.reduce((s,m)=>s+sumArr(m.investimentos),0),
                        yrMs.reduce((s,i)=>s+cartoes.reduce((ss,c)=>ss+getFat(c.id,CY,i),0),0),
                      ].map((v, i) => (
                        <td key={i} style={{ ...td, textAlign:"right", color:[T.green,T.red,T.blue,T.amber][i], fontWeight:700 }}>{fmt(v)}</td>
                      ))}
                      <td style={{ ...td, textAlign:"right", fontWeight:700, color:T.purple }}>
                        {fmt(safeData.reduce((s,m,i)=>s+sumArr(m.receitas)-sumArr(m.despesas)-sumArr(m.investimentos)-cartoes.reduce((ss,c)=>ss+(!isPago(c.id,CY,i)?getFat(c.id,CY,i):0),0),0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CARTÕES ── */}
        {activeSection === "cartoes" && (
          <div>
            {cardSub === "cadastro" && (
              <div>
                <div style={card()}>
                  <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"12px" }}>➕ Novo Cartão</p>
                  <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                    <input style={inpStyle} placeholder="Nome do cartão (ex: Nubank Mastercard)" value={novoCartao.nome} onChange={e => setNovoCartao(n => ({ ...n, nome:e.target.value }))} />
                    <input style={{ ...inpStyle, maxWidth:"140px" }} placeholder="Dia fechamento" value={novoCartao.diaFechamento} onChange={e => setNovoCartao(n => ({ ...n, diaFechamento:e.target.value }))} />
                    <input style={{ ...inpStyle, maxWidth:"140px" }} placeholder="Dia pagamento" value={novoCartao.diaPagamento} onChange={e => setNovoCartao(n => ({ ...n, diaPagamento:e.target.value }))} />
                    <button style={btnPrimary(T.purple)} onClick={addCartao}>+ Cadastrar</button>
                  </div>
                </div>
                {cartoes.length > 0 && (
                  <div style={card()}>
                    <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"12px" }}>💳 Cartões ({cartoes.length})</p>
                    <table style={tbl}>
                      <thead><tr><th style={th}>Cartão</th><th style={th}>Fechamento</th><th style={th}>Pagamento</th><th style={th}></th></tr></thead>
                      <tbody>
                        {cartoes.map((c, i) => (
                          <tr key={c.id}>
                            <td style={td}><span style={chip2(CARD_COLORS[i%8])}>{c.nome}</span></td>
                            <td style={{ ...td, color:T.amber }}>Dia {c.diaFechamento}</td>
                            <td style={{ ...td, color:T.green }}>Dia {c.diaPagamento}</td>
                            <td style={td}><button style={remB} onClick={() => { setCartoes(cs => cs.filter(x => x.id !== c.id)); setUsoCartoes(u => u.filter(x => x.cartaoId !== c.id)); }}>✕ Remover</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {cardSub === "uso" && (
              <div>
                <div style={card()}>
                  <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"12px" }}>🛒 Registrar Compra Parcelada</p>
                  {cartoes.length === 0 ? (
                    <p style={{ color:T.red, fontSize:"13px" }}>Cadastre um cartão primeiro.</p>
                  ) : (
                    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                      <select style={selStyle} value={novoUso.cartaoId} onChange={e => setNovoUso(n => ({ ...n, cartaoId:e.target.value }))}>
                        <option value="">Selecione o cartão</option>
                        {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                      <input type="date" style={inpDate} value={novoUso.data} onChange={e => setNovoUso(n => ({ ...n, data:e.target.value }))} />
                      <input style={inpStyle} placeholder="Descrição" value={novoUso.descricao} onChange={e => setNovoUso(n => ({ ...n, descricao:e.target.value }))} />
                      <input style={{ ...inpStyle, maxWidth:"110px" }} placeholder="Valor R$" value={novoUso.valor} onChange={e => setNovoUso(n => ({ ...n, valor:e.target.value }))} />
                      <input style={{ ...inpStyle, maxWidth:"80px" }} placeholder="Parcelas" value={novoUso.parcelas} onChange={e => setNovoUso(n => ({ ...n, parcelas:e.target.value }))} />
                      <button style={btnPrimary(T.purple)} onClick={addUso}>+ Adicionar</button>
                    </div>
                  )}
                </div>
                {usoCartoes.length > 0 && (
                  <div style={card()}>
                    <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"12px" }}>📋 Histórico ({usoCartoes.length} compras)</p>
                    <div style={{ overflowX:"auto" }}>
                      <table style={tbl}>
                        <thead><tr><th style={th}>Cartão</th><th style={th}>Data</th><th style={th}>Descrição</th><th style={th}>Valor</th><th style={th}>Parcelas</th><th style={th}>Valor/Parc.</th><th style={th}></th></tr></thead>
                        <tbody>
                          {usoCartoes.map(u => {
                            const ci = cartoes.findIndex(c => c.id === u.cartaoId);
                            return (
                              <tr key={u.id}>
                                <td style={td}><span style={chip2(CARD_COLORS[ci>=0?ci%8:0])}>{cartoes[ci]?.nome||"?"}</span></td>
                                <td style={td}>{u.data}</td>
                                <td style={td}>{u.descricao}</td>
                                <td style={{ ...td, color:T.amber, fontWeight:600 }}>{fmt(u.valor)}</td>
                                <td style={{ ...td, color:T.purple }}>{u.parcelas}x</td>
                                <td style={{ ...td, color:T.blue }}>{fmt(u.valorParcela)}</td>
                                <td style={td}><button style={remB} onClick={() => setUsoCartoes(u2 => u2.filter(x => x.id !== u.id))}>✕</button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {cardSub === "faturas" && (
              <div>
                <div style={{ display:"flex", gap:"6px", marginBottom:"16px" }}>
                  {[["apagar","A Pagar"],["pagamentos","Pagamentos"],["inadimplencias","Inadimplências"]].map(([k,l]) => (
                    <button key={k} style={subT(faturaTab===k)} onClick={() => setFaturaTab(k)}>{l}</button>
                  ))}
                </div>
                {faturaTab === "apagar" && (
                  <div style={card()}>
                    <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"12px" }}>📅 Faturas a Pagar — {CY} <span style={{ color:T.textSub, fontWeight:400 }}>(clique para marcar pago)</span></p>
                    <div style={{ overflowX:"auto" }}>
                      <table style={tbl}>
                        <thead><tr><th style={{ ...th, minWidth:"160px" }}>Cartão</th><th style={{ ...th, minWidth:"90px" }}>Total Ano</th>{MS.map(m=><th key={m} style={{ ...th, minWidth:"80px" }}>{m}</th>)}</tr></thead>
                        <tbody>
                          <tr style={{ background:T.purpleLight }}>
                            <td style={{ ...td, fontWeight:700, color:T.purple }}>Total</td>
                            <td style={{ ...td, fontWeight:700, color:T.purple }}>{fmt(cartoes.reduce((s,c)=>s+yrMs.reduce((ss,m)=>ss+getFat(c.id,CY,m),0),0))}</td>
                            {yrMs.map(m=>{const t=cartoes.reduce((s,c)=>s+getFat(c.id,CY,m),0);return<td key={m} style={{ ...td, color:t>0?T.red:T.textMuted, fontWeight:t>0?700:400 }}>{t>0?fmt(t):"—"}</td>;})}
                          </tr>
                          {cartoes.map((c,ci)=>(
                            <tr key={c.id}>
                              <td style={td}><span style={chip2(CARD_COLORS[ci%8])}>{c.nome}</span></td>
                              <td style={{ ...td, color:CARD_COLORS[ci%8], fontWeight:600 }}>{fmt(yrMs.reduce((s,m)=>s+getFat(c.id,CY,m),0))}</td>
                              {yrMs.map(m=>{const v=getFat(c.id,CY,m);const pg=isPago(c.id,CY,m);return<td key={m} style={td}>{v>0?<button style={{ background:pg?T.greenLight:T.redLight, border:`1px solid ${pg?"#BBF7D0":"#FECACA"}`, color:pg?T.green:T.red, borderRadius:"5px", padding:"2px 8px", fontSize:"10px", fontWeight:700, cursor:"pointer" }} onClick={()=>togglePago(c.id,CY,m)}>{pg?"✓ Pago":fmt(v)}</button>:"—"}</td>;})}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {faturaTab === "pagamentos" && (
                  <div style={card()}>
                    <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"12px" }}>✅ Pagamentos Realizados — {CY}</p>
                    <div style={{ overflowX:"auto" }}>
                      <table style={tbl}>
                        <thead><tr><th style={{ ...th, minWidth:"160px" }}>Cartão</th>{MS.map(m=><th key={m} style={{ ...th, minWidth:"80px" }}>{m}</th>)}</tr></thead>
                        <tbody>
                          {cartoes.map((c,ci)=>(
                            <tr key={c.id}>
                              <td style={td}><span style={chip2(CARD_COLORS[ci%8])}>{c.nome}</span></td>
                              {yrMs.map(m=>{const v=getFat(c.id,CY,m),pg=isPago(c.id,CY,m);return<td key={m} style={td}>{pg?<span style={{ color:T.green, fontWeight:700, fontSize:"11px" }}>✓ {fmt(v)}</span>:v>0?<span style={{ color:T.textMuted }}>—</span>:"—"}</td>;})}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {faturaTab === "inadimplencias" && (
                  <div style={card()}>
                    <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"12px" }}>⚠️ Faturas em Aberto</p>
                    <div style={{ overflowX:"auto" }}>
                      <table style={tbl}>
                        <thead><tr><th style={{ ...th, minWidth:"160px" }}>Cartão</th>{MS.map(m=><th key={m} style={{ ...th, minWidth:"80px" }}>{m}</th>)}</tr></thead>
                        <tbody>
                          {cartoes.map((c,ci)=>(
                            <tr key={c.id}>
                              <td style={td}><span style={chip2(CARD_COLORS[ci%8])}>{c.nome}</span></td>
                              {yrMs.map(m=>{const v=getFat(c.id,CY,m),pg=isPago(c.id,CY,m),past=m<nowM;return<td key={m} style={td}>{v>0&&!pg?<span style={{ color:past?T.red:T.amber, fontWeight:700, fontSize:"11px", background:past?T.redLight:T.amberLight, padding:"2px 6px", borderRadius:"4px" }}>{fmt(-v)}</span>:"—"}</td>;})}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {cardSub === "relatorio_c" && (
              <div style={card()}>
                <p style={{ fontSize:"13px", fontWeight:600, color:T.text, marginBottom:"12px" }}>📊 Status por Cartão — {CY}</p>
                <div style={{ overflowX:"auto" }}>
                  <table style={tbl}>
                    <thead><tr><th style={{ ...th, minWidth:"160px" }}>Cartão</th>{MS.map(m=><th key={m} style={{ ...th, minWidth:"80px" }}>{m}</th>)}</tr></thead>
                    <tbody>
                      {cartoes.map((c,ci)=>(
                        <tr key={c.id}>
                          <td style={td}><span style={chip2(CARD_COLORS[ci%8])}>{c.nome}</span></td>
                          {yrMs.map(m=>{const v=getFat(c.id,CY,m),pg=isPago(c.id,CY,m),past=m<nowM;return<td key={m} style={td}>{v>0?(pg?<span style={{ background:T.greenLight,color:T.green,padding:"2px 8px",borderRadius:"5px",fontSize:"10px",fontWeight:700 }}>Pago</span>:past?<span style={{ background:T.redLight,color:T.red,padding:"2px 6px",borderRadius:"5px",fontSize:"10px",fontWeight:700 }}>{fmt(-v)}</span>:<span style={{ background:T.amberLight,color:T.amber,padding:"2px 6px",borderRadius:"5px",fontSize:"10px",fontWeight:700 }}>{fmt(-v)}</span>):"—"}</td>;})}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display:"flex", gap:"12px", marginTop:"12px" }}>
                  {[[T.greenLight,T.green,"Pago"],[T.amberLight,T.amber,"A vencer"],[T.redLight,T.red,"Em atraso"]].map(([bg,c,l])=>(
                    <span key={l} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:T.textSub }}>
                      <span style={{ width:12,height:8,borderRadius:2,background:bg,border:`1px solid ${c}30`,display:"inline-block" }}/>{l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {cardSub === "dashcard" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:"12px", marginBottom:"14px" }}>
                  {[{l:"CARTÕES",v:cartoes.length,c:T.amber,bg:T.amberLight,f:String},{l:"TOTAL GASTO",v:totalGastoCartoes,c:T.red,bg:T.redLight,f:fmt},{l:"MÉDIA MENSAL",v:mediaFat,c:T.green,bg:T.greenLight,f:fmt}].map(m=>(
                    <div key={m.l} style={metCard(m.c)}>
                      <p style={{ fontSize:"11px",fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 8px" }}>{m.l}</p>
                      <p style={{ fontSize:"26px",fontWeight:700,color:m.c,margin:0 }}>{m.f(m.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={card()}>
                  <p style={{ fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"14px" }}>📊 Gastos por Mês</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={cartaoChart} margin={{ top:5,right:5,bottom:0,left:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="name" tick={{ fill:T.textMuted,fontSize:10 }} axisLine={false} tickLine={false}/>
                      <YAxis tickFormatter={fmtK} tick={{ fill:T.textMuted,fontSize:10 }} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CT/>}/>
                      <Bar dataKey="total" name="Faturas" fill={T.purple} radius={[4,4,0,0]}/>
                      {mediaFat>0&&<ReferenceLine y={mediaFat} stroke={T.green} strokeDasharray="4 4"/>}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SINCRONIZAR ── */}
        {activeSection === "sincronizar" && (
          <div style={{ maxWidth:"700px" }}>
            {/* Step 1: URL */}
            <div style={card()}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                <span style={{ background:T.purple, color:"#fff", borderRadius:"50%", width:"24px", height:"24px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:700, flexShrink:0 }}>1</span>
                <p style={{ fontSize:"15px", fontWeight:600, color:T.text, margin:0 }}>URL do Apps Script</p>
              </div>
              <p style={{ color:T.textSub, fontSize:"13px", marginBottom:"14px" }}>Cole o arquivo <strong>google-apps-script.js</strong> no Google Apps Script da sua planilha e implante como App da Web.</p>
              <div style={{ display:"flex", gap:"8px" }}>
                <input style={{ ...inpStyle, flex:1 }} placeholder="https://script.google.com/macros/s/..." value={syncUrl} onChange={e => setSyncUrl(e.target.value)} />
                <button style={btnPrimary(T.green)} onClick={saveSyncUrl}>Salvar</button>
              </div>
              <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
                <button style={btnOutline(T.purple)} onClick={testarConexao} disabled={syncing}>
                  {syncing ? "⏳ Testando..." : "📡 Testar conexão"}
                </button>
              </div>
              {syncStatus && (
                <div style={{ background:syncStatus.ok?T.greenLight:T.redLight, border:`1px solid ${syncStatus.ok?"#BBF7D0":"#FECACA"}`, borderRadius:"8px", padding:"10px 14px", marginTop:"10px", color:syncStatus.ok?T.green:T.red, fontSize:"13px", fontWeight:500 }}>
                  {syncStatus.msg}
                </div>
              )}
            </div>

            {/* Step 2: Import */}
            <div style={card()}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                <span style={{ background:T.purple, color:"#fff", borderRadius:"50%", width:"24px", height:"24px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:700, flexShrink:0 }}>2</span>
                <p style={{ fontSize:"15px", fontWeight:600, color:T.text, margin:0 }}>Importar mês da planilha</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", marginTop:"12px" }}>
                <button style={{ ...btnGhost, padding:"8px 14px" }} onClick={() => setSyncMonth(m => Math.max(0, m-1))}>‹</button>
                <span style={{ fontSize:"15px", fontWeight:600, color:T.text, minWidth:"130px", textAlign:"center" }}>{MONTHS[syncMonth]} {CY}</span>
                <button style={{ ...btnGhost, padding:"8px 14px" }} onClick={() => setSyncMonth(m => Math.min(11, m+1))}>›</button>
                <button style={btnPrimary(T.blue)} onClick={lerDaPlanilha} disabled={syncing}>
                  {syncing ? "⏳ Importando..." : "🔄 Ler da planilha"}
                </button>
              </div>
              <p style={{ color:T.textSub, fontSize:"12px", marginTop:"10px" }}>
                ⚡ Os dados importados são adicionados ao mês selecionado. Não substitui lançamentos existentes.
              </p>

              {/* PRÉVIA dos dados encontrados */}
              {syncPreview && (
                <div style={{ marginTop:"16px", background:T.surfaceAlt, border:`1.5px solid ${T.purple}`, borderRadius:"12px", padding:"16px" }}>
                  <p style={{ fontSize:"14px", fontWeight:700, color:T.purple, marginBottom:"12px" }}>
                    🔍 Prévia — {MONTHS[syncPreview.month]} {CY} <span style={{ color:T.textSub, fontWeight:400, fontSize:"12px" }}>({syncPreview.sheet})</span>
                  </p>

                  {/* Receitas */}
                  {syncPreview.receitas.length > 0 && (
                    <div style={{ marginBottom:"12px" }}>
                      <p style={{ fontSize:"12px", fontWeight:700, color:T.green, marginBottom:"6px" }}>
                        📥 Receitas ({syncPreview.receitas.length}) — Total: {fmt(syncPreview.receitas.reduce((s,x)=>s+x.valor,0))}
                      </p>
                      {syncPreview.receitas.map((x,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", padding:"4px 8px", background:T.greenLight, borderRadius:"6px", marginBottom:"3px" }}>
                          <span style={{ color:T.text }}>{x.desc}</span>
                          <span style={{ color:T.green, fontWeight:600 }}>{fmt(x.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Despesas */}
                  {syncPreview.despesas.length > 0 && (
                    <div style={{ marginBottom:"12px" }}>
                      <p style={{ fontSize:"12px", fontWeight:700, color:T.red, marginBottom:"6px" }}>
                        📤 Despesas ({syncPreview.despesas.length}) — Total: {fmt(syncPreview.despesas.reduce((s,x)=>s+x.valor,0))}
                      </p>
                      {syncPreview.despesas.map((x,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", padding:"4px 8px", background:T.redLight, borderRadius:"6px", marginBottom:"3px" }}>
                          <span style={{ color:T.text }}>{x.desc}</span>
                          <span style={{ color:T.red, fontWeight:600 }}>{fmt(x.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Investimentos */}
                  {syncPreview.investimentos.length > 0 && (
                    <div style={{ marginBottom:"12px" }}>
                      <p style={{ fontSize:"12px", fontWeight:700, color:T.blue, marginBottom:"6px" }}>
                        💎 Investimentos ({syncPreview.investimentos.length}) — Total: {fmt(syncPreview.investimentos.reduce((s,x)=>s+x.valor,0))}
                      </p>
                      {syncPreview.investimentos.map((x,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", padding:"4px 8px", background:T.blueLight, borderRadius:"6px", marginBottom:"3px" }}>
                          <span style={{ color:T.text }}>{x.desc}</span>
                          <span style={{ color:T.blue, fontWeight:600 }}>{fmt(x.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display:"flex", gap:"8px", marginTop:"14px" }}>
                    <button style={btnPrimary(T.green)} onClick={confirmarImport}>
                      ✅ Confirmar e Salvar
                    </button>
                    <button style={btnOutline(T.red)} onClick={() => setSyncPreview(null)}>
                      ✕ Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Instruções */}
            <div style={{ ...card({ marginBottom:0 }), background:T.blueLight, border:`1px solid #BAE6FD` }}>
              <p style={{ fontSize:"14px", fontWeight:700, color:T.blue, marginBottom:"12px" }}>📋 Passo a passo: como configurar o Apps Script</p>
              <ol style={{ color:"#0369A1", fontSize:"13px", lineHeight:"1.8", paddingLeft:"18px", margin:0 }}>
                <li>Abra sua planilha no <strong>Google Sheets</strong></li>
                <li>No menu: <strong>Extensões → Apps Script</strong></li>
                <li>Apague o código existente e cole o conteúdo do arquivo <strong>google-apps-script.js</strong> (está na pasta do projeto)</li>
                <li>Salve com <strong>Ctrl+S</strong></li>
                <li>Clique em <strong>Implantar → Nova implantação</strong></li>
                <li>Tipo: <strong>App da Web</strong> → Executar como: <strong>Eu mesmo</strong> → Quem tem acesso: <strong>Qualquer pessoa</strong></li>
                <li>Autorize o acesso quando solicitado</li>
                <li>Copie a URL gerada e cole no campo acima</li>
              </ol>
              <p style={{ color:T.blue, fontSize:"12px", marginTop:"10px", fontStyle:"italic" }}>
                💡 Sempre que importar, os dados da planilha entram no app com as categorias já classificadas.
              </p>
            </div>
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", justifyContent:"center", marginTop:"22px", paddingTop:"16px", borderTop:`1px solid ${T.border}`, overflowX: isMobile ? "auto" : "visible" }}>
          <button style={btnPrimary(T.green)} onClick={handleSave}>💾 Salvar</button>
          <button style={btnPrimary(T.blue)} onClick={() => { setShowSearch(s=>!s); setActiveSection("lancamentos"); }}>🔍 Buscar</button>
          <button style={{ ...btnOutline(T.amber) }} onClick={() => setShowLote(true)}>📋 Lote</button>
          <button style={btnPrimary(T.amber)} onClick={() => {
            const blob = new Blob([JSON.stringify({ data, cartoes, usoCartoes, pagamentos }, null, 2)], { type:"application/json" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `financas_${CY}.json`; a.click();
            showToast("Exportado!");
          }}>📤 Exportar</button>
          <button style={btnOutline(T.purple)} onClick={() => setShowImport(true)}>📥 Importar</button>
          <button style={btnOutline(T.red)} onClick={() => {
            if (!confirm("Resetar todos os dados?")) return;
            setData(emptyYear()); setCartoes([]); setUsoCartoes([]); setPagamentos({});
            showToast("Dados resetados", "error");
          }}>🗑 Reset</button>
        </div>

        {/* Search */}
        {showSearch && (
          <div style={{ ...card({ marginTop:"14px" }) }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
              <p style={{ fontSize:"13px", fontWeight:600, color:T.text, margin:0 }}>🔍 Buscar Lançamentos</p>
              <button style={remB} onClick={() => setShowSearch(false)}>✕ Fechar</button>
            </div>
            <input style={{ ...inpStyle, marginBottom:"10px", maxWidth:"100%" }} placeholder="Pesquisar descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {safeData.flatMap((m, mi) => [
              ...m.receitas.map(x => ({ ...x, type:"receita", mi })),
              ...m.despesas.map(x => ({ ...x, type:"despesa", mi })),
              ...m.investimentos.map(x => ({ ...x, type:"investimento", mi })),
            ]).filter(x => x.desc.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
              <div key={item.id} style={itemRow}>
                <div>
                  <span style={{ ...tag(item.type==="receita"?T.greenLight:item.type==="despesa"?T.redLight:T.blueLight, item.type==="receita"?T.green:item.type==="despesa"?T.red:T.blue), marginRight:"8px", fontSize:"10px" }}>{item.type}</span>
                  <span style={{ color:T.text, fontSize:"13px" }}>{item.desc}</span>
                  <p style={{ color:T.textMuted, fontSize:"11px", margin:"2px 0 0" }}>{MONTHS[item.mi]} • {item.date}</p>
                </div>
                <span style={{ color:item.type==="receita"?T.green:item.type==="despesa"?T.red:T.blue, fontWeight:700 }}>{fmt(item.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Lote */}
      {showLote && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setShowLote(false)}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"16px", padding:"24px", width:"520px", maxWidth:"92vw", boxShadow:shadowMd }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:T.text, margin:"0 0 8px" }}>📋 Importação em Lote</h3>
            <p style={{ color:T.textSub, fontSize:"13px", marginBottom:"12px" }}>Formato: <code style={{ color:T.purple, background:T.purpleLight, padding:"1px 5px", borderRadius:4 }}>tipo;descrição;valor;data</code> — tipos: receita, despesa, investimento</p>
            <textarea style={{ width:"100%", border:`1.5px solid ${T.borderStrong}`, borderRadius:"10px", padding:"10px", color:T.text, fontSize:"12px", outline:"none", resize:"vertical", minHeight:"110px", boxSizing:"border-box", fontFamily:"monospace", background:T.surfaceAlt }} value={loteText} onChange={e => setLoteText(e.target.value)} placeholder={"receita;Salário;5000;2026-05-10\ndespesa;Aluguel;1200;2026-05-05"} />
            <div style={{ display:"flex", gap:"8px", marginTop:"14px", justifyContent:"flex-end" }}>
              <button style={btnPrimary(T.purple)} onClick={processLote}>✓ Processar</button>
              <button style={btnGhost} onClick={() => setShowLote(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar */}
      {showImport && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setShowImport(false)}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"16px", padding:"24px", width:"520px", maxWidth:"92vw", boxShadow:shadowMd }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color:T.text, margin:"0 0 8px" }}>📥 Importar JSON</h3>
            <p style={{ color:T.textSub, fontSize:"13px", marginBottom:"12px" }}>Cole o JSON exportado anteriormente:</p>
            <textarea style={{ width:"100%", border:`1.5px solid ${T.borderStrong}`, borderRadius:"10px", padding:"10px", color:T.text, fontSize:"12px", outline:"none", resize:"vertical", minHeight:"110px", boxSizing:"border-box", fontFamily:"monospace", background:T.surfaceAlt }} id="importArea" placeholder='{"data":[...],"cartoes":[...]}' />
            <div style={{ display:"flex", gap:"8px", marginTop:"14px", justifyContent:"flex-end" }}>
              <button style={btnPrimary(T.purple)} onClick={() => {
                try {
                  const imp = JSON.parse(document.getElementById("importArea").value);
                  if (imp.data && Array.isArray(imp.data)) {
                    setData(imp.data);
                    if (imp.cartoes) setCartoes(imp.cartoes);
                    if (imp.usoCartoes) setUsoCartoes(imp.usoCartoes);
                    if (imp.pagamentos) setPagamentos(imp.pagamentos);
                    setShowImport(false);
                    showToast("Dados importados!");
                  } else { showToast("Formato inválido", "error"); }
                } catch (_) { showToast("JSON inválido", "error"); }
              }}>✓ Importar</button>
              <button style={btnGhost} onClick={() => setShowImport(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:T.surface, borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-around", padding:"8px 0 12px", boxShadow:"0 -2px 10px rgba(0,0,0,0.08)" }}>
          {[
            { key:"dashboard", icon:"📊", label:"Início" },
            { key:"lancamentos", icon:"✏️", label:"Lançar" },
            { key:"cartoes", icon:"💳", label:"Cartões" },
            { key:"relatorio", icon:"📈", label:"Relatório" },
            { key:"sincronizar", icon:"🔄", label:"Sincron." },
          ].map(n => (
            <div key={n.key} onClick={() => setActiveSection(n.key)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", cursor:"pointer", minWidth:"56px" }}>
              <span style={{ fontSize:"20px" }}>{n.icon}</span>
              <span style={{ fontSize:"9px", fontWeight:600, color: activeSection===n.key ? T.purple : T.textMuted }}>
                {n.label}
              </span>
              {activeSection === n.key && (
                <span style={{ width:"4px", height:"4px", borderRadius:"50%", background:T.purple, display:"block" }}/>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"20px", right:"20px", zIndex:9999, background: toast.type==="error" ? T.red : T.green, borderRadius:"10px", padding:"12px 18px", color:"#fff", fontWeight:600, fontSize:"13px", boxShadow:shadowMd }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
