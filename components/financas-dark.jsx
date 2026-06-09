"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ── Supabase ───────────────────────────────────────────────────────────────
const CASAL_ID = "casal";

// ── Constants ─────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const CARD_COLORS = ["#166534","#EF4444","#0EA5E9","#22C55E","#F59E0B","#EC4899","#8B5CF6","#14B8A6"];
const fmt = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const fmtK = (v) => Math.abs(v||0)>=1000?`R$${((v||0)/1000).toFixed(1)}k`:`R$${(v||0).toFixed(0)}`;
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const sumArr = (arr) => (arr||[]).reduce((s,x)=>s+(x.valor||0),0);
const LIMITE_MEI_ANUAL = 81000;
const LIMITE_MEI_MENSAL = LIMITE_MEI_ANUAL / 12; // R$ 6.750
const DAS_MEI_2026 = { inss: 75.90, iss: 5.00, icms: 1.00, totalServicos: 80.90, totalComercio: 76.90 };
const emptyMei = () => ({
  meis: [
    { id:"thayse", nome:"Thayse", cor:"#7C3AED", limiteAnual:81000, tipo:"servicos", dataAbertura:"", cnpj:"" },
    { id:"lucas",  nome:"Lucas",  cor:"#0284C7", limiteAnual:81000, tipo:"servicos", dataAbertura:"", cnpj:"" },
  ],
  notas: []
});
const emptyNFForm = (today="") => ({ meiId:"", competencia:"", dataEmissao:today, numeroNF:"", valor:"", prestador:"", tomador:"", descricao:"" });
const emptyYear = () => Array.from({length:12},(_,i)=>({month:i,receitas:[],despesas:[],investimentos:[],emprestimos:[]}));
const emptyCadastros = () => ({bancos:[],fornecedores:[],pessoas:[],catReceitas:[],catDespesas:[],catInvestimentos:[]});
const emptyRecForm = (today) => ({data:today,desc:"",ref:"",cliente:"",valor:"",formaRec:"pix",banco:""});
const emptyDespForm = (today) => ({data:today,desc:"",ref:"",fornecedor:"",valor:"",recorrente:false,formaPag:"avista",parcelas:"1",meioPag:"pix",pago:false});
const emptyInvForm = (today) => ({data:today,desc:"",ref:"",valor:"",investido:false,banco:""});
const emptyEmpForm = (today) => ({data:today,desc:"",ref:"",parafem:"",valor:"",valorParcela:"",parcelas:"1",dataVenc1:"",dataVencN:"",meioPag:"pix",pago:false});

// ── Theme ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:"#F1F5F9",surface:"#FFFFFF",surfaceAlt:"#F8FAFC",
  border:"#E2E8F0",borderStrong:"#CBD5E1",
  text:"#0F172A",textSub:"#64748B",textMuted:"#94A3B8",
  purple:"#166534",purpleLight:"#DCFCE7",
  green:"#16A34A",greenLight:"#DCFCE7",
  red:"#DC2626",redLight:"#FEE2E2",
  blue:"#0284C7",blueLight:"#E0F2FE",
  amber:"#D97706",amberLight:"#FEF3C7",
  indigo:"#4F46E5",indigoLight:"#EEF2FF",
};
const DARK = {
  bg:"#0A1310",surface:"#101B15",surfaceAlt:"#16241D",
  border:"rgba(255,255,255,0.10)",borderStrong:"rgba(255,255,255,0.20)",
  text:"#E8F1EC",textSub:"#9DB1A6",textMuted:"#6E847A",
  purple:"#22C55E",purpleLight:"rgba(34,197,94,0.18)",
  green:"#34D399",greenLight:"rgba(52,211,153,0.16)",
  red:"#F87171",redLight:"rgba(248,113,113,0.16)",
  blue:"#38BDF8",blueLight:"rgba(56,189,248,0.16)",
  amber:"#FBBF24",amberLight:"rgba(251,191,36,0.16)",
  indigo:"#A5B4FC",indigoLight:"rgba(165,180,252,0.16)",
};
let T = LIGHT;
const shadow = "0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04)";
const shadowMd = "0 4px 6px rgba(0,0,0,0.07),0 2px 4px rgba(0,0,0,0.04)";
const card = (ex={}) => ({background:T.surface,border:`1px solid ${T.border}`,borderRadius:"14px",padding:"18px",boxShadow:shadow,marginBottom:"14px",...ex});
const btnP = (col=T.purple) => ({padding:"9px 18px",borderRadius:"9px",border:"none",cursor:"pointer",background:col,color:"#fff",fontWeight:600,fontSize:"13px",boxShadow:`0 2px 8px ${col}40`,whiteSpace:"nowrap"});
const btnO = (col=T.purple) => ({padding:"8px 16px",borderRadius:"9px",border:`1.5px solid ${col}`,cursor:"pointer",background:"transparent",color:col,fontWeight:600,fontSize:"12px",whiteSpace:"nowrap"});
let inpS, selS, inpDate, btnG, remB, editB, itemRow;
function applyTheme(dark){
  T = dark ? DARK : LIGHT;
  const inp = {background:T.surface,border:`1.5px solid ${T.borderStrong}`,borderRadius:"9px",padding:"8px 12px",color:T.text,fontSize:"13px",outline:"none",width:"100%",boxSizing:"border-box"};
  inpS = inp; selS = inp; inpDate = inp;
  btnG = {padding:"8px 14px",borderRadius:"9px",border:`1px solid ${T.border}`,cursor:"pointer",background:T.surface,color:T.textSub,fontWeight:600,fontSize:"12px"};
  remB = {background:T.redLight,border:`1px solid ${T.red}55`,color:T.red,borderRadius:"6px",cursor:"pointer",padding:"3px 8px",fontSize:"11px",fontWeight:600};
  editB = {background:T.indigoLight,border:`1px solid ${T.indigo}55`,color:T.indigo,borderRadius:"6px",cursor:"pointer",padding:"3px 8px",fontSize:"11px",fontWeight:600};
  itemRow = {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:"10px",marginBottom:"5px",background:T.surfaceAlt,border:`1px solid ${T.border}`};
}
applyTheme(false);
const chip = (col) => ({display:"inline-flex",padding:"2px 9px",borderRadius:"20px",fontSize:"11px",fontWeight:700,background:`${col}15`,color:col,border:`1px solid ${col}30`});
const navI = (a) => ({display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"10px",cursor:"pointer",color:a?T.purple:T.textSub,background:a?T.purpleLight:"transparent",fontWeight:a?600:400,fontSize:"14px",transition:"all 0.15s"});
const subNavI = (a) => ({display:"flex",alignItems:"center",gap:"8px",padding:"7px 12px",borderRadius:"8px",cursor:"pointer",color:a?T.purple:T.textSub,background:a?T.purpleLight:"transparent",fontWeight:a?600:400,fontSize:"13px"});
const toggleB = (a) => ({padding:"6px 14px",borderRadius:"8px",border:"none",cursor:"pointer",background:a?T.purple:"transparent",color:a?"#fff":T.textSub,fontSize:"12px",fontWeight:600,transition:"all 0.15s"});
const subT = (a) => ({padding:"7px 16px",borderRadius:"20px",border:`1.5px solid ${a?T.purple:T.border}`,background:a?T.purpleLight:"transparent",color:a?T.purple:T.textSub,fontSize:"12px",fontWeight:600,cursor:"pointer"});

// ── Helpers ────────────────────────────────────────────────────────────────
function CT({active,payload,label}){
  if(!active||!payload?.length)return null;
  return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"10px 14px",fontSize:"12px",boxShadow:shadowMd}}>
    <p style={{color:T.textSub,marginBottom:"5px",fontWeight:600}}>{label}</p>
    {payload.map((p,i)=><p key={i} style={{color:p.color,margin:"2px 0"}}>{p.name||p.dataKey}: {fmt(p.value)}</p>)}
  </div>;
}

function useIsMobile(){
  const [m,setM]=useState(typeof window!=="undefined"?window.innerWidth<768:false);
  useEffect(()=>{const fn=()=>setM(window.innerWidth<768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  return m;
}

// Radio button group
function RadioGroup({label,options,value,onChange}){
  return <div style={{marginBottom:"10px"}}>
    <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"5px",fontWeight:500}}>{label}</label>
    <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
      {options.map(o=>(
        <label key={o.value} style={{display:"flex",alignItems:"center",gap:"5px",cursor:"pointer",fontSize:"13px",color:T.text,padding:"6px 12px",borderRadius:"8px",border:`1.5px solid ${value===o.value?T.purple:T.border}`,background:value===o.value?T.purpleLight:T.surface,transition:"all 0.15s"}}>
          <input type="radio" name={label} value={o.value} checked={value===o.value} onChange={()=>onChange(o.value)} style={{accentColor:T.purple}}/>
          {o.label}
        </label>
      ))}
    </div>
  </div>;
}

function CheckRow({label,checked,onChange}){
  return <label style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",fontSize:"13px",color:T.text,padding:"8px 0"}}>
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{width:"16px",height:"16px",accentColor:T.purple,cursor:"pointer"}}/>
    {label}
  </label>;
}

function FormField({label,children,half}){
  return <div style={{gridColumn:half?"span 1":"span 2"}}>
    <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px",fontWeight:500}}>{label}</label>
    {children}
  </div>;
}

// ── Hero de saldo (estilo GreenMind app) ───────────────────────────────────
function BalanceHero({recTotal,despTotal,currentMonth,CY}){
  const [hide,setHide]=useState(false);
  const saldo = recTotal - despTotal;
  const taxa = recTotal>0 ? (saldo/recTotal)*100 : 0;
  const mask=(s)=>hide?"••••••":s;
  const AUp=<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>;
  const ADown=<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></svg>;
  const EyeIc=hide
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.16 3.19M6.6 6.6A18 18 0 0 0 2 12s3 8 10 8a9 9 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z"/><circle cx="12" cy="12" r="3"/></svg>;
  return (
    <div style={{position:"relative",overflow:"hidden",marginBottom:"14px",background:"linear-gradient(160deg,#166534 0%,#0F2419 100%)",color:"#fff",borderRadius:"20px",padding:"20px",boxShadow:"0 24px 44px -20px rgba(15,36,25,.7)"}}>
      <div style={{position:"absolute",inset:0,opacity:.5,background:"radial-gradient(140px 140px at 88% -8%, rgba(74,222,128,.45), transparent 70%),radial-gradient(180px 160px at 10% 120%, rgba(34,197,94,.30), transparent 70%)"}}/>
      <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"12.5px",color:"rgba(255,255,255,.75)"}}>
        <span>Saldo do mês · {MONTHS[currentMonth]} {CY}</span>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{background:"rgba(74,222,128,.22)",color:"#bbf7d0",fontSize:"11.5px",fontWeight:600,padding:"4px 10px",borderRadius:"9px"}}>{hide?"••":taxa.toFixed(0)+"%"} poupança</span>
          <button onClick={()=>setHide(h=>!h)} style={{background:"rgba(255,255,255,.14)",border:0,color:"#fff",width:"30px",height:"30px",borderRadius:"9px",display:"grid",placeItems:"center",cursor:"pointer"}}>{EyeIc}</button>
        </div>
      </div>
      <div style={{position:"relative",fontSize:"38px",fontWeight:700,margin:"6px 0 16px",letterSpacing:"-.02em"}}>{hide?"R$ ••••••":fmt(saldo)}</div>
      <div style={{position:"relative",display:"flex",gap:"10px"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:"9px",background:"rgba(255,255,255,.10)",borderRadius:"15px",padding:"10px 12px"}}>
          <span style={{width:"28px",height:"28px",borderRadius:"9px",display:"grid",placeItems:"center",flex:"none",background:"rgba(74,222,128,.30)",color:"#86efac"}}>{AUp}</span>
          <div><small style={{display:"block",fontSize:"11px",color:"rgba(255,255,255,.72)"}}>Receitas</small><b style={{fontSize:"14.5px",fontWeight:600}}>{mask(fmt(recTotal))}</b></div>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:"9px",background:"rgba(255,255,255,.10)",borderRadius:"15px",padding:"10px 12px"}}>
          <span style={{width:"28px",height:"28px",borderRadius:"9px",display:"grid",placeItems:"center",flex:"none",background:"rgba(248,113,113,.26)",color:"#fca5a5"}}>{ADown}</span>
          <div><small style={{display:"block",fontSize:"11px",color:"rgba(255,255,255,.72)"}}>Despesas</small><b style={{fontSize:"14.5px",fontWeight:600}}>{mask(fmt(despTotal))}</b></div>
        </div>
      </div>
    </div>
  );
}

// ── Modal de lançamento ────────────────────────────────────────────────────
function LancModal({tipo,form,setForm,onSave,onClose,cadastros,today}){
  if(!tipo)return null;
  const bancos = cadastros?.bancos||[];
  const pessoas = cadastros?.pessoas||[];
  const fornecedores = cadastros?.fornecedores||[];

  const grid = {display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"};
  const tLabel = {receita:"📥 Nova Receita",despesa:"📤 Nova Despesa",investimento:"💎 Novo Investimento",emprestimo:"🔄 Empréstimo / Parcelamento"};
  const tColor = {receita:T.green,despesa:T.red,investimento:T.blue,emprestimo:T.amber};

  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
      <div style={{background:T.surface,border:`2px solid ${tColor[tipo]}30`,borderRadius:"18px",padding:"24px",width:"620px",maxWidth:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:shadowMd}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
          <h3 style={{color:T.text,margin:0,fontSize:"16px",fontWeight:700,borderLeft:`4px solid ${tColor[tipo]}`,paddingLeft:"10px"}}>{tLabel[tipo]}</h3>
          <button style={{...btnG,padding:"4px 10px"}} onClick={onClose}>✕</button>
        </div>

        {tipo==="receita"&&(
          <div>
            <div style={grid}>
              <FormField label="Data" half><input type="date" style={inpDate} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/></FormField>
              <FormField label="Ref. Receita" half><input style={inpS} placeholder="Ex: NF-001" value={form.ref} onChange={e=>setForm(f=>({...f,ref:e.target.value}))}/></FormField>
              <FormField label="Descrição"><input style={inpS} placeholder="Descrição da receita" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))}/></FormField>
              <FormField label="Cliente / Pessoa" half>
                <input list="pessoas-list" style={inpS} placeholder="Nome do cliente" value={form.cliente} onChange={e=>setForm(f=>({...f,cliente:e.target.value}))}/>
                <datalist id="pessoas-list">{pessoas.map(p=><option key={p.id} value={p.nome}/>)}</datalist>
              </FormField>
              <FormField label="Valor (R$)" half><input type="number" step="0.01" style={inpS} placeholder="0,00" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))}/></FormField>
            </div>
            <RadioGroup label="Forma de Recebimento" value={form.formaRec} onChange={v=>setForm(f=>({...f,formaRec:v}))}
              options={[{value:"pix",label:"PIX"},{value:"dinheiro",label:"Dinheiro"},{value:"ted",label:"TED/DOC"},{value:"cheque",label:"Cheque"}]}/>
            <FormField label="Banco">
              <input list="bancos-list-r" style={inpS} placeholder="Selecione ou digite o banco" value={form.banco} onChange={e=>setForm(f=>({...f,banco:e.target.value}))}/>
              <datalist id="bancos-list-r">{bancos.map(b=><option key={b.id} value={b.nome}/>)}</datalist>
            </FormField>
          </div>
        )}

        {tipo==="despesa"&&(
          <div>
            <div style={grid}>
              <FormField label="Data" half><input type="date" style={inpDate} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/></FormField>
              <FormField label="Ref. Despesa" half><input style={inpS} placeholder="Ex: NF-001" value={form.ref} onChange={e=>setForm(f=>({...f,ref:e.target.value}))}/></FormField>
              <FormField label="Descrição"><input style={inpS} placeholder="Descrição da despesa" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))}/></FormField>
              <FormField label="Fornecedor / Pessoa" half>
                <input list="forn-list" style={inpS} placeholder="Nome do fornecedor" value={form.fornecedor} onChange={e=>setForm(f=>({...f,fornecedor:e.target.value}))}/>
                <datalist id="forn-list">{[...fornecedores,...pessoas].map(p=><option key={p.id} value={p.nome}/>)}</datalist>
              </FormField>
              <FormField label="Valor (R$)" half><input type="number" step="0.01" style={inpS} placeholder="0,00" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))}/></FormField>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <CheckRow label="Pagamento Recorrente" checked={form.recorrente} onChange={v=>setForm(f=>({...f,recorrente:v}))}/>
              <CheckRow label="Já foi Pago?" checked={form.pago} onChange={v=>setForm(f=>({...f,pago:v}))}/>
            </div>
            <RadioGroup label="Forma de Pagamento" value={form.formaPag} onChange={v=>setForm(f=>({...f,formaPag:v}))}
              options={[{value:"avista",label:"À vista"},{value:"parcelado",label:"Parcelado"}]}/>
            {form.formaPag==="parcelado"&&(
              <FormField label="Quantidade de Parcelas">
                <input type="number" style={inpS} placeholder="Ex: 12" value={form.parcelas} onChange={e=>setForm(f=>({...f,parcelas:e.target.value}))}/>
              </FormField>
            )}
            <RadioGroup label="Meio de Pagamento" value={form.meioPag} onChange={v=>setForm(f=>({...f,meioPag:v}))}
              options={[{value:"pix",label:"PIX"},{value:"dinheiro",label:"Dinheiro"},{value:"cheque",label:"Cheque"},{value:"boleto",label:"Boleto"},{value:"cartao",label:"Cartão"}]}/>
          </div>
        )}

        {tipo==="investimento"&&(
          <div>
            <div style={grid}>
              <FormField label="Data" half><input type="date" style={inpDate} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/></FormField>
              <FormField label="Ref. Investimento" half><input style={inpS} placeholder="Ex: INV-001" value={form.ref} onChange={e=>setForm(f=>({...f,ref:e.target.value}))}/></FormField>
              <FormField label="Descrição"><input style={inpS} placeholder="Descrição do investimento" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))}/></FormField>
              <FormField label="Valor (R$)" half><input type="number" step="0.01" style={inpS} placeholder="0,00" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))}/></FormField>
              <FormField label="Banco / Corretora" half>
                <input list="bancos-list-i" style={inpS} placeholder="Ex: XP, Nubank" value={form.banco} onChange={e=>setForm(f=>({...f,banco:e.target.value}))}/>
                <datalist id="bancos-list-i">{bancos.map(b=><option key={b.id} value={b.nome}/>)}</datalist>
              </FormField>
            </div>
            <CheckRow label="Já foi Investido / Aplicado?" checked={form.investido} onChange={v=>setForm(f=>({...f,investido:v}))}/>
          </div>
        )}

        {tipo==="emprestimo"&&(
          <div>
            <div style={grid}>
              <FormField label="Data" half><input type="date" style={inpDate} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/></FormField>
              <FormField label="Ref. Empréstimo" half><input style={inpS} placeholder="Ex: EMP-001" value={form.ref} onChange={e=>setForm(f=>({...f,ref:e.target.value}))}/></FormField>
              <FormField label="Descrição"><input style={inpS} placeholder="Ex: Financiamento veículo" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))}/></FormField>
              <FormField label="Para quem / De quem" half>
                <input list="all-list" style={inpS} placeholder="Pessoa / Banco / Fornecedor" value={form.parafem} onChange={e=>setForm(f=>({...f,parafem:e.target.value}))}/>
                <datalist id="all-list">{[...pessoas,...fornecedores,...bancos].map(p=><option key={p.id} value={p.nome}/>)}</datalist>
              </FormField>
              <FormField label="Valor Total (R$)" half><input type="number" step="0.01" style={inpS} placeholder="0,00" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))}/></FormField>
              <FormField label="Valor da Parcela (R$)" half><input type="number" step="0.01" style={inpS} placeholder="0,00" value={form.valorParcela} onChange={e=>setForm(f=>({...f,valorParcela:e.target.value}))}/></FormField>
              <FormField label="Quantidade de Parcelas" half><input type="number" style={inpS} placeholder="Ex: 48" value={form.parcelas} onChange={e=>setForm(f=>({...f,parcelas:e.target.value}))}/></FormField>
              <FormField label="Vencimento 1ª Parcela" half><input type="date" style={inpDate} value={form.dataVenc1} onChange={e=>setForm(f=>({...f,dataVenc1:e.target.value}))}/></FormField>
              <FormField label="Vencimento Última Parcela" half><input type="date" style={inpDate} value={form.dataVencN} onChange={e=>setForm(f=>({...f,dataVencN:e.target.value}))}/></FormField>
            </div>
            <RadioGroup label="Forma de Pagamento" value={form.meioPag} onChange={v=>setForm(f=>({...f,meioPag:v}))}
              options={[{value:"pix",label:"PIX"},{value:"dinheiro",label:"Dinheiro"},{value:"cheque",label:"Cheque"},{value:"boleto",label:"Boleto"}]}/>
            <CheckRow label="Já foi Pago / Quitado?" checked={form.pago} onChange={v=>setForm(f=>({...f,pago:v}))}/>
          </div>
        )}

        <div style={{display:"flex",gap:"8px",marginTop:"18px",justifyContent:"flex-end",borderTop:`1px solid ${T.border}`,paddingTop:"16px"}}>
          <button style={btnP(tColor[tipo])} onClick={onSave}>✅ Adicionar {tipo==="receita"?"Receita":tipo==="despesa"?"Despesa":tipo==="investimento"?"Investimento":"Empréstimo"}</button>
          <button style={btnG} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── ItemList (fora do App) ─────────────────────────────────────────────────
function ItemList({items,col,emptyMsg,onEdit,onRemove,onBaixa,tipo}){
  const meioPagLabel={pix:"PIX",dinheiro:"Dinheiro",cheque:"Cheque",boleto:"Boleto",ted:"TED",cartao:"Cartão"};
  const getBaixaLabel=(item)=>{
    if(tipo==="receita") return item.recebido?"✓ Recebido":"Receber";
    if(tipo==="investimento") return item.investido?"✓ Aplicado":"Aplicar";
    return item.pago?"✓ Pago":"Dar Baixa";
  };
  const isConfirmado=(item)=>item.recebido||item.investido||item.pago;
  if(!items||items.length===0) return <p style={{color:T.textMuted,fontSize:"13px",textAlign:"center",padding:"20px 0"}}>{emptyMsg}</p>;
  return <div>
    {items.map(item=>{
      const confirmado=isConfirmado(item);
      return(
        <div key={item.id} style={{...itemRow,flexWrap:"wrap",gap:"8px",background:confirmado?"#F0FDF4":T.surfaceAlt,border:`1px solid ${confirmado?"#BBF7D0":T.border}`}}>
          <div style={{flex:1,minWidth:"180px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
              <p style={{color:confirmado?T.green:T.text,fontSize:"13px",fontWeight:600,margin:0,textDecoration:confirmado?"none":"none"}}>{item.desc}</p>
              {item.ref&&<span style={{...chip(T.purple),fontSize:"10px"}}>{item.ref}</span>}
              {confirmado&&<span style={{...chip(T.green),fontSize:"10px"}}>✓ {tipo==="receita"?"Recebido":tipo==="investimento"?"Aplicado":"Pago"}</span>}
              {item.recorrente&&<span style={{...chip(T.amber),fontSize:"10px"}}>🔁</span>}
              {item.dataBaixa&&<span style={{fontSize:"10px",color:T.green}}>em {item.dataBaixa}</span>}
            </div>
            <div style={{display:"flex",gap:"8px",marginTop:"3px",flexWrap:"wrap"}}>
              <span style={{color:T.textMuted,fontSize:"11px"}}>{item.date||item.data}</span>
              {item.cliente&&<span style={{color:T.textSub,fontSize:"11px"}}>👤 {item.cliente}</span>}
              {item.fornecedor&&<span style={{color:T.textSub,fontSize:"11px"}}>🏢 {item.fornecedor}</span>}
              {item.parafem&&<span style={{color:T.textSub,fontSize:"11px"}}>↔ {item.parafem}</span>}
              {item.banco&&<span style={{color:T.textSub,fontSize:"11px"}}>🏦 {item.banco}</span>}
              {item.meioPag&&<span style={{color:T.blue,fontSize:"11px"}}>{meioPagLabel[item.meioPag]||item.meioPag}</span>}
              {item.parcelaNum&&<span style={{color:T.amber,fontSize:"11px",fontWeight:600,background:"#FEF3C7",padding:"1px 6px",borderRadius:"4px"}}>Parcela {item.parcelaNum}/{item.parcelas} • {fmt(item.valorTotal||item.valor*item.parcelas)}</span>}
              {!item.parcelaNum&&item.parcelas>1&&<span style={{color:T.amber,fontSize:"11px"}}>{item.parcelas}x</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
            <span style={{color:confirmado?T.green:col,fontWeight:700,fontSize:"14px"}}>{fmt(item.valor)}</span>
            <button
              style={{background:confirmado?"#DCFCE7":"#EFF6FF",border:`1px solid ${confirmado?"#BBF7D0":"#BFDBFE"}`,color:confirmado?T.green:T.blue,borderRadius:"6px",cursor:"pointer",padding:"4px 9px",fontSize:"11px",fontWeight:700,whiteSpace:"nowrap"}}
              onClick={()=>onBaixa(item.id)}>
              {getBaixaLabel(item)}
            </button>
            <button style={editB} onClick={()=>onEdit(item)}>✏️</button>
            <button style={remB} onClick={()=>onRemove(item.id)}>✕</button>
          </div>
        </div>
      );
    })}
  </div>;
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App(){
  const today = new Date().toISOString().split("T")[0];
  const CY = currentYear; const nowM = new Date().getMonth();
  const yrMs = Array.from({length:12},(_,i)=>i);

  // ── MULTI-ANO ─────────────────────────────────────────────────
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [allYearsData, setAllYearsData] = useState({ [String(new Date().getFullYear())]: emptyYear() });
  // data = janela do ano atual; setData = atualiza apenas o ano atual
  const data = allYearsData[String(currentYear)] || emptyYear();
  const setData = (updaterOrValue) => setAllYearsData(all => {
    const yr = String(currentYear);
    const prev = all[yr] || emptyYear();
    return { ...all, [yr]: typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue };
  });
  // state
  const [cadastros, setCadastros] = useState(emptyCadastros());
  const [cartoes, setCartoes] = useState([]);
  const [usoCartoes, setUsoCartoes] = useState([]);
  const [pagamentos, setPagamentos] = useState({});
  const [syncUrl, setSyncUrl] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [lancTab, setLancTab] = useState("receita");
  const [cardSub, setCardSub] = useState("cadastro");
  const [cadSub, setCadSub] = useState("bancos");
  const [faturaTab, setFaturaTab] = useState("apagar");
  const [view, setView] = useState("mes");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useState(false);
  useEffect(()=>{ try{ if(localStorage.getItem('gm_theme')==='dark') setDark(true); }catch(e){} },[]);
  const toggleTheme = () => setDark(d=>{ const n=!d; try{ localStorage.setItem('gm_theme', n?'dark':'light'); }catch(e){} return n; });
  applyTheme(dark);
  const [showModal, setShowModal] = useState(null); // tipo do modal
  const [editingItem, setEditingItem] = useState(null);
  const [recForm, setRecForm] = useState(emptyRecForm(today));
  const [despForm, setDespForm] = useState(emptyDespForm(today));
  const [invForm, setInvForm] = useState(emptyInvForm(today));
  const [empForm, setEmpForm] = useState(emptyEmpForm(today));
  const [novoCartao, setNovoCartao] = useState({nome:"",diaFechamento:"",diaPagamento:"",limite:""});
  const [novoUso, setNovoUso] = useState({cartaoId:"",data:today,descricao:"",valor:"",parcelas:"1"});
  const [novoCad, setNovoCad] = useState({nome:"",obs:"",agencia:"",conta:"",limite:""});
  const [editCad, setEditCad] = useState(null); // {tipo, item}
  const [syncMonth, setSyncMonth] = useState(nowM);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncPreview, setSyncPreview] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [faturaDetalhe, setFaturaDetalhe] = useState(null); // {cartaoId, month, year}
  const [usoFiltroCartao, setUsoFiltroCartao] = useState(""); // filter for uso de cartoes table
  const [relTipo, setRelTipo] = useState("mensal");
  const [relCartaoId, setRelCartaoId] = useState("");
  const [relMes, setRelMes] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`);
  const [relFiltroTexto, setRelFiltroTexto] = useState("");
  const [pagamentoModal, setPagamentoModal] = useState(null); // {cartaoId, month, year, valorFatura, nomeCartao}
  const [pagForm, setPagForm] = useState({tipo:"total", valor:"", data:"", obs:""});
  const [editUso, setEditUso] = useState(null); // for editing a credit card purchase
  const [meiData, setMeiData] = useState(emptyMei());
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [meiTab, setMeiTab] = useState("lancamentos");
  const [meiViewYear, setMeiViewYear] = useState(new Date().getFullYear());
  const [meiVisualMonth, setMeiVisualMonth] = useState(new Date().toISOString().slice(0,7));
  const [nfForm, setNfForm] = useState(()=>emptyNFForm(new Date().toISOString().split("T")[0]));
  const [editNF, setEditNF] = useState(null);
  const [editMei, setEditMei] = useState(null);
  const [showLote, setShowLote] = useState(false);
  const [loteText, setLoteText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState(null);
  const isMobile = useIsMobile();
  const sw = isMobile?"0px":sidebarOpen?"225px":"64px";

  const showToast = (msg,type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2800); };

  // supabase
  useEffect(()=>{
    const supabase = createClient();
    const load = async() => {
      try {
        const {data:row} = await supabase.from("financas_compartilhadas").select("*").eq("id",CASAL_ID).single();
        if(row){
          // Migração: array antigo → multi-ano
          let loadedAllYears = {};
          if(Array.isArray(row.data)&&row.data.length>0){
            // formato antigo: array de 12 meses → 2026
            const base = emptyYear();
            row.data.forEach((m,i)=>{ if(i<12&&m) base[i]={month:i,receitas:Array.isArray(m.receitas)?m.receitas:[],despesas:Array.isArray(m.despesas)?m.despesas:[],investimentos:Array.isArray(m.investimentos)?m.investimentos:[],emprestimos:Array.isArray(m.emprestimos)?m.emprestimos:[]}; });
            loadedAllYears = { "2026": base };
          } else if(row.data&&typeof row.data==="object"&&!Array.isArray(row.data)){
            // formato novo: { "2026": [...], "2025": [...] }
            Object.entries(row.data).forEach(([yr,months])=>{
              if(Array.isArray(months)){
                const base = emptyYear();
                months.forEach((m,i)=>{ if(i<12&&m) base[i]={month:i,receitas:Array.isArray(m.receitas)?m.receitas:[],despesas:Array.isArray(m.despesas)?m.despesas:[],investimentos:Array.isArray(m.investimentos)?m.investimentos:[],emprestimos:Array.isArray(m.emprestimos)?m.emprestimos:[]}; });
                loadedAllYears[yr]=base;
              }
            });
          }
          if(Object.keys(loadedAllYears).length>0) setAllYearsData(loadedAllYears);
          if(row.cartoes&&Array.isArray(row.cartoes))setCartoes(row.cartoes);
          if(row.uso_cartoes&&Array.isArray(row.uso_cartoes))setUsoCartoes(row.uso_cartoes);
          if(row.pagamentos&&typeof row.pagamentos==="object")setPagamentos(row.pagamentos);
          if(row.sync_url)setSyncUrl(row.sync_url);
          if(row.cadastros&&typeof row.cadastros==="object")setCadastros({...emptyCadastros(),...row.cadastros});
          if(row.mei_data&&typeof row.mei_data==="object")setMeiData({...emptyMei(),...row.mei_data,meis:(row.mei_data.meis||emptyMei().meis),notas:Array.isArray(row.mei_data.notas)?row.mei_data.notas:[]});
        }
      } catch(e){console.error("Load error",e);}
    };
    load();
    const ch = supabase.channel("fin_rt")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"financas_compartilhadas",filter:`id=eq.${CASAL_ID}`},(payload)=>{
        const row = payload.new;
        let rtAllYears = {};
        if(Array.isArray(row.data)&&row.data.length>0){
          const base=emptyYear();
          row.data.forEach((m,i)=>{ if(i<12&&m) base[i]={month:i,receitas:Array.isArray(m.receitas)?m.receitas:[],despesas:Array.isArray(m.despesas)?m.despesas:[],investimentos:Array.isArray(m.investimentos)?m.investimentos:[],emprestimos:Array.isArray(m.emprestimos)?m.emprestimos:[]}; });
          rtAllYears={"2026":base};
        } else if(row.data&&typeof row.data==="object"&&!Array.isArray(row.data)){
          Object.entries(row.data).forEach(([yr,months])=>{
            if(Array.isArray(months)){
              const base=emptyYear();
              months.forEach((m,i)=>{ if(i<12&&m) base[i]={month:i,receitas:Array.isArray(m.receitas)?m.receitas:[],despesas:Array.isArray(m.despesas)?m.despesas:[],investimentos:Array.isArray(m.investimentos)?m.investimentos:[],emprestimos:Array.isArray(m.emprestimos)?m.emprestimos:[]}; });
              rtAllYears[yr]=base;
            }
          });
        }
        if(Object.keys(rtAllYears).length>0) setAllYearsData(rtAllYears);
        if(row.cartoes&&Array.isArray(row.cartoes))setCartoes(row.cartoes);
        if(row.uso_cartoes&&Array.isArray(row.uso_cartoes))setUsoCartoes(row.uso_cartoes);
        if(row.pagamentos&&typeof row.pagamentos==="object")setPagamentos(row.pagamentos);
        if(row.cadastros&&typeof row.cadastros==="object")setCadastros({...emptyCadastros(),...row.cadastros});
        if(row.mei_data&&typeof row.mei_data==="object")setMeiData({...emptyMei(),...row.mei_data,meis:(row.mei_data.meis||emptyMei().meis),notas:Array.isArray(row.mei_data.notas)?row.mei_data.notas:[]});
        showToast("🔄 Atualizado!");
      }).subscribe();
    return()=>supabase.removeChannel(ch);
  },[]);

  const saveToSupa = async(payload) => {
    const supabase = createClient();
    const {error} = await supabase.from("financas_compartilhadas").upsert({
      id:CASAL_ID, updated_at:new Date().toISOString(),
      data:payload.allYearsData||payload.data||{},
      cartoes:Array.isArray(payload.cartoes)?payload.cartoes:[],
      uso_cartoes:Array.isArray(payload.uso_cartoes)?payload.uso_cartoes:[],
      pagamentos:payload.pagamentos||{},
      sync_url:payload.sync_url||"",
      cadastros:payload.cadastros||emptyCadastros(),
      mei_data:payload.mei_data||emptyMei(),
    });
    if(error)throw error;
  };

  const safeData = useMemo(()=>{
    const base = emptyYear();
    if(Array.isArray(data)) data.forEach((m,i)=>{ if(i<12) base[i]={month:i,receitas:Array.isArray(m?.receitas)?m.receitas:[],despesas:Array.isArray(m?.despesas)?m.despesas:[],investimentos:Array.isArray(m?.investimentos)?m.investimentos:[],emprestimos:Array.isArray(m?.emprestimos)?m.emprestimos:[]}; });
    return base;
  },[data]);

  const monthData = safeData[currentMonth];
  const recTotal=sumArr(monthData.receitas), despTotal=sumArr(monthData.despesas), invTotal=sumArr(monthData.investimentos), empTotal=sumArr(monthData.emprestimos);
  const saldo = recTotal - despTotal - invTotal - empTotal;

  // cartao
  const getInstMonths = (uso) => {
    const d=new Date(uso.data+"T12:00:00"), card=cartoes.find(c=>c.id===uso.cartaoId), dF=card?.diaFechamento||1;
    let sm=d.getMonth(),sy=d.getFullYear();
    if(d.getDate()>dF){sm++;if(sm>11){sm=0;sy++;}}
    return Array.from({length:uso.parcelas},(_,i)=>{let m=sm+i,y=sy;while(m>11){m-=12;y++;}return{year:y,month:m};});
  };

  const fatMap = useMemo(()=>{
    const r={};
    usoCartoes.forEach(u=>{getInstMonths(u).forEach(({year,month})=>{const k=`${u.cartaoId}_${year}_${month}`;r[k]=(r[k]||0)+u.valorParcela;});});
    return r;
  },[usoCartoes,cartoes]);

  const getFat=(cid,y,m)=>fatMap[`${cid}_${y}_${m}`]||0;
  const isPago=(cid,y,m)=>{const v=pagamentos[`${cid}_${y}_${m}`];return v===true||v?.pago===true;};
  const abrirPagamentoModal=(cid,y,m)=>{
    const card=cartoes.find(c=>c.id===cid);
    const vFatura=getFat(cid,y,m);
    const pagAtual=pagamentos[`${cid}_${y}_${m}`];
    const jaEhPago=pagAtual===true||pagAtual?.pago===true;
    if(jaEhPago){
      // Já pago: confirma se quer desmarcar
      if(confirm("Esta fatura já está marcada como paga. Desmarcar?")) {
        const np={...pagamentos,[`${cid}_${y}_${m}`]:null};
        setPagamentos(np);
        saveToSupa({allYearsData:{...allYearsData,[String(currentYear)]:safeData},cartoes,uso_cartoes:usoCartoes,pagamentos:np,sync_url:syncUrl,cadastros}).catch(()=>{});
      }
      return;
    }
    const saldoRestante=pagAtual?.pagoParcial?vFatura-(pagAtual?.valorPago||0):vFatura;
    setPagForm({tipo:"total",valor:saldoRestante.toFixed(2),data:today,obs:""});
    setPagamentoModal({cartaoId:cid,year:y,month:m,valorFatura:vFatura,saldoRestante,nomeCartao:card?.nome||"Cartão"});
  };

  const confirmarPagamento=async()=>{
    if(!pagamentoModal)return;
    const{cartaoId,year,month,valorFatura}=pagamentoModal;
    const key=`${cartaoId}_${year}_${month}`;
    const valorPago=parseFloat(pagForm.valor)||0;
    const pagAtual=pagamentos[key];
    const totalJaPago=pagAtual?.pagoParcial?(pagAtual?.valorPago||0):0;
    const totalAcumulado=totalJaPago+valorPago;
    const pagamentoTotal=pagForm.tipo==="total"||totalAcumulado>=valorFatura-0.01;
    const np={...pagamentos,[key]:{
      pago:pagamentoTotal,
      pagoParcial:!pagamentoTotal,
      valorPago:totalAcumulado,
      saldoDevedor:Math.max(0,valorFatura-totalAcumulado),
      data:pagForm.data||today,
      obs:pagForm.obs,
      tipo:pagForm.tipo,
      historico:[...(pagAtual?.historico||[]),{valor:valorPago,data:pagForm.data||today,obs:pagForm.obs}],
    }};
    setPagamentos(np);
    try{await saveToSupa({allYearsData:{...allYearsData,[String(currentYear)]:safeData},cartoes,uso_cartoes:usoCartoes,pagamentos:np,sync_url:syncUrl,cadastros});showToast(pagamentoTotal?"✅ Fatura paga integralmente!":"⚡ Pagamento parcial registrado!");}catch(_){showToast("Erro ao salvar","error");}
    setPagamentoModal(null);
  };

  const isPagoParcial=(cid,y,m)=>{const v=pagamentos[`${cid}_${y}_${m}`];return v?.pagoParcial===true;};
  const getValorPago=(cid,y,m)=>{const v=pagamentos[`${cid}_${y}_${m}`];if(v===true)return null;return v?.valorPago||0;};
  const getSaldoDevedor=(cid,y,m)=>{const v=pagamentos[`${cid}_${y}_${m}`];return v?.saldoDevedor||0;};
  const getDataPagamento=(cid,y,m)=>{const v=pagamentos[`${cid}_${y}_${m}`];return v?.data||"";};
  // keep old togglePago for dashboard card usage
  const togglePago=abrirPagamentoModal;

  const faturasMes=cartoes.reduce((s,c)=>s+getFat(c.id,CY,currentMonth),0);
  const faturasAbertas=faturasMes-cartoes.reduce((s,c)=>s+(isPago(c.id,CY,currentMonth)?getFat(c.id,CY,currentMonth):0),0);
  const saldoReal=saldo-faturasAbertas;
  const recConfirmado=sumArr(monthData.receitas.filter(x=>x.recebido));
  // ── VISÃO ANUAL ───────────────────────────────────────────────
  const anoRecTotal = safeData.reduce((s,m)=>s+sumArr(m.receitas),0);
  const anoDespTotal = safeData.reduce((s,m)=>s+sumArr(m.despesas),0);
  const anoInvTotal = safeData.reduce((s,m)=>s+sumArr(m.investimentos),0);
  const anoEmpTotal = safeData.reduce((s,m)=>s+sumArr(m.emprestimos),0);
  const anoCartTotal = yrMs.reduce((s,i)=>s+cartoes.reduce((ss,c)=>ss+getFat(c.id,CY,i),0),0);
  const anoCartAberto = yrMs.reduce((s,i)=>s+cartoes.reduce((ss,c)=>ss+(!isPago(c.id,CY,i)?getFat(c.id,CY,i):0),0),0);
  const anoSaldo = anoRecTotal - anoDespTotal - anoInvTotal - anoEmpTotal;
  const anoSaldoReal = anoSaldo - anoCartTotal; // Saldo real = menos todas as faturas do ano
  const anoRecConf = safeData.reduce((s,m)=>s+sumArr(m.receitas.filter(x=>x.recebido)),0);
  const anoDespConf = safeData.reduce((s,m)=>s+sumArr(m.despesas.filter(x=>x.pago)),0);
  // meses com algum dado no ano
  const mesesComDadosAno = safeData.filter(m=>sumArr(m.receitas)+sumArr(m.despesas)+sumArr(m.investimentos)+sumArr(m.emprestimos)>0).length;
  // Parcelados: provisão dos próximos meses
  const realNowYear = new Date().getFullYear();
  const proximosParcelados=yrMs.filter(m=>currentYear!==realNowYear?true:m>currentMonth).map(m=>({
    month:m,
    despesas:sumArr(safeData[m].despesas.filter(x=>x.parcelaGroupId||x.recorrenteGroupId)),
    emprestimos:sumArr(safeData[m].emprestimos.filter(x=>x.parcelaGroupId)),
  })).filter(m=>m.despesas>0||m.emprestimos>0).slice(0,4);
  const despConfirmada=sumArr(monthData.despesas.filter(x=>x.pago));
  const invConfirmado=sumArr(monthData.investimentos.filter(x=>x.investido));
  const empConfirmado=sumArr(monthData.emprestimos.filter(x=>x.pago));
  const totalAtrasado=yrMs.slice(0,nowM).reduce((s,m)=>s+cartoes.reduce((ss,c)=>ss+(!isPago(c.id,CY,m)?getFat(c.id,CY,m):0),0),0);
  const totalAnualCartoes=yrMs.reduce((s,m)=>s+cartoes.reduce((ss,c)=>ss+getFat(c.id,CY,m),0),0);
  const totalAbertoPendente=yrMs.reduce((s,m)=>s+cartoes.reduce((ss,c)=>ss+(!isPago(c.id,CY,m)?getFat(c.id,CY,m):0),0),0);
  const proximasFaturas=yrMs
    .filter(m=>currentYear!==realNowYear || m>=nowM) // ano diferente: mostra todos; ano atual: a partir de hoje
    .map(m=>({month:m,total:cartoes.reduce((s,c)=>s+getFat(c.id,CY,m),0),pago:cartoes.every(c=>getFat(c.id,CY,m)===0||isPago(c.id,CY,m))}))
    .filter(f=>f.total>0)
    .slice(0,6);
  const totalGastoCartoes=usoCartoes.reduce((s,u)=>s+u.valor,0);
  const mesesComFat=new Set(Object.keys(fatMap).map(k=>k.split("_").slice(1).join("_"))).size;
  const mediaFat=mesesComFat>0?Object.values(fatMap).reduce((s,v)=>s+v,0)/mesesComFat:0;

  // chart
  const chartData=MS.map((m,i)=>({name:m,Receitas:sumArr(safeData[i].receitas),Despesas:sumArr(safeData[i].despesas)+sumArr(safeData[i].emprestimos),Cartões:cartoes.reduce((s,c)=>s+getFat(c.id,CY,i),0),Saldo:sumArr(safeData[i].receitas)-sumArr(safeData[i].despesas)-sumArr(safeData[i].investimentos)-sumArr(safeData[i].emprestimos)-cartoes.reduce((s,c)=>s+(!isPago(c.id,CY,i)?getFat(c.id,CY,i):0),0)}));
  const cartaoChart=MS.map((m,i)=>({name:m,total:cartoes.reduce((s,c)=>s+getFat(c.id,CY,i),0)}));

  // add/remove items
  const addItem = (tipo) => {
    let f,key,item;
    if(tipo==="receita"){
      f=recForm; key="receitas";
      if(!f.desc||!f.valor){showToast("Preencha descrição e valor","error");return;}
      item={id:uid(),desc:f.desc,valor:parseFloat(f.valor)||0,date:f.data,ref:f.ref,cliente:f.cliente,formaRec:f.formaRec,banco:f.banco};
      setRecForm(emptyRecForm(today));
    } else if(tipo==="despesa"){
      f=despForm; key="despesas";
      if(!f.desc||!f.valor){showToast("Preencha descrição e valor","error");return;}
      const parcelas=parseInt(f.parcelas)||1;
      const valorTotal=parseFloat(f.valor)||0;

      // ── PARCELADO: distribui nos meses seguintes (MULTI-ANO) ──────
      if(f.formaPag==="parcelado"&&parcelas>1){
        const valorParcela=parseFloat((valorTotal/parcelas).toFixed(2));
        const startMonth=new Date(f.data+"T12:00:00").getMonth();
        const groupId=uid();
        let newAllYears={...allYearsData};
        let criadas=0;
        let lastYear=currentYear,lastMonth=startMonth;
        for(let i=0;i<parcelas;i++){
          let tm=startMonth+i;
          let ty=currentYear;
          while(tm>11){tm-=12;ty++;}
          lastYear=ty;lastMonth=tm;
          const yrKey=String(ty);
          const baseYear=(Array.isArray(newAllYears[yrKey])&&newAllYears[yrKey].length===12)
            ?newAllYears[yrKey].map(m=>({...m,despesas:[...m.despesas]})):emptyYear();
          baseYear[tm].despesas.push({id:uid(),desc:f.desc,valor:valorParcela,valorTotal,date:f.data,ref:f.ref,fornecedor:f.fornecedor,recorrente:false,formaPag:"parcelado",parcelas,parcelaNum:i+1,parcelaGroupId:groupId,meioPag:f.meioPag,pago:f.pago});
          newAllYears={...newAllYears,[yrKey]:baseYear};
          criadas++;
        }
        setAllYearsData(newAllYears);
        setDespForm(emptyDespForm(today));
        setShowModal(null);
        const lastLabel=lastYear===currentYear?MONTHS[lastMonth]:`${MONTHS[lastMonth]}/${lastYear}`;
        showToast(`✅ ${criadas} parcelas distribuídas (${MONTHS[startMonth]}/${currentYear} → ${lastLabel})`);
        return;
      }
      // ── RECORRENTE: distribui do mês de início até dezembro ───────
      if(f.recorrente){
        const startMonth=new Date(f.data+"T12:00:00").getMonth();
        const groupId=uid();
        const nd=safeData.map(m=>({...m,despesas:[...m.despesas]}));
        let criadas=0;
        for(let i=startMonth;i<=11;i++){
          nd[i].despesas.push({
            id:uid(),
            desc:f.desc,
            valor:valorTotal,
            date:f.data,
            ref:f.ref,
            fornecedor:f.fornecedor,
            recorrente:true,
            recorrenteGroupId:groupId,
            mesRecorrente:i+1,
            formaPag:f.formaPag,
            parcelas:1,
            meioPag:f.meioPag,
            pago:f.pago,
          });
          criadas++;
        }
        setData(nd);
        setDespForm(emptyDespForm(today));
        setShowModal(null);
        showToast(`🔁 Despesa recorrente criada em ${criadas} meses (${MONTHS[startMonth]} a Dezembro)`);
        return;
      }
      // ── À VISTA ───────────────────────────────────────────────────
      item={id:uid(),desc:f.desc,valor:valorTotal,date:f.data,ref:f.ref,fornecedor:f.fornecedor,recorrente:false,formaPag:f.formaPag,parcelas:1,meioPag:f.meioPag,pago:f.pago};
      setDespForm(emptyDespForm(today));
    } else if(tipo==="investimento"){
      f=invForm; key="investimentos";
      if(!f.desc||!f.valor){showToast("Preencha descrição e valor","error");return;}
      item={id:uid(),desc:f.desc,valor:parseFloat(f.valor)||0,date:f.data,ref:f.ref,investido:f.investido,banco:f.banco};
      setInvForm(emptyInvForm(today));
    } else {
      f=empForm; key="emprestimos";
      if(!f.desc||!f.valor){showToast("Preencha descrição e valor","error");return;}
      // Empréstimo parcelado — distribui nos meses
      const parcEmp=parseInt(f.parcelas)||1;
      const valTotalEmp=parseFloat(f.valor)||0;
      const valParcEmp=parseFloat(f.valorParcela)||parseFloat((valTotalEmp/parcEmp).toFixed(2));
      if(parcEmp>1){
        const startEmp=new Date(f.data+"T12:00:00").getMonth();
        const groupEmp=uid();
        let newAllYearsEmp={...allYearsData};
        let criadasEmp=0;
        for(let i=0;i<parcEmp;i++){
          let tm=startEmp+i;
          let ty=currentYear;
          while(tm>11){tm-=12;ty++;}
          const yrKey=String(ty);
          const baseYearEmp=(Array.isArray(newAllYearsEmp[yrKey])&&newAllYearsEmp[yrKey].length===12)
            ?newAllYearsEmp[yrKey].map(m=>({...m,emprestimos:[...m.emprestimos]})):emptyYear();
          baseYearEmp[tm].emprestimos.push({id:uid(),desc:f.desc,valor:valParcEmp,valorTotal:valTotalEmp,date:f.data,ref:f.ref,parafem:f.parafem,parcelas:parcEmp,parcelaNum:i+1,parcelaGroupId:groupEmp,dataVenc1:f.dataVenc1,dataVencN:f.dataVencN,meioPag:f.meioPag,pago:f.pago});
          newAllYearsEmp={...newAllYearsEmp,[yrKey]:baseYearEmp};
          criadasEmp++;
        }
        setAllYearsData(newAllYearsEmp);
        setEmpForm(emptyEmpForm(today));
        setShowModal(null);
        showToast(`✅ ${criadasEmp} parcelas de empréstimo distribuídas (multi-ano)!`);
        return;
      }
      item={id:uid(),desc:f.desc,valor:valParcEmp,valorTotal:valTotalEmp,date:f.data,ref:f.ref,parafem:f.parafem,valorParcela:valParcEmp,parcelas:parcEmp,dataVenc1:f.dataVenc1,dataVencN:f.dataVencN,meioPag:f.meioPag,pago:f.pago};
      setEmpForm(emptyEmpForm(today));
    }
    setData(d=>d.map((m,i)=>i===currentMonth?{...m,[key]:[...m[key],item]}:m));
    setShowModal(null);
    showToast("Item adicionado!");
  };

  const removeItem=(tipo,id)=>{
    const key=tipo==="receita"?"receitas":tipo==="despesa"?"despesas":tipo==="investimento"?"investimentos":"emprestimos";
    const allMonthItems=safeData.flatMap(m=>m[key]);
    const targetItem=allMonthItems.find(x=>x.id===id);

    // RECORRENTE: encerrar a partir deste mês ou só este
    if(targetItem?.recorrenteGroupId){
      const gid=targetItem.recorrenteGroupId;
      const mesDeste=targetItem.mesRecorrente||currentMonth+1;
      const totalGrupo=safeData.reduce((s,m)=>s+m[key].filter(x=>x.recorrenteGroupId===gid).length,0);
      if(totalGrupo>1){
        const opcao=confirm(`🔁 "${targetItem.desc}" — despesa recorrente.

OK = Encerrar a partir de ${MONTHS[mesDeste-1]} (remove este e próximos)
Cancelar = Remover APENAS este mês`);
        if(opcao){
          setData(d=>d.map((m,i)=>i>=(mesDeste-1)?{...m,[key]:m[key].filter(x=>x.recorrenteGroupId!==gid)}:m));
          showToast("🔁 Despesa recorrente encerrada a partir de "+MONTHS[mesDeste-1]);
          return;
        }
        setData(d=>d.map((m,i)=>i===(mesDeste-1)?{...m,[key]:m[key].filter(x=>x.id!==id)}:m));
        return;
      }
    }

    if(targetItem?.parcelaGroupId){
      const gid=targetItem.parcelaGroupId;
      // Busca em TODOS os anos
      const totalGrupo=Object.values(allYearsData).reduce((s,yrData)=>s+(Array.isArray(yrData)?yrData.reduce((ss,m)=>ss+m[key].filter(x=>x.parcelaGroupId===gid).length,0):0),0);
      if(totalGrupo>1){
        const choice=confirm(`Parcela ${targetItem.parcelaNum}/${targetItem.parcelas} de "${targetItem.desc}".

OK = Remover TODAS as parcelas (todos os anos)
Cancelar = Remover só esta parcela`);
        if(choice){
          // Remove de todos os anos
          setAllYearsData(all=>Object.fromEntries(Object.entries(all).map(([yr,yrData])=>[yr,Array.isArray(yrData)?yrData.map(m=>({...m,[key]:m[key].filter(x=>x.parcelaGroupId!==gid)})):yrData])));
          showToast(`Todas as parcelas de "${targetItem.desc}" removidas.`);
          return;
        }
      }
    }
    setData(d=>d.map((m,i)=>i===currentMonth?{...m,[key]:m[key].filter(x=>x.id!==id)}:m));
  };

  const toggleBaixa=(tipo,id)=>{
    const key=tipo==="receita"?"receitas":tipo==="despesa"?"despesas":tipo==="investimento"?"investimentos":"emprestimos";
    const statusField=tipo==="receita"?"recebido":tipo==="investimento"?"investido":"pago";
    const dataBaixa=new Date().toISOString().split("T")[0];
    const targetItem=safeData[currentMonth][key].find(x=>x.id===id);
    const jaConfirmado=!!targetItem?.[statusField];

    // Recorrente: baixar este ou todos
    if(!jaConfirmado&&targetItem?.recorrenteGroupId){
      const gid=targetItem.recorrenteGroupId;
      const mesDeste=targetItem.mesRecorrente||currentMonth+1;
      const restantes=safeData.reduce((s,m,i)=>s+m[key].filter(x=>x.recorrenteGroupId===gid&&!x[statusField]&&(i+1)>=mesDeste).length,0);
      if(restantes>1){
        const baixarTodos=confirm("Dar baixa em: "+targetItem.desc+" (recorrente)\n\nOK = Todos os meses restantes ("+restantes+")\nCancelar = Somente "+MONTHS[mesDeste-1]);
        if(baixarTodos){
          setData(d=>d.map((m,i)=>i>=(mesDeste-1)?{...m,[key]:m[key].map(x=>x.recorrenteGroupId===gid?{...x,[statusField]:true,dataBaixa}:x)}:m));
          showToast("Baixa dada em todos os meses recorrentes!");
          return;
        }
      }
    }
    // Se é parcela de um grupo e ainda não foi confirmada, oferece opção de baixar todas
    if(!jaConfirmado&&targetItem?.parcelaGroupId){
      const gid=targetItem.parcelaGroupId;
      const totalRestante=safeData.reduce((s,m)=>s+m[key].filter(x=>x.parcelaGroupId===gid&&!x[statusField]).length,0);
      if(totalRestante>1){
        const darBaixaTodas=confirm(`Parcela ${targetItem.parcelaNum}/${targetItem.parcelas} de "${targetItem.desc}".

OK = Dar baixa em TODAS as parcelas restantes (${totalRestante})
Cancelar = Dar baixa só nesta parcela`);
        if(darBaixaTodas){
          setData(d=>d.map(m=>({...m,[key]:m[key].map(x=>x.parcelaGroupId===gid?{...x,[statusField]:true,dataBaixa}:x)})));
          showToast(`✅ Todas as parcelas de "${targetItem.desc}" confirmadas!`);
          return;
        }
      }
    }
    setData(d=>d.map((m,i)=>i===currentMonth?{...m,[key]:m[key].map(x=>x.id===id?{...x,[statusField]:!x[statusField],dataBaixa:!x[statusField]?dataBaixa:null}:x)}:m));
    showToast("Status atualizado!");
  };

  const startEdit=(item,tipo)=>setEditingItem({...item,tipo,editDesc:item.desc,editValor:String(item.valor),editDate:item.date||item.data,editRef:item.ref||"",editCliente:item.cliente||"",editFornecedor:item.fornecedor||"",editBanco:item.banco||""});

  const saveEdit=()=>{
    if(!editingItem)return;
    const {id,tipo,editDesc,editValor,editDate}=editingItem;
    const key=tipo==="receita"?"receitas":tipo==="despesa"?"despesas":tipo==="investimento"?"investimentos":"emprestimos";
    const val=parseFloat(editValor)||0;
    if(!editDesc||!val){showToast("Preencha descrição e valor","error");return;}
    setData(d=>d.map((m,i)=>i===currentMonth?{...m,[key]:m[key].map(x=>x.id===id?{...x,desc:editDesc,valor:val,date:editDate,ref:editingItem.editRef,cliente:editingItem.editCliente,fornecedor:editingItem.editFornecedor,banco:editingItem.editBanco}:x)}:m));
    setEditingItem(null);
    showToast("Item atualizado!");
  };

  // cartao
  const addCartao=()=>{
    if(!novoCartao.nome){showToast("Informe o nome","error");return;}
    const nc=[...cartoes,{id:uid(),nome:novoCartao.nome,diaFechamento:parseInt(novoCartao.diaFechamento)||1,diaPagamento:parseInt(novoCartao.diaPagamento)||10,limite:parseFloat(novoCartao.limite)||0,limiteHistorico:[{data:today,valor:parseFloat(novoCartao.limite)||0}]}];
    setCartoes(nc); setNovoCartao({nome:"",diaFechamento:"",diaPagamento:"",limite:""});
    showToast("Cartão cadastrado!");
  };

  const addUso=()=>{
    if(!novoUso.cartaoId||!novoUso.data||!novoUso.descricao||!novoUso.valor){showToast("Preencha todos os campos","error");return;}
    const valor=parseFloat(novoUso.valor),parcelas=parseInt(novoUso.parcelas)||1;
    setUsoCartoes(u=>[...u,{id:uid(),cartaoId:novoUso.cartaoId,data:novoUso.data,descricao:novoUso.descricao,valor,parcelas,valorParcela:parseFloat((valor/parcelas).toFixed(2))}]);
    setNovoUso({...novoUso,descricao:"",valor:"",parcelas:"1"});
    showToast("Compra adicionada!");
  };

  // cadastros
  const addCad = (tipo) => {
    if(!novoCad.nome){showToast("Informe o nome","error");return;}
    const item={id:uid(),nome:novoCad.nome,obs:novoCad.obs||"",agencia:novoCad.agencia||"",conta:novoCad.conta||"",limite:parseFloat(novoCad.limite)||0};
    setCadastros(c=>({...c,[tipo]:[...c[tipo],item]}));
    setNovoCad({nome:"",obs:"",agencia:"",conta:"",limite:""});
    showToast("Cadastrado com sucesso!");
  };

  const removeCad=(tipo,id)=>setCadastros(c=>({...c,[tipo]:c[tipo].filter(x=>x.id!==id)}));
  const saveEditCad=()=>{
    if(!editCad)return;
    const{tipo,item}=editCad;
    setCadastros(c=>({...c,[tipo]:c[tipo].map(x=>x.id===item.id?item:x)}));
    setEditCad(null);
    showToast("Cadastro atualizado!");
  };

  const handleSave=async()=>{
    try{await saveToSupa({allYearsData:{...allYearsData,[String(currentYear)]:safeData},cartoes,uso_cartoes:usoCartoes,pagamentos,sync_url:syncUrl,cadastros,mei_data:meiData});showToast("✅ Salvo! Lucas verá em instantes.");}
    catch(e){console.error(e);showToast("Erro ao salvar","error");}
  };

  // sync
  const toItem=(x)=>({id:uid(),desc:x.description||x.descricao||x.desc||"",valor:parseFloat(x.amount||x.valor)||0,date:x.date||x.data||today});

  const lerDaPlanilha=async()=>{
    if(!syncUrl){setSyncStatus({ok:false,msg:"Cole a URL do Apps Script primeiro"});return;}
    setSyncing(true);setSyncStatus(null);setSyncPreview(null);
    try{
      const r=await fetch(`${syncUrl}?action=read&month=${syncMonth+1}&year=${CY}`);
      const j=await r.json();
      if(j.error){setSyncStatus({ok:false,msg:`❌ ${j.error}`});setSyncing(false);return;}
      const novasRec=(j.income||j.receitas||[]).map(toItem);
      const todasDesp=(j.expenses||j.despesas||[]);
      const novasDesp=todasDesp.filter(x=>!String(x.description||x.descricao||"").toLowerCase().includes("invest")).map(toItem);
      const novosInv=todasDesp.filter(x=>String(x.description||x.descricao||"").toLowerCase().includes("invest")).map(toItem);
      if(novasRec.length===0&&novasDesp.length===0&&novosInv.length===0){setSyncStatus({ok:false,msg:`⚠️ Nenhum dado encontrado na aba "${j.sheet||""}"`});setSyncing(false);return;}
      setSyncPreview({receitas:novasRec,despesas:novasDesp,investimentos:novosInv,emprestimos:[],month:syncMonth,sheet:j.sheet});
    }catch(e){setSyncStatus({ok:false,msg:"❌ Erro ao conectar. Verifique a URL."});}
    setSyncing(false);
  };

  const confirmarImport=async()=>{
    if(!syncPreview)return;
    const{receitas,despesas,investimentos,emprestimos,month}=syncPreview;
    const nd=safeData.map((m,i)=>i!==month?m:{...m,receitas:[...m.receitas,...receitas],despesas:[...m.despesas,...despesas],investimentos:[...m.investimentos,...investimentos],emprestimos:[...m.emprestimos,...(emprestimos||[])]});
    setData(nd);setCurrentMonth(month);
    try{await saveToSupa({data:nd,cartoes,uso_cartoes:usoCartoes,pagamentos,sync_url:syncUrl,cadastros});}catch(_){}
    setSyncPreview(null);setSyncStatus({ok:true,msg:`✅ ${MONTHS[month]} importado! ${receitas.length} receitas • ${despesas.length} despesas`});
    showToast(`✅ Dados de ${MONTHS[month]} salvos!`);
  };

  // nav
  const navItems=[{key:"dashboard",icon:"📊",label:"Dashboard"},{key:"lancamentos",icon:"✏️",label:"Lançamentos"},{key:"buscar",icon:"🔍",label:"Buscar"},{key:"relatorio",icon:"📈",label:"Relatório"},{key:"cartoes",icon:"💳",label:"Cartões"},{key:"cadastros",icon:"🗂️",label:"Cadastros"},{key:"mei",icon:"🏢",label:"MEI"},{key:"emitir",icon:"📄",label:"Emitir Relatório"},{key:"sincronizar",icon:"🔄",label:"Sincronizar"}];
  const cardSubNav=[["cadastro","📋","Cadastro"],["uso","🛒","Uso de Cartões"],["faturas","📄","Faturas"],["relatorio_c","📊","Relatório"],["dashcard","🖥️","Dashboard"]];
  const cadSubNav=[["bancos","🏦","Bancos"],["fornecedores","🏢","Fornecedores"],["pessoas","👤","Pessoas"]];
  const lancTabs=[{key:"receita",label:"📥 Receitas",col:T.green},{key:"despesa",label:"📤 Despesas",col:T.red},{key:"investimento",label:"💎 Investimentos",col:T.blue},{key:"emprestimo",label:"🔄 Empréstimos",col:T.amber}];
  const lancKey = {receita:"receitas",despesa:"despesas",investimento:"investimentos",emprestimo:"emprestimos"};
  const lancCols = {receita:T.green,despesa:T.red,investimento:T.blue,emprestimo:T.amber};

  return(
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,fontFamily:"'Inter','DM Sans',system-ui,sans-serif",color:T.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* SIDEBAR */}
      <div style={{width:sw,background:T.surface,borderRight:`1px solid ${T.border}`,display:isMobile?"none":"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:100,transition:"width 0.25s",overflow:"hidden",boxShadow:"1px 0 0 #E2E8F0"}}>
        <div style={{padding:"18px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:"10px",whiteSpace:"nowrap"}}>
          <img src="/logo-mark.png" alt="GreenMind" style={{width:"34px",height:"34px",flexShrink:0,objectFit:"contain"}} />
          {sidebarOpen&&<div><div style={{fontSize:"16px",fontWeight:700,color:T.text}}>Green<span style={{color:"#22C55E"}}>Mind</span></div><div style={{fontSize:"10px",color:T.textSub,letterSpacing:"1px"}}>FINANCIAL PLANNING</div></div>}
        </div>
        <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:"2px",overflowY:"auto"}}>
          {navItems.map(n=>(
            <div key={n.key}>
              <div style={navI(activeSection===n.key)} onClick={()=>setActiveSection(n.key)}>
                <span style={{fontSize:"17px",flexShrink:0}}>{n.icon}</span>
                {sidebarOpen&&<span>{n.label}</span>}
              </div>
              {n.key==="cartoes"&&activeSection==="cartoes"&&sidebarOpen&&(
                <div style={{marginLeft:"8px",marginTop:"2px",display:"flex",flexDirection:"column",gap:"1px"}}>
                  {cardSubNav.map(([k,ic,l])=><div key={k} style={subNavI(cardSub===k)} onClick={e=>{e.stopPropagation();setCardSub(k);}}><span style={{fontSize:"13px"}}>{ic}</span><span>{l}</span></div>)}
                </div>
              )}
              {n.key==="cadastros"&&activeSection==="cadastros"&&sidebarOpen&&(
                <div style={{marginLeft:"8px",marginTop:"2px",display:"flex",flexDirection:"column",gap:"1px"}}>
                  {cadSubNav.map(([k,ic,l])=><div key={k} style={subNavI(cadSub===k)} onClick={e=>{e.stopPropagation();setCadSub(k);}}><span style={{fontSize:"13px"}}>{ic}</span><span>{l}</span></div>)}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:`1px solid ${T.border}`}}>
          <div style={{...navI(false),justifyContent:sidebarOpen?"flex-start":"center"}} onClick={()=>setSidebarOpen(s=>!s)}>
            <span style={{fontSize:"14px",flexShrink:0}}>{sidebarOpen?"◀":"▶"}</span>
            {sidebarOpen&&<span style={{fontSize:"12px"}}>Recolher</span>}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main style={{marginLeft:sw,flex:1,padding:isMobile?"16px":"24px",transition:"margin-left 0.25s",minHeight:"100vh",paddingBottom:isMobile?"80px":"24px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
          <div>
            <h1 style={{fontSize:"20px",fontWeight:700,color:T.text,margin:0}}>
              {{dashboard:"Dashboard",lancamentos:"Lançamentos",relatorio:"Relatório Anual",cartoes:"Cartões de Crédito",cadastros:"Cadastros",mei:"🏢 Gestão MEI",emitir:"📄 Emitir Relatório",sincronizar:"Sincronizar com Google Sheets"}[activeSection]}
            </h1>
            <p style={{color:T.textSub,fontSize:"13px",margin:"2px 0 0"}}>GreenMind — Financial Planning • {CY}</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
            <button onClick={toggleTheme} title="Tema claro / escuro" style={{width:"38px",height:"38px",borderRadius:"10px",border:`1px solid ${T.border}`,background:T.surface,color:T.text,cursor:"pointer",display:"grid",placeItems:"center",flexShrink:0}}>
              {dark
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/></svg>}
            </button>
          {activeSection!=="cartoes"&&activeSection!=="cadastros"&&activeSection!=="sincronizar"&&activeSection!=="mei"&&activeSection!=="buscar"&&activeSection!=="emitir"&&(
            <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
              {!isMobile&&<div style={{display:"flex",background:T.surfaceAlt,borderRadius:"10px",padding:"3px",border:`1px solid ${T.border}`,gap:"2px"}}>
                {["mes","ano"].map(v=><button key={v} style={toggleB(view===v)} onClick={()=>setView(v)}>{v==="mes"?"Mês":"Ano"}</button>)}
              </div>}
              <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                {/* Navegação de ANO */}
                <div style={{display:"flex",alignItems:"center",gap:"4px",background:T.surfaceAlt,borderRadius:"8px",padding:"2px",border:`1px solid ${T.border}`}}>
                  <button style={{...btnG,padding:"4px 8px",border:"none",background:"transparent"}} onClick={()=>setCurrentYear(y=>y-1)}>‹</button>
                  <span style={{fontSize:"13px",fontWeight:700,color:T.purple,minWidth:"40px",textAlign:"center"}}>{CY}</span>
                  <button style={{...btnG,padding:"4px 8px",border:"none",background:"transparent"}} onClick={()=>setCurrentYear(y=>y+1)}>›</button>
                </div>
                {/* Navegação de MÊS (só na view Mês) */}
                {view==="mes"&&(
                  <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
                    <button style={{...btnG,padding:"6px 10px"}} onClick={()=>setCurrentMonth(m=>Math.max(0,m-1))}>‹</button>
                    <span style={{fontSize:"13px",fontWeight:600,color:T.text,minWidth:"90px",textAlign:"center"}}>{MONTHS[currentMonth]}</span>
                    <button style={{...btnG,padding:"6px 10px"}} onClick={()=>setCurrentMonth(m=>Math.min(11,m+1))}>›</button>
                  </div>
                )}
                {view==="ano"&&<span style={{fontSize:"13px",fontWeight:600,color:T.text}}>Visão Anual</span>}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* ── DASHBOARD ── */}
        {activeSection==="dashboard"&&(
          <div>
            {/* Alert sempre visível */}
            {totalAtrasado>0&&<div style={{background:T.redLight,border:"1px solid #FECACA",borderRadius:"10px",padding:"12px 16px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{fontSize:"20px"}}>⚠️</span>
              <div><p style={{color:T.red,fontWeight:700,fontSize:"13px",margin:0}}>Faturas em atraso!</p><p style={{color:"#B91C1C",fontSize:"12px",margin:"2px 0 0"}}>Total não pago de meses anteriores: <strong>{fmt(totalAtrasado)}</strong></p></div>
            </div>}

            {/* ── VISÃO ANO ── */}
            {view==="ano"&&(
              <div>
                {/* Métricas anuais */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:"12px",marginBottom:"12px"}}>
                  {[
                    {l:"RECEITAS ANUAIS",v:anoRecTotal,c:T.green,bg:T.greenLight,i:"↑",conf:anoRecConf,confLabel:"recebido"},
                    {l:"DESPESAS ANUAIS",v:anoDespTotal,c:T.red,bg:T.redLight,i:"↓",conf:anoDespConf,confLabel:"pago"},
                    {l:"INVESTIMENTOS",v:anoInvTotal,c:T.blue,bg:T.blueLight,i:"◆"},
                    {l:"FATURAS CARTÕES",v:anoCartTotal,c:T.amber,bg:T.amberLight,i:"💳",sub:anoCartAberto>0?`${fmt(anoCartAberto)} em aberto`:"✓ Em dia"},
                  ].map(m=>(
                    <div key={m.l} style={{...card({marginBottom:0}),border:`1px solid ${m.c}30`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                        <p style={{fontSize:"10px",fontWeight:700,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:0}}>{m.l}</p>
                        <span style={{background:m.bg,color:m.c,borderRadius:"8px",padding:"4px 8px",fontSize:"14px"}}>{m.i}</span>
                      </div>
                      <p style={{fontSize:"22px",fontWeight:700,color:m.c,margin:"0 0 4px"}}>{fmt(m.v)}</p>
                      {m.conf!==undefined&&<div style={{marginTop:"4px"}}>
                        <div style={{height:4,background:T.surfaceAlt,borderRadius:4,border:`1px solid ${T.border}`,marginBottom:"3px"}}>
                          <div style={{height:4,width:m.v>0?`${Math.min(100,(m.conf/m.v)*100)}%`:"0%",background:m.c,borderRadius:4}}/>
                        </div>
                        <span style={{fontSize:"10px",color:T.textSub}}>{m.v>0&&m.conf===m.v?`✓ 100% ${m.confLabel}`:`${fmt(m.conf)} ${m.confLabel} de ${fmt(m.v)}`}</span>
                      </div>}
                      {m.sub&&<span style={{fontSize:"10px",fontWeight:600,color:m.c,background:m.bg,padding:"2px 8px",borderRadius:"20px",display:"inline-block",marginTop:"4px"}}>{m.sub}</span>}
                    </div>
                  ))}
                </div>

                {/* Empréstimos + Saldos anuais */}
                {anoEmpTotal>0&&<div style={{...card({marginBottom:"12px"}),borderLeft:`4px solid ${T.amber}`}}>
                  <p style={{fontSize:"11px",fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 4px"}}>EMPRÉSTIMOS ANUAIS</p>
                  <p style={{fontSize:"20px",fontWeight:700,color:T.amber,margin:0}}>{fmt(anoEmpTotal)}</p>
                </div>}

                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
                  {/* Saldo Orçamento — Entradas vs Saídas */}
                  <div style={{...card({marginBottom:0}),borderLeft:`4px solid ${anoSaldo>=0?T.green:T.red}`}}>
                    <p style={{fontSize:"11px",fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 8px"}}>SALDO ORÇAMENTO {CY}</p>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
                      <div>
                        <p style={{fontSize:"10px",color:T.textMuted,margin:"0 0 2px",textTransform:"uppercase"}}>Total Entradas</p>
                        <p style={{fontSize:"18px",fontWeight:700,color:T.green,margin:0}}>{fmt(anoRecTotal)}</p>
                      </div>
                      <span style={{fontSize:"22px",color:T.textMuted,marginTop:"10px"}}>−</span>
                      <div style={{textAlign:"right"}}>
                        <p style={{fontSize:"10px",color:T.textMuted,margin:"0 0 2px",textTransform:"uppercase"}}>Total Saídas</p>
                        <p style={{fontSize:"18px",fontWeight:700,color:T.red,margin:0}}>{fmt(anoDespTotal+anoInvTotal+anoEmpTotal)}</p>
                        <p style={{fontSize:"10px",color:T.textMuted,margin:"2px 0 0"}}>Desp {fmt(anoDespTotal)} · Inv {fmt(anoInvTotal)} · Emp {fmt(anoEmpTotal)}</p>
                      </div>
                    </div>
                    <div style={{borderTop:`2px solid ${anoSaldo>=0?T.green:T.red}`,paddingTop:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:"12px",fontWeight:600,color:T.textSub}}>= Saldo</span>
                      <span style={{fontSize:"26px",fontWeight:700,color:anoSaldo>=0?T.green:T.red}}>{fmt(anoSaldo)}</span>
                    </div>
                  </div>
                  {/* Saldo Real — inclui cartões */}
                  <div style={{...card({marginBottom:0}),borderLeft:`4px solid ${anoSaldoReal>=0?T.blue:T.red}`}}>
                    <p style={{fontSize:"11px",fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 8px"}}>SALDO REAL {CY} (com cartões)</p>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
                      <div>
                        <p style={{fontSize:"10px",color:T.textMuted,margin:"0 0 2px",textTransform:"uppercase"}}>Total Entradas</p>
                        <p style={{fontSize:"18px",fontWeight:700,color:T.green,margin:0}}>{fmt(anoRecTotal)}</p>
                      </div>
                      <span style={{fontSize:"22px",color:T.textMuted,marginTop:"10px"}}>−</span>
                      <div style={{textAlign:"right"}}>
                        <p style={{fontSize:"10px",color:T.textMuted,margin:"0 0 2px",textTransform:"uppercase"}}>Total Saídas + Cartões</p>
                        <p style={{fontSize:"18px",fontWeight:700,color:T.red,margin:0}}>{fmt(anoDespTotal+anoInvTotal+anoEmpTotal+anoCartTotal)}</p>
                        <p style={{fontSize:"10px",color:T.textMuted,margin:"2px 0 0"}}>
                          {anoCartAberto>0?<span style={{color:T.amber}}>⚠ {fmt(anoCartAberto)} faturas em aberto</span>:<span style={{color:T.green}}>✓ Faturas em dia</span>}
                        </p>
                      </div>
                    </div>
                    <div style={{borderTop:`2px solid ${anoSaldoReal>=0?T.blue:T.red}`,paddingTop:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:"12px",fontWeight:600,color:T.textSub}}>= Saldo Real</span>
                      <span style={{fontSize:"26px",fontWeight:700,color:anoSaldoReal>=0?T.blue:T.red}}>{fmt(anoSaldoReal)}</span>
                    </div>
                  </div>
                </div>

                {/* Info meses com dados */}
                <div style={{...card({marginBottom:"12px"}),background:T.surfaceAlt,padding:"12px 16px"}}>
                  <div style={{display:"flex",gap:"20px",flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:"13px",color:T.textSub}}>📅 Meses com lançamentos: <strong style={{color:T.text}}>{mesesComDadosAno} de 12</strong></span>
                    <span style={{fontSize:"13px",color:T.textSub}}>📈 Média mensal receitas: <strong style={{color:T.green}}>{mesesComDadosAno>0?fmt(anoRecTotal/mesesComDadosAno):"—"}</strong></span>
                    <span style={{fontSize:"13px",color:T.textSub}}>📉 Média mensal despesas: <strong style={{color:T.red}}>{mesesComDadosAno>0?fmt(anoDespTotal/mesesComDadosAno):"—"}</strong></span>
                  </div>
                </div>

                {/* Gráfico anual */}
                <div style={card()}>
                  <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"14px"}}>📈 Evolução Anual {CY}</p>
                  <ResponsiveContainer width="100%" height={210}>
                    <AreaChart data={chartData} margin={{top:5,right:5,bottom:0,left:0}}>
                      <defs>
                        <linearGradient id="gRa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.15}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient>
                        <linearGradient id="gDa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red} stopOpacity={0.15}/><stop offset="95%" stopColor={T.red} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="name" tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tickFormatter={fmtK} tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CT/>}/>
                      <Area type="monotone" dataKey="Receitas" stroke={T.green} strokeWidth={2} fill="url(#gRa)"/>
                      <Area type="monotone" dataKey="Despesas" stroke={T.red} strokeWidth={2} fill="url(#gDa)"/>
                      <Area type="monotone" dataKey="Cartões" stroke={T.amber} strokeWidth={1.5} fill="none" strokeDasharray="4 2"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Resumo mensal compacto */}
                <div style={card()}>
                  <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>📅 Resumo Mensal — {CY}</p>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:"8px"}}>
                    {MONTHS.map((m,i)=>{
                      const r=sumArr(safeData[i].receitas);
                      const d=sumArr(safeData[i].despesas)+sumArr(safeData[i].emprestimos);
                      const cart=cartoes.reduce((s,c)=>s+getFat(c.id,CY,i),0);
                      const inv=sumArr(safeData[i].investimentos);
                      const s=r-d-cart; // Saldo real = Receitas - Despesas - Cartões
                      const temDados=r>0||d>0||inv>0||cart>0;
                      return(
                        <div key={i} style={{background:temDados?T.surface:T.surfaceAlt,border:temDados?`1px solid ${T.borderStrong}`:`1px solid ${T.border}`,borderRadius:"10px",padding:"10px",cursor:"pointer",opacity:temDados?1:0.5,transition:"all 0.15s"}}
                          onClick={()=>{setCurrentMonth(i);setView("mes");}}>
                          <p style={{fontSize:"11px",fontWeight:700,color:temDados?T.text:T.textMuted,marginBottom:"4px"}}>{m}</p>
                          {temDados?(
                            <div style={{fontSize:"10px",display:"flex",flexDirection:"column",gap:"2px"}}>
                              {r>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMuted}}>Rec</span><span style={{color:T.green,fontWeight:500}}>{fmtK(r)}</span></div>}
                              {d>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMuted}}>Desp</span><span style={{color:T.red,fontWeight:500}}>{fmtK(d)}</span></div>}
                              {cart>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMuted}}>Cart</span><span style={{color:T.amber,fontWeight:500}}>{fmtK(cart)}</span></div>}
                              <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${T.border}`,paddingTop:"2px",marginTop:"1px"}}>
                                <span style={{color:T.textSub,fontWeight:600}}>Saldo</span><span style={{color:s>=0?T.blue:T.red,fontWeight:700}}>{fmtK(s)}</span>
                              </div>
                            </div>
                          ):<p style={{fontSize:"10px",color:T.textMuted,margin:0}}>Sem dados</p>}
                        </div>
                      );
                    })}
                  </div>
                  <p style={{fontSize:"11px",color:T.textSub,marginTop:"8px"}}>💡 Clique em um mês para ver os detalhes.</p>
                </div>
              </div>
            )}

            {/* ── VISÃO MÊS ── */}
            {view==="mes"&&(
            <div>

            <BalanceHero recTotal={recTotal} despTotal={despTotal} currentMonth={currentMonth} CY={CY}/>

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px",marginBottom:"14px"}}>
              {[
                {label:"Lançar",sec:"lancamentos",hot:true,ic:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>},
                {label:"Cartões",sec:"cartoes",ic:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 9.5h19"/></svg>},
                {label:"Relatório",sec:"relatorio",ic:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l4-4 3 2 5-6"/></svg>},
                {label:"MEI",sec:"mei",ic:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2"/></svg>},
              ].map(q=>(
                <button key={q.label} onClick={()=>setActiveSection(q.sec)} style={{
                  display:"flex",flexDirection:"column",alignItems:"center",gap:"7px",padding:"14px 6px",borderRadius:"16px",cursor:"pointer",
                  border:q.hot?"0":`1px solid ${T.border}`,
                  background:q.hot?"linear-gradient(140deg,#4ADE80 0%,#22C55E 42%,#166534 100%)":T.surface,
                  color:q.hot?"#fff":T.text,
                  boxShadow:q.hot?"0 12px 24px -12px rgba(34,197,94,.7)":shadow}}>
                  <span style={{width:"38px",height:"38px",borderRadius:"12px",display:"grid",placeItems:"center",background:q.hot?"rgba(255,255,255,.18)":T.purpleLight,color:q.hot?"#fff":T.purple}}>{q.ic}</span>
                  <span style={{fontSize:"12px",fontWeight:600}}>{q.label}</span>
                </button>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:"12px",marginBottom:"12px"}}>
              {[
                {l:"RECEITAS",v:recTotal,c:T.green,bg:T.greenLight,i:"↑",conf:recConfirmado,confLabel:"recebido"},
                {l:"DESPESAS",v:despTotal,c:T.red,bg:T.redLight,i:"↓",conf:despConfirmada,confLabel:"pago"},
                {l:"INVESTIMENTOS",v:invTotal,c:T.blue,bg:T.blueLight,i:"◆",conf:invConfirmado,confLabel:"aplicado"},
                {l:"FATURAS CARTÕES",v:faturasMes,c:T.amber,bg:T.amberLight,i:"💳",sub:faturasAbertas>0?`${fmt(faturasAbertas)} em aberto`:"✓ Em dia"},
              ].map(m=>(
                <div key={m.l} style={{...card({marginBottom:0}),border:`1px solid ${m.c}30`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                    <p style={{fontSize:"10px",fontWeight:700,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:0}}>{m.l}</p>
                    <span style={{background:m.bg,color:m.c,borderRadius:"8px",padding:"4px 8px",fontSize:"14px"}}>{m.i}</span>
                  </div>
                  <p style={{fontSize:"22px",fontWeight:700,color:m.c,margin:"0 0 4px"}}>{fmt(m.v)}</p>
                  {m.conf!==undefined&&<div style={{marginTop:"4px"}}>
                    <div style={{height:4,background:T.surfaceAlt,borderRadius:4,border:`1px solid ${T.border}`,marginBottom:"3px"}}>
                      <div style={{height:4,width:m.v>0?`${Math.min(100,(m.conf/m.v)*100)}%`:"0%",background:m.c,borderRadius:4,transition:"width 0.4s"}}/>
                    </div>
                    <span style={{fontSize:"10px",color:m.v>0&&m.conf===m.v?T.green:T.textSub}}>{m.v>0&&m.conf===m.v?"✓ 100% "+m.confLabel:`${fmt(m.conf)} ${m.confLabel} de ${fmt(m.v)}`}</span>
                  </div>}
                  {m.sub&&<span style={{fontSize:"10px",fontWeight:600,color:m.c,background:m.bg,padding:"2px 8px",borderRadius:"20px",display:"inline-block",marginTop:"4px"}}>{m.sub}</span>}
                </div>
              ))}
            </div>

            {empTotal>0&&<div style={{...card({marginBottom:"12px"}),borderLeft:`4px solid ${T.amber}`}}>
              <p style={{fontSize:"11px",fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 4px"}}>EMPRÉSTIMOS / PARCELAMENTOS</p>
              <p style={{fontSize:"20px",fontWeight:700,color:T.amber,margin:0}}>{fmt(empTotal)}</p>
            </div>}

            {proximosParcelados.length>0&&(
              <div style={{...card({marginBottom:"12px"}),background:"#FFFBEB",border:"1px solid #FDE68A"}}>
                <p style={{fontSize:"13px",fontWeight:700,color:T.amber,margin:"0 0 10px"}}>📅 Provisão — Parcelas nos próximos meses</p>
                <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                  {proximosParcelados.map(f=>(
                    <div key={f.month} style={{background:T.surface,border:"1px solid #FDE68A",borderRadius:"10px",padding:"10px 14px",minWidth:"110px",cursor:"pointer"}} onClick={()=>setCurrentMonth(f.month)}>
                      <p style={{fontSize:"11px",fontWeight:700,color:T.amber,margin:"0 0 3px"}}>{MONTHS[f.month]}</p>
                      {f.despesas>0&&<p style={{fontSize:"12px",color:T.red,margin:"1px 0",fontWeight:600}}>Desp: {fmt(f.despesas)}</p>}
                      {f.emprestimos>0&&<p style={{fontSize:"12px",color:T.amber,margin:"1px 0",fontWeight:600}}>Emp: {fmt(f.emprestimos)}</p>}
                    </div>
                  ))}
                </div>
                <p style={{fontSize:"11px",color:T.textSub,margin:"8px 0 0"}}>💡 Valores de despesas e empréstimos parcelados já provisionados. Clique no mês para ver.</p>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div style={{...card({marginBottom:0}),borderLeft:`4px solid ${T.purple}`}}>
                <p style={{fontSize:"11px",fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 4px"}}>SALDO ORÇAMENTO</p>
                <p style={{fontSize:"24px",fontWeight:700,color:saldo>=0?T.purple:T.red,margin:"0 0 4px"}}>{fmt(saldo)}</p>
                <p style={{fontSize:"12px",color:T.textSub,margin:0}}>Receitas − Despesas − Invest. − Empréstimos</p>
              </div>
              <div style={{...card({marginBottom:0}),borderLeft:`4px solid ${saldoReal>=0?T.green:T.red}`}}>
                <p style={{fontSize:"11px",fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 4px"}}>SALDO REAL (COM CARTÕES)</p>
                <p style={{fontSize:"24px",fontWeight:700,color:saldoReal>=0?T.green:T.red,margin:"0 0 4px"}}>{fmt(saldoReal)}</p>
                <p style={{fontSize:"12px",color:T.textSub,margin:0}}>{faturasAbertas>0?`Descontando ${fmt(faturasAbertas)} de faturas`:"Todas as faturas pagas ✓"}</p>
              </div>
            </div>

            {cartoes.length>0&&(
              <div style={{...card({marginBottom:"12px"}),background:totalAbertoPendente>0?"#FFFBEB":T.surface,border:`1px solid ${totalAbertoPendente>0?"#FDE68A":T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
                  <p style={{fontSize:"13px",fontWeight:700,color:T.text,margin:0}}>💳 Cartões — Visão Anual</p>
                  <div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>
                    <span style={{fontSize:"12px",color:T.textSub}}>Total ano: <strong style={{color:T.amber}}>{fmt(totalAnualCartoes)}</strong></span>
                    <span style={{fontSize:"12px",color:T.textSub}}>Pendente: <strong style={{color:totalAbertoPendente>0?T.red:T.green}}>{fmt(totalAbertoPendente)}</strong></span>
                  </div>
                </div>
                {proximasFaturas.length===0?<p style={{color:T.textMuted,fontSize:"12px"}}>✓ Sem faturas pendentes nos próximos meses.</p>:(
                  <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                    {proximasFaturas.map(f=>(
                      <div key={f.month} style={{background:f.pago?T.greenLight:T.amberLight,border:`1px solid ${f.pago?"#BBF7D0":"#FDE68A"}`,borderRadius:"10px",padding:"10px 14px",minWidth:"110px"}}>
                        <p style={{fontSize:"11px",fontWeight:700,color:f.pago?T.green:T.amber,margin:"0 0 3px"}}>{MONTHS[f.month]}</p>
                        <p style={{fontSize:"16px",fontWeight:700,color:f.pago?T.green:T.amber,margin:0}}>{fmt(f.total)}</p>
                        <p style={{fontSize:"10px",color:T.textSub,margin:"2px 0 0"}}>{f.pago?"✓ Pago":"Pendente"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div style={card({marginBottom:0})}>
                <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"14px"}}>📈 Evolução Anual</p>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={chartData} margin={{top:5,right:5,bottom:0,left:0}}>
                    <defs>
                      <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.15}/><stop offset="95%" stopColor={T.green} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red} stopOpacity={0.15}/><stop offset="95%" stopColor={T.red} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="name" tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={fmtK} tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CT/>}/>
                    <Area type="monotone" dataKey="Receitas" stroke={T.green} strokeWidth={2} fill="url(#gR)"/>
                    <Area type="monotone" dataKey="Despesas" stroke={T.red} strokeWidth={2} fill="url(#gD)"/>
                    <Area type="monotone" dataKey="Cartões" stroke={T.amber} strokeWidth={1.5} fill="none" strokeDasharray="4 2"/>
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{display:"flex",gap:"14px",marginTop:"6px"}}>
                  {[[T.green,"Receitas"],[T.red,"Despesas"],[T.amber,"Cartões"]].map(([c,l])=>(
                    <span key={l} style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"11px",color:T.textSub}}>
                      <span style={{width:8,height:8,borderRadius:2,background:c,display:"inline-block"}}/>{l}
                    </span>
                  ))}
                </div>
              </div>
              <div style={card({marginBottom:0})}>
                <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"14px"}}>🏦 Distribuição — {MONTHS[currentMonth]}</p>
                {[["Receitas",recTotal,T.green,T.greenLight],["Despesas",despTotal,T.red,T.redLight],["Investimentos",invTotal,T.blue,T.blueLight],["Empréstimos",empTotal,T.amber,T.amberLight],["Cartões",faturasMes,T.purple,T.purpleLight]].map(([l,v,c,bg])=>{
                  const pct=recTotal>0?(v/recTotal)*100:0;
                  return v>=0?(
                    <div key={l} style={{marginBottom:"8px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"3px"}}>
                        <span style={{color:T.textSub}}>{l}</span><span style={{color:c,fontWeight:600}}>{fmt(v)}</span>
                      </div>
                      <div style={{height:6,background:T.surfaceAlt,borderRadius:4,border:`1px solid ${T.border}`}}>
                        <div style={{height:6,width:`${Math.min(100,pct)}%`,background:c,borderRadius:4}}/>
                      </div>
                    </div>
                  ):null;
                })}
              </div>
            </div>

            <div style={card({marginBottom:0})}>
              <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>📅 Resumo {CY}</p>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:"8px"}}>
                {MONTHS.map((m,i)=>{
                  const r=sumArr(safeData[i].receitas);
                  const d=sumArr(safeData[i].despesas)+sumArr(safeData[i].emprestimos);
                  const cart=cartoes.reduce((s,c)=>s+getFat(c.id,CY,i),0);
                  const inv=sumArr(safeData[i].investimentos);
                  const saldoReal=r-d-cart;
                  const temDados=r>0||d>0||cart>0||inv>0;
                  const isSelected=i===currentMonth;
                  return(
                    <div key={i}
                      style={{background:isSelected?"#F0FDF4":temDados?T.surface:T.surfaceAlt,border:isSelected?`2px solid ${T.green}`:temDados?`1px solid ${T.borderStrong}`:`1px solid ${T.border}`,borderRadius:"10px",padding:"10px 12px",cursor:"pointer",transition:"all 0.15s",opacity:temDados?1:0.5}}
                      onClick={()=>setCurrentMonth(i)}>
                      <p style={{fontSize:"11px",fontWeight:700,color:isSelected?T.green:temDados?T.text:T.textMuted,marginBottom:"6px"}}>{m}</p>
                      {temDados?(
                        <div style={{fontSize:"10px",display:"flex",flexDirection:"column",gap:"3px"}}>
                          {r>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMuted}}>Rec</span><span style={{color:T.green,fontWeight:500}}>{fmtK(r)}</span></div>}
                          {d>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMuted}}>Desp</span><span style={{color:T.red,fontWeight:500}}>{fmtK(d)}</span></div>}
                          {cart>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMuted}}>Cart</span><span style={{color:T.amber,fontWeight:500}}>{fmtK(cart)}</span></div>}
                          {inv>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.textMuted}}>Inv</span><span style={{color:T.blue,fontWeight:500}}>{fmtK(inv)}</span></div>}
                          <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${T.border}`,paddingTop:"3px",marginTop:"2px"}}>
                            <span style={{color:T.textSub,fontWeight:600}}>Saldo</span>
                            <span style={{color:saldoReal>=0?T.blue:T.red,fontWeight:700}}>{fmtK(saldoReal)}</span>
                          </div>
                        </div>
                      ):<p style={{fontSize:"10px",color:T.textMuted,margin:0,textAlign:"center"}}>Sem dados</p>}
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
            )}
          </div>
        )}

        {/* ── LANÇAMENTOS ── */}
        {activeSection==="lancamentos"&&(
          <div>
            <div style={{...card({padding:"12px 16px",marginBottom:"14px"}),background:T.purpleLight,border:`1px solid #DDD6FE`}}>
              <p style={{color:T.purple,fontSize:"13px",margin:0}}>📅 Lançamentos de <strong>{MONTHS[currentMonth]} {CY}</strong></p>
            </div>
            <div style={{display:"flex",gap:"6px",marginBottom:"16px",flexWrap:"wrap"}}>
              {lancTabs.map(t=><button key={t.key} style={subT(lancTab===t.key)} onClick={()=>setLancTab(t.key)}>{t.label}</button>)}
            </div>
            {lancTabs.map(t=>(
              lancTab===t.key&&(
                <div key={t.key} style={card()}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                    <p style={{fontSize:"13px",fontWeight:700,color:t.col,margin:0}}>{t.label}</p>
                    <button style={btnP(t.col)} onClick={()=>setShowModal(t.key)}>+ Novo lançamento</button>
                  </div>
                  <ItemList
                    items={monthData[lancKey[t.key]]||[]}
                    col={t.col} tipo={t.key}
                    emptyMsg={`Nenhum lançamento em ${MONTHS[currentMonth]}`}
                    onEdit={(item)=>startEdit(item,t.key)}
                    onRemove={(id)=>removeItem(t.key,id)}
                    onBaixa={(id)=>toggleBaixa(t.key,id)}
                  />
                  <div style={{textAlign:"right",borderTop:`1px solid ${T.border}`,paddingTop:"8px",marginTop:"8px"}}>
                    <span style={{color:T.textSub,fontSize:"12px"}}>Total: </span>
                    <span style={{color:t.col,fontWeight:700,fontSize:"15px"}}>{fmt(sumArr(monthData[lancKey[t.key]]||[]))}</span>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* ── RELATÓRIO ── */}
        {activeSection==="relatorio"&&(
          <div>
            <div style={card()}>
              <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"14px"}}>📊 Performance Anual</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{top:5,right:10,bottom:0,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={fmtK} tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT/>}/>
                  <Bar dataKey="Receitas" fill={T.green} radius={[4,4,0,0]}/>
                  <Bar dataKey="Despesas" fill={T.red} radius={[4,4,0,0]}/>
                  <Bar dataKey="Cartões" fill={T.amber} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card()}>
              <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>📋 Consolidado Anual</p>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                  <thead><tr style={{background:T.surfaceAlt}}>{["Mês","Receitas","Despesas","Invest.","Empréstimos","Cartões","Saldo Real"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:h==="Mês"?"left":"right",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {MONTHS.map((m,i)=>{
                      const r=sumArr(safeData[i].receitas),d=sumArr(safeData[i].despesas),inv=sumArr(safeData[i].investimentos),emp=sumArr(safeData[i].emprestimos),cart=cartoes.reduce((s,c)=>s+getFat(c.id,CY,i),0);
                      const s=r-d-inv-emp-cartoes.reduce((s2,c)=>s2+(!isPago(c.id,CY,i)?getFat(c.id,CY,i):0),0);
                      return(
                        <tr key={i} style={{background:i===currentMonth?T.purpleLight:"transparent"}}>
                          <td style={{padding:"9px 12px",color:i===currentMonth?T.purple:T.text,fontWeight:i===currentMonth?700:400}}>{m}</td>
                          <td style={{padding:"9px 12px",textAlign:"right",color:T.green,fontWeight:500}}>{fmt(r)}</td>
                          <td style={{padding:"9px 12px",textAlign:"right",color:T.red,fontWeight:500}}>{fmt(d)}</td>
                          <td style={{padding:"9px 12px",textAlign:"right",color:T.blue,fontWeight:500}}>{fmt(inv)}</td>
                          <td style={{padding:"9px 12px",textAlign:"right",color:T.amber,fontWeight:500}}>{emp>0?fmt(emp):"—"}</td>
                          <td style={{padding:"9px 12px",textAlign:"right",color:T.amber,fontWeight:500}}>{cart>0?fmt(cart):"—"}</td>
                          <td style={{padding:"9px 12px",textAlign:"right",color:s>=0?T.green:T.red,fontWeight:700}}>{fmt(s)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:`2px solid ${T.borderStrong}`,background:T.surfaceAlt}}>
                      <td style={{padding:"10px 12px",fontWeight:700}}>TOTAL</td>
                      {[safeData.reduce((s,m)=>s+sumArr(m.receitas),0),safeData.reduce((s,m)=>s+sumArr(m.despesas),0),safeData.reduce((s,m)=>s+sumArr(m.investimentos),0),safeData.reduce((s,m)=>s+sumArr(m.emprestimos),0),yrMs.reduce((s,i)=>s+cartoes.reduce((ss,c)=>ss+getFat(c.id,CY,i),0),0)].map((v,i)=>(
                        <td key={i} style={{padding:"10px 12px",textAlign:"right",color:[T.green,T.red,T.blue,T.amber,T.amber][i],fontWeight:700}}>{fmt(v)}</td>
                      ))}
                      <td style={{padding:"10px 12px",textAlign:"right",fontWeight:700,color:T.purple}}>
                        {fmt(safeData.reduce((s,m,i)=>s+sumArr(m.receitas)-sumArr(m.despesas)-sumArr(m.investimentos)-sumArr(m.emprestimos)-cartoes.reduce((ss,c)=>ss+(!isPago(c.id,CY,i)?getFat(c.id,CY,i):0),0),0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Comparativo entre anos */}
            {Object.keys(allYearsData).length>1&&(()=>{
              const anos = Object.keys(allYearsData).sort((a,b)=>Number(b)-Number(a));
              const anoTotais = anos.map(yr=>({
                ano:yr,
                receitas:allYearsData[yr].reduce((s,m)=>s+sumArr(m.receitas),0),
                despesas:allYearsData[yr].reduce((s,m)=>s+sumArr(m.despesas),0),
                investimentos:allYearsData[yr].reduce((s,m)=>s+sumArr(m.investimentos),0),
                emprestimos:allYearsData[yr].reduce((s,m)=>s+sumArr(m.emprestimos),0),
                cartoes:yrMs.reduce((s,i)=>s+cartoes.reduce((ss,c)=>ss+getFat(c.id,Number(yr),i),0),0),
              }));
              return(
                <div style={card()}>
                  <p style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"14px"}}>📊 Comparativo entre Anos</p>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                      <thead>
                        <tr style={{background:T.surfaceAlt}}>
                          {["Ano","Receitas","Despesas","Investimentos","Empréstimos","Cartões","Saldo"].map(h=>(
                            <th key={h} style={{padding:"9px 12px",textAlign:h==="Ano"?"left":"right",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {anoTotais.map((at,i)=>{
                          const saldo=at.receitas-at.despesas-at.investimentos-at.emprestimos;
                          const prevAt=anoTotais[i+1];
                          const diffRec=prevAt?((at.receitas-prevAt.receitas)/prevAt.receitas*100):null;
                          return(
                            <tr key={at.ano} style={{background:Number(at.ano)===currentYear?T.purpleLight:"transparent",cursor:"pointer"}} onClick={()=>setCurrentYear(Number(at.ano))}>
                              <td style={{padding:"9px 12px",fontWeight:700,color:Number(at.ano)===currentYear?T.purple:T.text}}>
                                {at.ano} {Number(at.ano)===currentYear&&<span style={{fontSize:"10px",background:T.purple,color:"#fff",borderRadius:"10px",padding:"1px 6px",marginLeft:"4px"}}>atual</span>}
                              </td>
                              <td style={{padding:"9px 12px",textAlign:"right"}}>
                                <span style={{color:T.green,fontWeight:600}}>{fmt(at.receitas)}</span>
                                {diffRec!==null&&<span style={{fontSize:"10px",color:diffRec>=0?T.green:T.red,marginLeft:"4px"}}>{diffRec>=0?"▲":"▼"}{Math.abs(diffRec).toFixed(1)}%</span>}
                              </td>
                              <td style={{padding:"9px 12px",textAlign:"right",color:T.red,fontWeight:600}}>{fmt(at.despesas)}</td>
                              <td style={{padding:"9px 12px",textAlign:"right",color:T.blue,fontWeight:500}}>{fmt(at.investimentos)}</td>
                              <td style={{padding:"9px 12px",textAlign:"right",color:T.amber,fontWeight:500}}>{at.emprestimos>0?fmt(at.emprestimos):"—"}</td>
                              <td style={{padding:"9px 12px",textAlign:"right",color:T.amber,fontWeight:500}}>{at.cartoes>0?fmt(at.cartoes):"—"}</td>
                              <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:saldo>=0?T.purple:T.red}}>{fmt(saldo)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Gráfico barras comparativo */}
                  <div style={{marginTop:"16px"}}>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={anoTotais.map(at=>({name:at.ano,Receitas:at.receitas,Despesas:at.despesas,Investimentos:at.investimentos}))} margin={{top:5,right:5,bottom:0,left:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                        <XAxis dataKey="name" tick={{fill:T.textMuted,fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis tickFormatter={fmtK} tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                        <Tooltip content={<CT/>}/>
                        <Bar dataKey="Receitas" fill={T.green} radius={[4,4,0,0]}/>
                        <Bar dataKey="Despesas" fill={T.red} radius={[4,4,0,0]}/>
                        <Bar dataKey="Investimentos" fill={T.blue} radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── CARTÕES ── */}
        {activeSection==="cartoes"&&(
          <div>
            {/* Sub-tabs horizontais — essencial no mobile onde sidebar some */}
            <div style={{display:"flex",gap:"6px",marginBottom:"16px",flexWrap:"wrap",overflowX:"auto",paddingBottom:"4px"}}>
              {[["cadastro","📋","Cadastro"],["uso","🛒","Uso"],["faturas","📄","Faturas"],["relatorio_c","📊","Relatório"],["dashcard","🖥️","Dashboard"]].map(([k,ic,l])=>(
                <button key={k} style={{...subT(cardSub===k),whiteSpace:"nowrap",flexShrink:0}} onClick={()=>setCardSub(k)}>{ic} {l}</button>
              ))}
            </div>

            {cardSub==="cadastro"&&(
              <div>
                <div style={card()}>
                  <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>➕ Novo Cartão</p>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"10px",marginBottom:"10px"}}>
                    <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Nome do cartão</label><input style={inpS} placeholder="Ex: Nubank Mastercard" value={novoCartao.nome} onChange={e=>setNovoCartao(n=>({...n,nome:e.target.value}))}/></div>
                    <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Dia fechamento</label><input type="number" style={inpS} placeholder="Ex: 27" value={novoCartao.diaFechamento} onChange={e=>setNovoCartao(n=>({...n,diaFechamento:e.target.value}))}/></div>
                    <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Dia pagamento</label><input type="number" style={inpS} placeholder="Ex: 10" value={novoCartao.diaPagamento} onChange={e=>setNovoCartao(n=>({...n,diaPagamento:e.target.value}))}/></div>
                    <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Limite (R$)</label><input type="number" step="0.01" style={inpS} placeholder="Ex: 5000,00" value={novoCartao.limite} onChange={e=>setNovoCartao(n=>({...n,limite:e.target.value}))}/></div>
                  </div>
                  <button style={btnP(T.purple)} onClick={addCartao}>+ Cadastrar Cartão</button>
                </div>
                {cartoes.length>0&&(
                  <div style={card()}>
                    <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>💳 Cartões ({cartoes.length})</p>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                      <thead><tr><th style={{padding:"9px 12px",textAlign:"left",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Cartão</th><th style={{padding:"9px 12px",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Fechamento</th><th style={{padding:"9px 12px",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Pagamento</th><th style={{padding:"9px 12px",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Limite</th><th style={{padding:"9px 12px",borderBottom:`1px solid ${T.border}`}}></th></tr></thead>
                      <tbody>
                        {cartoes.map((c,i)=>(
                          <tr key={c.id}>
                            <td style={{padding:"9px 12px"}}><span style={chip(CARD_COLORS[i%8])}>{c.nome}</span></td>
                            <td style={{padding:"9px 12px",textAlign:"center",color:T.amber}}>Dia {c.diaFechamento}</td>
                            <td style={{padding:"9px 12px",textAlign:"center",color:T.green}}>Dia {c.diaPagamento}</td>
                            <td style={{padding:"9px 12px",textAlign:"center",color:T.purple,fontWeight:600}}>{c.limite>0?fmt(c.limite):"—"}</td>
                            <td style={{padding:"9px 12px"}}><button style={remB} onClick={()=>{setCartoes(cs=>cs.filter(x=>x.id!==c.id));setUsoCartoes(u=>u.filter(x=>x.cartaoId!==c.id));}}>✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {cardSub==="uso"&&(
              <div>
                <div style={card()}>
                  <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>🛒 Registrar Compra Parcelada</p>
                  {cartoes.length===0?<p style={{color:T.red,fontSize:"13px"}}>Cadastre um cartão primeiro.</p>:(
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"10px",marginBottom:"10px"}}>
                      <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Cartão</label>
                        <select style={selS} value={novoUso.cartaoId} onChange={e=>setNovoUso(n=>({...n,cartaoId:e.target.value}))}>
                          <option value="">Selecione</option>{cartoes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Data da compra</label><input type="date" style={inpDate} value={novoUso.data} onChange={e=>setNovoUso(n=>({...n,data:e.target.value}))}/></div>
                      <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Descrição</label><input style={inpS} placeholder="Ex: TV Samsung" value={novoUso.descricao} onChange={e=>setNovoUso(n=>({...n,descricao:e.target.value}))}/></div>
                      <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Valor total (R$)</label><input type="number" step="0.01" style={inpS} placeholder="0,00" value={novoUso.valor} onChange={e=>setNovoUso(n=>({...n,valor:e.target.value}))}/></div>
                      <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Parcelas</label><input type="number" style={inpS} placeholder="1" value={novoUso.parcelas} onChange={e=>setNovoUso(n=>({...n,parcelas:e.target.value}))}/></div>
                    </div>
                  )}
                  {cartoes.length>0&&<button style={btnP(T.purple)} onClick={addUso}>+ Adicionar Compra</button>}
                </div>
                {usoCartoes.length>0&&(
                  <div style={card()}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
                      {(()=>{const filtered=usoFiltroCartao?usoCartoes.filter(u=>u.cartaoId===usoFiltroCartao):usoCartoes;
                    return <p style={{fontSize:"13px",fontWeight:600,color:T.text,margin:0}}>📋 Histórico ({filtered.length}{usoFiltroCartao?" filtradas":""} de {usoCartoes.length} compras)</p>;})()}
                      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                        <select style={{...selS,width:"auto",fontSize:"12px"}} value={usoFiltroCartao} onChange={e=>setUsoFiltroCartao(e.target.value)}>
                          <option value="">Todos os cartões</option>
                          {cartoes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                        {usoFiltroCartao&&<button style={{...btnG,fontSize:"11px",padding:"4px 10px"}} onClick={()=>setUsoFiltroCartao("")}>✕ Limpar</button>}
                      </div>
                    </div>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                        <thead><tr>{["Cartão","Data","Descrição","Valor","Parcelas","Valor/Parc.",""].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
                        <tbody>{(usoFiltroCartao?usoCartoes.filter(u=>u.cartaoId===usoFiltroCartao):usoCartoes).map(u=>{const ci=cartoes.findIndex(c=>c.id===u.cartaoId);return(
                          <tr key={u.id}>
                            <td style={{padding:"8px 10px"}}><span style={chip(CARD_COLORS[ci>=0?ci%8:0])}>{cartoes[ci]?.nome||"?"}</span></td>
                            <td style={{padding:"8px 10px",color:T.textSub}}>{u.data}</td>
                            <td style={{padding:"8px 10px",color:T.text}}>{u.descricao}</td>
                            <td style={{padding:"8px 10px",color:T.amber,fontWeight:600}}>{fmt(u.valor)}</td>
                            <td style={{padding:"8px 10px",color:T.purple}}>{u.parcelas}x</td>
                            <td style={{padding:"8px 10px",color:T.blue}}>{fmt(u.valorParcela)}</td>
                            <td style={{padding:"8px 10px",display:"flex",gap:"4px",alignItems:"center"}}>
                              <button style={editB} onClick={()=>setEditUso({...u})}>✏️</button>
                              <button style={remB} onClick={()=>{if(confirm(`Remover "${u.descricao}"?`))setUsoCartoes(u2=>u2.filter(x=>x.id!==u.id));}}>✕</button>
                            </td>
                          </tr>
                        );})}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {cardSub==="faturas"&&(
              <div>
                <div style={{display:"flex",gap:"6px",marginBottom:"16px",flexWrap:"wrap"}}>
                  {[["apagar","A Pagar"],["pagamentos","Pagamentos"],["inadimplencias","Inadimplências"]].map(([k,l])=><button key={k} style={subT(faturaTab===k)} onClick={()=>setFaturaTab(k)}>{l}</button>)}
                </div>
                {(faturaTab==="apagar"||faturaTab==="pagamentos"||faturaTab==="inadimplencias")&&(
                  <div style={{...card(),overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                    <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>
                      {faturaTab==="apagar"?"📅 Faturas a Pagar":faturaTab==="pagamentos"?"✅ Pagamentos Realizados":"⚠️ Faturas em Aberto"}
                      {faturaTab==="apagar"&&<span style={{color:T.textSub,fontWeight:400,fontSize:"12px"}}> — clique para marcar como pago</span>}
                    </p>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                      <thead><tr><th style={{padding:"8px 10px",textAlign:"left",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`,minWidth:"150px"}}>Cartão</th>{faturaTab==="apagar"&&<th style={{padding:"8px 10px",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`,minWidth:"90px"}}>Total Ano</th>}{MS.map(m=><th key={m} style={{padding:"8px 10px",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`,minWidth:"75px"}}>{m}</th>)}</tr></thead>
                      <tbody>
                        {faturaDetalhe&&faturaDetalhe.faturaTab===faturaTab&&(
                      <tr>
                        <td colSpan={15} style={{padding:0}}>
                          <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:"10px",padding:"14px",margin:"6px 10px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                              <p style={{fontSize:"13px",fontWeight:700,color:T.blue,margin:0}}>
                                🔍 Lançamentos na fatura — {cartoes.find(c=>c.id===faturaDetalhe.cartaoId)?.nome} | {MONTHS[faturaDetalhe.month]} {CY}
                              </p>
                              <button style={{...btnG,padding:"3px 10px",fontSize:"11px"}} onClick={()=>setFaturaDetalhe(null)}>✕ Fechar</button>
                            </div>
                            {usoCartoes.filter(u=>u.cartaoId===faturaDetalhe.cartaoId&&getInstMonths(u).some(im=>im.year===CY&&im.month===faturaDetalhe.month)).map(u=>{
                              const parcelaDoMes=getInstMonths(u).find(im=>im.year===CY&&im.month===faturaDetalhe.month);
                              const numParcela=getInstMonths(u).findIndex(im=>im.year===CY&&im.month===faturaDetalhe.month)+1;
                              return(
                                <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",marginBottom:"5px",background:T.surface,border:`1px solid ${T.border}`,flexWrap:"wrap",gap:"8px"}}>
                                  <div>
                                    <p style={{color:T.text,fontSize:"13px",fontWeight:500,margin:0}}>{u.descricao}</p>
                                    <p style={{color:T.textMuted,fontSize:"11px",margin:"2px 0 0"}}>Compra: {u.data} • Parcela {numParcela}/{u.parcelas} • Total: {fmt(u.valor)}</p>
                                  </div>
                                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                                    <span style={{color:T.amber,fontWeight:700,fontSize:"14px"}}>{fmt(u.valorParcela)}</span>
                                    <button style={editB} onClick={()=>{
                                      const novoDesc=prompt("Nova descrição:",u.descricao);
                                      if(novoDesc&&novoDesc!==u.descricao) setUsoCartoes(us=>us.map(x=>x.id===u.id?{...x,descricao:novoDesc}:x));
                                    }}>✏️</button>
                                    <button style={remB} onClick={()=>{if(confirm(`Remover "${u.descricao}"?`)) setUsoCartoes(us=>us.filter(x=>x.id!==u.id));}}>✕</button>
                                  </div>
                                </div>
                              );
                            })}
                            {usoCartoes.filter(u=>u.cartaoId===faturaDetalhe.cartaoId&&getInstMonths(u).some(im=>im.year===CY&&im.month===faturaDetalhe.month)).length===0&&(
                              <p style={{color:T.textMuted,fontSize:"13px",textAlign:"center",padding:"12px 0"}}>Nenhuma compra encontrada para este mês.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    {faturaTab==="apagar"&&<tr style={{background:T.purpleLight}}>
                          <td style={{padding:"8px 10px",fontWeight:700,color:T.purple}}>Total</td>
                          <td style={{padding:"8px 10px",fontWeight:700,color:T.purple}}>{fmt(cartoes.reduce((s,c)=>s+yrMs.reduce((ss,m)=>ss+getFat(c.id,CY,m),0),0))}</td>
                          {yrMs.map(m=>{const t=cartoes.reduce((s,c)=>s+getFat(c.id,CY,m),0);return<td key={m} style={{padding:"8px 10px",color:t>0?T.red:T.textMuted,fontWeight:t>0?700:400}}>{t>0?fmt(t):"—"}</td>;})}
                        </tr>}
                        {cartoes.map((c,ci)=>(
                          <tr key={c.id}>
                            <td style={{padding:"8px 10px"}}><span style={chip(CARD_COLORS[ci%8])}>{c.nome}</span></td>
                            {faturaTab==="apagar"&&<td style={{padding:"8px 10px",color:CARD_COLORS[ci%8],fontWeight:600}}>{fmt(yrMs.reduce((s,m)=>s+getFat(c.id,CY,m),0))}</td>}
                            {yrMs.map(m=>{
                              const v=getFat(c.id,CY,m),pg=isPago(c.id,CY,m),past=m<nowM;
                              return <td key={m} style={{padding:"8px 10px"}}>
                                {faturaTab==="apagar"&&v>0?<div style={{display:"flex",flexDirection:"column",gap:"3px",alignItems:"center"}}>
                                  {isPago(c.id,CY,m)?(
                                    <button style={{background:"#DCFCE7",border:"1px solid #BBF7D0",color:T.green,borderRadius:"5px",padding:"2px 8px",fontSize:"10px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>abrirPagamentoModal(c.id,CY,m)}>
                                      ✓ {getDataPagamento(c.id,CY,m)||"Pago"}
                                    </button>
                                  ):isPagoParcial(c.id,CY,m)?(
                                    <div style={{textAlign:"center"}}>
                                      <button style={{background:"#FEF3C7",border:"1px solid #FDE68A",color:T.amber,borderRadius:"5px",padding:"2px 8px",fontSize:"10px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",display:"block",marginBottom:"2px"}} onClick={()=>abrirPagamentoModal(c.id,CY,m)}>
                                        ⚡ {fmt(getValorPago(c.id,CY,m))} pago
                                      </button>
                                      <span style={{fontSize:"9px",color:T.red}}>Saldo: {fmt(getSaldoDevedor(c.id,CY,m))}</span>
                                    </div>
                                  ):(
                                    <button style={{background:"#FEE2E2",border:"1px solid #FECACA",color:T.red,borderRadius:"5px",padding:"2px 8px",fontSize:"10px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>abrirPagamentoModal(c.id,CY,m)}>
                                      💳 {fmt(v)}
                                    </button>
                                  )}
                                  <button style={{background:T.blueLight,border:`1px solid #BAE6FD`,color:T.blue,borderRadius:"4px",padding:"1px 6px",fontSize:"9px",cursor:"pointer"}} onClick={()=>setFaturaDetalhe({cartaoId:c.id,month:m,year:CY,faturaTab})}>🔍 ver</button>
                                </div>:
                                faturaTab==="pagamentos"&&pg?<span style={{color:T.green,fontWeight:700,fontSize:"11px"}}>✓ {fmt(v)}</span>:
                                faturaTab==="inadimplencias"&&v>0&&!pg?<span style={{color:past?T.red:T.amber,fontWeight:700,fontSize:"11px",background:past?"#FEE2E2":"#FEF3C7",padding:"2px 6px",borderRadius:"4px"}}>{fmt(-v)}</span>:
                                "—"}
                              </td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {cardSub==="relatorio_c"&&(
              <div style={{...card(),overflowX:"auto"}}>
                <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>📊 Status por Cartão — {CY}</p>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                  <thead><tr><th style={{padding:"8px 10px",textAlign:"left",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`,minWidth:"150px"}}>Cartão</th>{MS.map(m=><th key={m} style={{padding:"8px 10px",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`,minWidth:"75px"}}>{m}</th>)}</tr></thead>
                  <tbody>{cartoes.map((c,ci)=><tr key={c.id}>
                    <td style={{padding:"8px 10px"}}><span style={chip(CARD_COLORS[ci%8])}>{c.nome}</span></td>
                    {yrMs.map(m=>{const v=getFat(c.id,CY,m),pg=isPago(c.id,CY,m),past=m<nowM;return<td key={m} style={{padding:"8px 10px"}}>{v>0?(pg?<span style={{background:T.greenLight,color:T.green,padding:"2px 8px",borderRadius:"5px",fontSize:"10px",fontWeight:700}}>Pago</span>:past?<span style={{background:T.redLight,color:T.red,padding:"2px 6px",borderRadius:"5px",fontSize:"10px",fontWeight:700}}>{fmt(-v)}</span>:<span style={{background:T.amberLight,color:T.amber,padding:"2px 6px",borderRadius:"5px",fontSize:"10px",fontWeight:700}}>{fmt(-v)}</span>):"—"}</td>;})}
                  </tr>)}</tbody>
                </table>
              </div>
            )}

            {cardSub==="dashcard"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"12px",marginBottom:"14px"}}>
                  {[{l:"CARTÕES",v:cartoes.length,c:T.amber,f:String},{l:"TOTAL GASTO",v:totalGastoCartoes,c:T.red,f:fmt},{l:"MÉDIA MENSAL",v:mediaFat,c:T.green,f:fmt}].map(m=>(
                    <div key={m.l} style={{...card({marginBottom:0}),border:`1px solid ${m.c}30`}}>
                      <p style={{fontSize:"11px",fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 6px"}}>{m.l}</p>
                      <p style={{fontSize:"26px",fontWeight:700,color:m.c,margin:0}}>{m.f(m.v)}</p>
                    </div>
                  ))}
                </div>
                <div style={card()}>
                  <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>📊 Gastos por Mês</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={cartaoChart} margin={{top:5,right:5,bottom:0,left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="name" tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tickFormatter={fmtK} tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CT/>}/>
                      <Bar dataKey="total" name="Faturas" fill={T.purple} radius={[4,4,0,0]}/>
                      {mediaFat>0&&<ReferenceLine y={mediaFat} stroke={T.green} strokeDasharray="4 4"/>}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {cartoes.length>0&&<div style={card()}>
                  <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>💳 Limites dos Cartões</p>
                  {cartoes.map((c,ci)=>{
                    const totalUsado=yrMs.reduce((s,m)=>s+getFat(c.id,CY,m),0);
                    const pct=c.limite>0?Math.min(100,(totalUsado/c.limite)*100):0;
                    return <div key={c.id} style={{marginBottom:"10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                        <span style={chip(CARD_COLORS[ci%8])}>{c.nome}</span>
                        <span style={{fontSize:"12px",color:T.textSub}}>{c.limite>0?`${fmt(totalUsado)} / ${fmt(c.limite)}`:"Sem limite cadastrado"}</span>
                      </div>
                      {c.limite>0&&<div style={{height:6,background:T.surfaceAlt,borderRadius:4,border:`1px solid ${T.border}`}}>
                        <div style={{height:6,width:`${pct}%`,background:pct>80?T.red:pct>60?T.amber:T.green,borderRadius:4,transition:"width 0.4s"}}/>
                      </div>}
                    </div>;
                  })}
                </div>}
              </div>
            )}
          </div>
        )}

        {/* ── CADASTROS ── */}
        {activeSection==="cadastros"&&(
          <div>
            <div style={{display:"flex",gap:"6px",marginBottom:"16px",flexWrap:"wrap"}}>
              {cadSubNav.map(([k,ic,l])=><button key={k} style={subT(cadSub===k)} onClick={()=>setCadSub(k)}>{ic} {l}</button>)}
            </div>
            {["bancos","fornecedores","pessoas"].includes(cadSub)&&(
              <div>
                <div style={card()}>
                  <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>
                    ➕ {cadSub==="bancos"?"Novo Banco":cadSub==="fornecedores"?"Novo Fornecedor":"Nova Pessoa"}
                  </p>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:"10px",marginBottom:"10px"}}>
                    <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Nome *</label><input style={inpS} placeholder="Nome completo" value={novoCad.nome} onChange={e=>setNovoCad(n=>({...n,nome:e.target.value}))}/></div>
                    <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Observação</label><input style={inpS} placeholder="Info adicional" value={novoCad.obs} onChange={e=>setNovoCad(n=>({...n,obs:e.target.value}))}/></div>
                    {cadSub==="bancos"&&<>
                      <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Agência</label><input style={inpS} placeholder="Ex: 0001" value={novoCad.agencia} onChange={e=>setNovoCad(n=>({...n,agencia:e.target.value}))}/></div>
                      <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Conta</label><input style={inpS} placeholder="Ex: 123456-7" value={novoCad.conta} onChange={e=>setNovoCad(n=>({...n,conta:e.target.value}))}/></div>
                    </>}
                  </div>
                  <button style={btnP(T.purple)} onClick={()=>addCad(cadSub)}>+ Cadastrar</button>
                </div>
                {(cadastros[cadSub]||[]).length>0&&(
                  <div style={card()}>
                    <p style={{fontSize:"13px",fontWeight:600,color:T.text,marginBottom:"12px"}}>📋 {cadSub==="bancos"?"Bancos":cadSub==="fornecedores"?"Fornecedores":"Pessoas"} Cadastrados ({(cadastros[cadSub]||[]).length})</p>
                    {(cadastros[cadSub]||[]).map((item,i)=>(
                      <div key={item.id} style={{...itemRow,flexDirection:"column",alignItems:"stretch",gap:"0"}}>
                        {editCad?.item?.id===item.id&&editCad?.tipo===cadSub?(
                          <div style={{display:"flex",flexDirection:"column",gap:"8px",padding:"8px 0"}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                              <div><label style={{fontSize:"11px",color:T.textSub,display:"block",marginBottom:"3px"}}>Nome</label><input style={inpS} value={editCad.item.nome} onChange={e=>setEditCad(ec=>({...ec,item:{...ec.item,nome:e.target.value}}))}/></div>
                              <div><label style={{fontSize:"11px",color:T.textSub,display:"block",marginBottom:"3px"}}>Observação</label><input style={inpS} value={editCad.item.obs||""} onChange={e=>setEditCad(ec=>({...ec,item:{...ec.item,obs:e.target.value}}))}/></div>
                              {cadSub==="bancos"&&<><div><label style={{fontSize:"11px",color:T.textSub,display:"block",marginBottom:"3px"}}>Agência</label><input style={inpS} value={editCad.item.agencia||""} onChange={e=>setEditCad(ec=>({...ec,item:{...ec.item,agencia:e.target.value}}))}/></div><div><label style={{fontSize:"11px",color:T.textSub,display:"block",marginBottom:"3px"}}>Conta</label><input style={inpS} value={editCad.item.conta||""} onChange={e=>setEditCad(ec=>({...ec,item:{...ec.item,conta:e.target.value}}))}/></div></>}
                            </div>
                            <div style={{display:"flex",gap:"6px"}}>
                              <button style={btnP(T.green)} onClick={saveEditCad}>✅ Salvar</button>
                              <button style={btnG} onClick={()=>setEditCad(null)}>Cancelar</button>
                            </div>
                          </div>
                        ):(
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div>
                              <p style={{color:T.text,fontSize:"13px",fontWeight:500,margin:0}}>{item.nome}</p>
                              {item.obs&&<p style={{color:T.textSub,fontSize:"11px",margin:"2px 0 0"}}>{item.obs}</p>}
                              {item.agencia&&<p style={{color:T.textSub,fontSize:"11px",margin:"2px 0 0"}}>Ag: {item.agencia} | Conta: {item.conta}</p>}
                            </div>
                            <div style={{display:"flex",gap:"5px"}}>
                              <button style={editB} onClick={()=>setEditCad({tipo:cadSub,item:{...item}})}>✏️ Editar</button>
                              <button style={remB} onClick={()=>{if(confirm(`Remover "${item.nome}"?`))removeCad(cadSub,item.id);}}>✕</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── EMITIR RELATÓRIO ── */}
        {activeSection==="emitir"&&(()=>{
          const [relAno, relMesNum] = relMes.split("-").map(Number);
          const mesIdx = relMesNum - 1;
          const mesData = (allYearsData[String(relAno)]||emptyYear())[mesIdx] || {receitas:[],despesas:[],investimentos:[],emprestimos:[]};
          const cartaoSel = cartoes.find(c=>c.id===relCartaoId);

          // Dados do relatório mensal
          const recTotal = sumArr(mesData.receitas);
          const despTotal = sumArr(mesData.despesas);
          const invTotal = sumArr(mesData.investimentos);
          const empTotal = sumArr(mesData.emprestimos);
          const fatMes = cartoes.reduce((s,c)=>s+getFat(c.id,relAno,mesIdx),0);
          const fatPago = cartoes.reduce((s,c)=>s+(isPago(c.id,relAno,mesIdx)?getFat(c.id,relAno,mesIdx):0),0);
          const fatAberto = fatMes - fatPago;
          const saldoMes = recTotal - despTotal - invTotal - empTotal - fatMes;

          // Dados da fatura do cartão
          const comprasCartao = relCartaoId ? usoCartoes.filter(u=>u.cartaoId===relCartaoId&&getInstMonths(u).some(im=>im.year===relAno&&im.month===mesIdx)) : [];
          const fatCartaoTotal = relCartaoId ? getFat(relCartaoId, relAno, mesIdx) : 0;
          const fatCartaoPaga = relCartaoId ? isPago(relCartaoId, relAno, mesIdx) : false;

          // Dados por texto (fornecedor/cliente)
          const q = relFiltroTexto.toLowerCase().trim();
          const itensFiltrados = q ? [
            ...mesData.receitas.filter(x=>(x.desc||"").toLowerCase().includes(q)||(x.cliente||"").toLowerCase().includes(q)).map(x=>({...x,_tipo:"Receita",_col:"#16A34A"})),
            ...mesData.despesas.filter(x=>(x.desc||"").toLowerCase().includes(q)||(x.fornecedor||"").toLowerCase().includes(q)).map(x=>({...x,_tipo:"Despesa",_col:"#DC2626"})),
            ...mesData.investimentos.filter(x=>(x.desc||"").toLowerCase().includes(q)).map(x=>({...x,_tipo:"Investimento",_col:"#0284C7"})),
            ...mesData.emprestimos.filter(x=>(x.desc||"").toLowerCase().includes(q)||(x.parafem||"").toLowerCase().includes(q)).map(x=>({...x,_tipo:"Empréstimo",_col:"#D97706"})),
          ] : [];

          const fmt2 = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
          const dataGeracao = new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
          const mesLabel = `${MONTHS[mesIdx]}/${relAno}`;

          const buildReportHTML = () => {
            const fmt2 = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
            const mesLabel = `${MONTHS[mesIdx]}/${relAno}`;
            const titulo = relTipo==="mensal"?`Fechamento Mensal — ${mesLabel}`:relTipo==="fatura"?`Fatura ${cartaoSel?.nome||""} — ${mesLabel}`:`Extrato: ${relFiltroTexto} — ${mesLabel}`;
            const css = `
              *{box-sizing:border-box;margin:0;padding:0}
              body{font-family:Arial,sans-serif;font-size:12px;color:#111827;background:#fff;padding:24px}
              h1{font-size:18px;color:#fff}.header{background:linear-gradient(135deg,#166534,#22C55E);color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center;margin-bottom:0}
              .header-right{text-align:right;font-size:12px}.header-right p{margin:3px 0}
              .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
              .card{border-radius:8px;padding:12px;border:1px solid #e5e7eb}.card-label{font-size:9px;font-weight:700;text-transform:uppercase;margin-bottom:4px;letter-spacing:0.05em}.card-value{font-size:18px;font-weight:700}.card-sub{font-size:9px;margin-top:3px}
              table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px}
              th{padding:7px 10px;text-align:left;font-weight:600;border-bottom:2px solid}
              td{padding:6px 10px;border-bottom:1px solid #f3f4f6}
              tr:nth-child(even){background:#f9fafb}
              .th-right{text-align:right}.td-right{text-align:right}
              .section-header{padding:8px 14px;border-radius:6px 6px 0 0;border-bottom:2px solid;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:13px;margin-top:16px}
              .badge{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;display:inline-block}
              .footer-bar{border-top:1px solid #e5e7eb;margin-top:20px;padding-top:12px;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af}
              .saldo-box{border-radius:8px;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;margin-top:14px;border:2px solid}
              .tfoot-row{background:#f3f4f6}
              @media print{@page{margin:12mm}body{padding:0}}
            `;
            let body = `<div class="header"><div><h1 style="display:flex;align-items:center;gap:8px"><img src="https://www.appgreenmind.com.br/logo-mark.png" alt="" style="width:24px;height:24px;object-fit:contain;filter:brightness(0) invert(1)"/>GreenMind</h1><p style="font-size:10px;opacity:0.85;margin-top:3px">Financial Planning</p></div><div class="header-right"><p><strong>${titulo}</strong></p><p style="opacity:0.8;font-size:10px">${dataGeracao}</p></div></div>`;

            if(relTipo==="mensal"){
              body += `<div class="cards">
                <div class="card" style="background:#dcfce7;border-color:#16a34a30"><div class="card-label" style="color:#16a34a">↑ Receitas</div><div class="card-value" style="color:#16a34a">${fmt2(recTotal)}</div></div>
                <div class="card" style="background:#fee2e2;border-color:#dc262630"><div class="card-label" style="color:#dc2626">↓ Despesas</div><div class="card-value" style="color:#dc2626">${fmt2(despTotal+empTotal)}</div></div>
                <div class="card" style="background:#fef3c7;border-color:#d9780630"><div class="card-label" style="color:#d97806">💳 Cartões</div><div class="card-value" style="color:#d97806">${fmt2(fatMes)}</div>${fatAberto>0?`<div class="card-sub" style="color:#d97806">${fmt2(fatAberto)} em aberto</div>`:""}</div>
                <div class="card" style="background:${saldoMes>=0?"#eff6ff":"#fee2e2"};border-color:${saldoMes>=0?"#1d4ed830":"#dc262630"}"><div class="card-label" style="color:${saldoMes>=0?"#1d4ed8":"#dc2626"}">= Saldo</div><div class="card-value" style="color:${saldoMes>=0?"#1d4ed8":"#dc2626"}">${fmt2(saldoMes)}</div></div>
              </div>`;
              if(mesData.receitas.length>0){
                body+=`<div class="section-header" style="background:#dcfce7;border-color:#16a34a;color:#14532d"><span>📥 Receitas</span><span>${fmt2(recTotal)}</span></div>
                <table><thead><tr style="background:#f0fdf4"><th style="color:#166534;border-color:#bbf7d0">Descrição</th><th style="color:#166534;border-color:#bbf7d0">Cliente</th><th style="color:#166534;border-color:#bbf7d0">Data</th><th style="color:#166534;border-color:#bbf7d0">Forma Rec.</th><th style="color:#166534;border-color:#bbf7d0">Status</th><th class="th-right" style="color:#166534;border-color:#bbf7d0">Valor</th></tr></thead><tbody>`;
                mesData.receitas.forEach(r=>{ body+=`<tr><td>${r.desc||""}</td><td>${r.cliente||"—"}</td><td>${r.date||""}</td><td>${({pix:"PIX",dinheiro:"Dinheiro",ted:"TED",cheque:"Cheque"})[r.formaRec]||"—"}</td><td><span class="badge" style="background:${r.recebido?"#dcfce7":"#fef3c7"};color:${r.recebido?"#16a34a":"#d97806"}">${r.recebido?"✓ Recebido":"Pendente"}</span></td><td class="td-right" style="color:#16a34a;font-weight:600">${fmt2(r.valor)}</td></tr>`; });
                body+=`</tbody><tfoot><tr class="tfoot-row"><td colspan="5" style="font-weight:700;color:#14532d">Total Receitas</td><td class="td-right" style="font-weight:700;color:#16a34a">${fmt2(recTotal)}</td></tr></tfoot></table>`;
              }
              if(mesData.despesas.length>0){
                body+=`<div class="section-header" style="background:#fee2e2;border-color:#dc2626;color:#7f1d1d"><span>📤 Despesas</span><span>${fmt2(despTotal)}</span></div>
                <table><thead><tr style="background:#fff5f5"><th style="color:#991b1b;border-color:#fecaca">Descrição</th><th style="color:#991b1b;border-color:#fecaca">Fornecedor</th><th style="color:#991b1b;border-color:#fecaca">Data</th><th style="color:#991b1b;border-color:#fecaca">Meio Pag.</th><th style="color:#991b1b;border-color:#fecaca">Parcela</th><th style="color:#991b1b;border-color:#fecaca">Status</th><th class="th-right" style="color:#991b1b;border-color:#fecaca">Valor</th></tr></thead><tbody>`;
                mesData.despesas.forEach(d=>{ body+=`<tr><td>${d.desc||""}</td><td>${d.fornecedor||"—"}</td><td>${d.date||""}</td><td>${({pix:"PIX",dinheiro:"Dinheiro",cheque:"Cheque",boleto:"Boleto",cartao:"Cartão"})[d.meioPag]||"—"}</td><td style="color:#d97806">${d.parcelaNum?`${d.parcelaNum}/${d.parcelas}`:"—"}</td><td><span class="badge" style="background:${d.pago?"#dcfce7":"#fef3c7"};color:${d.pago?"#16a34a":"#d97806"}">${d.pago?"✓ Pago":"Pendente"}</span></td><td class="td-right" style="color:#dc2626;font-weight:600">${fmt2(d.valor)}</td></tr>`; });
                body+=`</tbody><tfoot><tr class="tfoot-row"><td colspan="6" style="font-weight:700;color:#7f1d1d">Total Despesas</td><td class="td-right" style="font-weight:700;color:#dc2626">${fmt2(despTotal)}</td></tr></tfoot></table>`;
              }
              if(fatMes>0){
                body+=`<div class="section-header" style="background:#fef3c7;border-color:#d97806;color:#78350f"><span>💳 Faturas de Cartão</span><span>${fmt2(fatMes)}</span></div>
                <table><thead><tr style="background:#fffbeb"><th style="color:#92400e;border-color:#fde68a">Cartão</th><th style="color:#92400e;border-color:#fde68a">Total Fatura</th><th style="color:#92400e;border-color:#fde68a">Status</th></tr></thead><tbody>`;
                cartoes.forEach(c=>{const v=getFat(c.id,relAno,mesIdx);const pg=isPago(c.id,relAno,mesIdx);if(v>0)body+=`<tr><td style="font-weight:600">${c.nome}</td><td style="color:#d97806;font-weight:600">${fmt2(v)}</td><td><span class="badge" style="background:${pg?"#dcfce7":"#fee2e2"};color:${pg?"#16a34a":"#dc2626"}">${pg?"✓ Pago":"Em aberto"}</span></td></tr>`;});
                body+=`</tbody></table>`;
              }
              body+=`<div class="saldo-box" style="background:${saldoMes>=0?"#eff6ff":"#fef2f2"};border-color:${saldoMes>=0?"#bfdbfe":"#fecaca"}"><span style="font-weight:600;font-size:14px;color:${saldoMes>=0?"#1e3a8a":"#7f1d1d"}">Saldo Final — ${mesLabel}</span><span style="font-size:24px;font-weight:700;color:${saldoMes>=0?"#1d4ed8":"#dc2626"}">${fmt2(saldoMes)}</span></div>`;
            }

            if(relTipo==="fatura"&&relCartaoId){
              body+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0">
                <div class="card" style="background:#f9fafb"><div class="card-label">CARTÃO</div><div style="font-weight:700;font-size:14px">${cartaoSel?.nome||"—"}</div></div>
                <div class="card" style="background:#f9fafb"><div class="card-label">VENCIMENTO</div><div style="font-weight:700;font-size:14px">Dia ${cartaoSel?.diaPagamento||"—"}</div></div>
                <div class="card" style="background:#fef3c7;border-color:#d9780630"><div class="card-label" style="color:#d97806">TOTAL FATURA</div><div style="font-weight:700;font-size:18px;color:#d97806">${fmt2(fatCartaoTotal)}</div></div>
                <div class="card" style="background:#f9fafb"><div class="card-label">PARCELAS</div><div style="font-weight:700;font-size:14px">${comprasCartao.length} compras</div></div>
                <div class="card" style="background:#f9fafb"><div class="card-label">LIMITE</div><div style="font-weight:700;font-size:14px">${cartaoSel?.limite>0?fmt2(cartaoSel.limite):"Não informado"}</div></div>
                <div class="card" style="background:${fatCartaoPaga?"#dcfce7":"#fee2e2"};border-color:${fatCartaoPaga?"#16a34a30":"#dc262630"}"><div class="card-label" style="color:${fatCartaoPaga?"#16a34a":"#dc2626"}">STATUS</div><div style="font-weight:700;font-size:14px;color:${fatCartaoPaga?"#16a34a":"#dc2626"}">${fatCartaoPaga?"✓ PAGO":"EM ABERTO"}</div></div>
              </div>
              <table><thead><tr style="background:#fef3c7"><th style="color:#92400e;border-color:#d97806">Data</th><th style="color:#92400e;border-color:#d97806">Descrição</th><th style="color:#92400e;border-color:#d97806">Parcela</th><th class="th-right" style="color:#92400e;border-color:#d97806">Valor Parcela</th><th class="th-right" style="color:#92400e;border-color:#d97806">Valor Total</th></tr></thead><tbody>`;
              comprasCartao.forEach(u=>{const np=getInstMonths(u).findIndex(im=>im.year===relAno&&im.month===mesIdx)+1;body+=`<tr><td>${u.data||""}</td><td style="font-weight:500">${u.descricao||""}</td><td style="color:#d97806">${np}/${u.parcelas}x</td><td class="td-right" style="color:#d97806;font-weight:600">${fmt2(u.valorParcela)}</td><td class="td-right" style="color:#6b7280">${fmt2(u.valor)}</td></tr>`;});
              body+=`</tbody><tfoot><tr class="tfoot-row"><td colspan="3" style="font-weight:700;color:#78350f">TOTAL DA FATURA</td><td colspan="2" class="td-right" style="font-weight:700;font-size:16px;color:#d97806">${fmt2(fatCartaoTotal)}</td></tr></tfoot></table>
              <div class="saldo-box" style="background:${fatCartaoPaga?"#dcfce7":"#fee2e2"};border-color:${fatCartaoPaga?"#16a34a":"#dc2626"}"><span style="font-weight:600;color:${fatCartaoPaga?"#14532d":"#7f1d1d"}">Status do Pagamento</span><span style="font-size:18px;font-weight:700;color:${fatCartaoPaga?"#16a34a":"#dc2626"}">${fatCartaoPaga?"✓ FATURA PAGA":"⚠ FATURA EM ABERTO"}</span></div>`;
            }

            if(relTipo==="filtro"&&itensFiltrados.length>0){
              body+=`<table style="margin-top:16px"><thead><tr style="background:#f3f4f6"><th style="border-color:#e5e7eb">Tipo</th><th style="border-color:#e5e7eb">Descrição</th><th style="border-color:#e5e7eb">Fornecedor/Cliente</th><th style="border-color:#e5e7eb">Data</th><th style="border-color:#e5e7eb">Parcela</th><th style="border-color:#e5e7eb">Status</th><th class="th-right" style="border-color:#e5e7eb">Valor</th></tr></thead><tbody>`;
              itensFiltrados.forEach(item=>{ body+=`<tr><td><span class="badge" style="background:${item._col}20;color:${item._col}">${item._tipo}</span></td><td style="font-weight:500">${item.desc||""}</td><td style="color:#6b7280">${item.fornecedor||item.cliente||item.parafem||"—"}</td><td>${item.date||""}</td><td style="color:#d97806">${item.parcelaNum?`${item.parcelaNum}/${item.parcelas}`:"—"}</td><td><span class="badge" style="background:${(item.pago||item.recebido||item.investido)?"#dcfce7":"#fef3c7"};color:${(item.pago||item.recebido||item.investido)?"#16a34a":"#d97806"}">${(item.pago||item.recebido||item.investido)?"✓ Pago":"Pendente"}</span></td><td class="td-right" style="font-weight:600;color:${item._col}">${fmt2(item.valor)}</td></tr>`; });
              body+=`</tbody><tfoot><tr class="tfoot-row"><td colspan="6" style="font-weight:700">Total</td><td class="td-right" style="font-weight:700;font-size:14px">${fmt2(itensFiltrados.reduce((s,x)=>s+x.valor,0))}</td></tr></tfoot></table>`;
            }

            body+=`<div class="footer-bar"><span>GreenMind — Financial Planning</span><span>${dataGeracao}</span><span>Confidencial</span></div>`;
            return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${titulo}</title><style>${css}</style></head><body>${body}<script>window.onload=function(){window.print();}<\/script></body></html>`;
          };

          const printReport = () => {
            const html = buildReportHTML();
            const win = window.open("","_blank","width=900,height=700");
            if(win){ win.document.write(html); win.document.close(); }
            else { alert("Por favor, permita pop-ups para este site para exportar o PDF."); }
          };

          return (
            <div>
              {/* Painel de controle */}
              <div style={card()}>
                <p style={{fontSize:"14px",fontWeight:700,color:T.text,marginBottom:"14px"}}>📄 Configurar Relatório</p>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"12px",marginBottom:"14px"}}>
                  <div>
                    <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Tipo de Relatório</label>
                    <select style={selS} value={relTipo} onChange={e=>setRelTipo(e.target.value)}>
                      <option value="mensal">📅 Fechamento Mensal</option>
                      <option value="fatura">💳 Fatura de Cartão</option>
                      <option value="filtro">🔍 Por Fornecedor / Cliente</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Competência (mês/ano)</label>
                    <input type="month" style={inpS} value={relMes} onChange={e=>setRelMes(e.target.value)}/>
                  </div>
                  {relTipo==="fatura"&&(
                    <div>
                      <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Cartão</label>
                      <select style={selS} value={relCartaoId} onChange={e=>setRelCartaoId(e.target.value)}>
                        <option value="">Selecione o cartão</option>
                        {cartoes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                  )}
                  {relTipo==="filtro"&&(
                    <div>
                      <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Pesquisar por</label>
                      <input style={inpS} placeholder="Ex: Casas da Água, Caixa..." value={relFiltroTexto} onChange={e=>setRelFiltroTexto(e.target.value)}/>
                    </div>
                  )}
                </div>
                <button style={btnP(T.green)} onClick={printReport}>🖨️ Imprimir / Exportar PDF</button>
              </div>

              {/* PREVIEW DO RELATÓRIO */}
              <div style={{...card(),border:"2px solid #E2E8F0",background:"#fff"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"8px"}}>
                  <p style={{fontSize:"13px",fontWeight:600,color:T.textSub,margin:0}}>Pré-visualização</p>
                  <p style={{fontSize:"11px",color:T.textMuted,margin:0}}>Gerado em {dataGeracao}</p>
                </div>

                {/* ─ CONTEÚDO DO RELATÓRIO ─ */}
<div style={{border:"1px solid #E2E8F0",borderRadius:"12px",overflow:"hidden",overflowX:isMobile?"auto":"hidden"}}>
                  {/* Header do relatório */}
                  <div style={{background:"linear-gradient(135deg,#166534,#22C55E)",padding:"20px 24px",color:"#fff"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
                      <div>
                        <h2 style={{margin:0,fontSize:"20px",fontWeight:700,display:"flex",alignItems:"center",gap:"8px"}}><img src="/logo-mark.png" alt="" style={{width:"26px",height:"26px",objectFit:"contain",filter:"brightness(0) invert(1)"}}/>GreenMind</h2>
                        <p style={{margin:"4px 0 0",fontSize:"12px",opacity:0.85}}>Financial Planning</p>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <p style={{margin:0,fontSize:"16px",fontWeight:600}}>
                          {relTipo==="mensal"&&`Fechamento Mensal — ${mesLabel}`}
                          {relTipo==="fatura"&&`Fatura ${cartaoSel?.nome||"Cartão"} — ${mesLabel}`}
                          {relTipo==="filtro"&&`Extrato: ${relFiltroTexto||"—"} — ${mesLabel}`}
                        </p>
                        <p style={{margin:"4px 0 0",fontSize:"11px",opacity:0.8}}>{dataGeracao}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{padding:"20px 24px"}}>
                    {/* ── FECHAMENTO MENSAL ── */}
                    {relTipo==="mensal"&&(
                      <div>
                        {/* Resumo */}
                        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px",marginBottom:"20px"}}>
                          {[
                            {l:"Total Receitas",v:recTotal,c:"#16A34A",bg:"#DCFCE7",icon:"↑"},
                            {l:"Total Despesas",v:despTotal+empTotal,c:"#DC2626",bg:"#FEE2E2",icon:"↓"},
                            {l:"Cartões (fatura)",v:fatMes,c:"#D97706",bg:"#FEF3C7",icon:"💳",sub:fatAberto>0?`${fmt2(fatAberto)} em aberto`:"✓ Pago"},
                            {l:"Saldo do Mês",v:saldoMes,c:saldoMes>=0?"#1D4ED8":"#DC2626",bg:saldoMes>=0?"#EFF6FF":"#FEE2E2",icon:"="},
                          ].map(m=>(
                            <div key={m.l} style={{background:m.bg,borderRadius:"10px",padding:"14px",border:`1px solid ${m.c}20`}}>
                              <p style={{fontSize:"11px",color:m.c,fontWeight:600,textTransform:"uppercase",margin:"0 0 4px",letterSpacing:"0.05em"}}>{m.icon} {m.l}</p>
                              <p style={{fontSize:"22px",fontWeight:700,color:m.c,margin:0}}>{fmt2(m.v)}</p>
                              {m.sub&&<p style={{fontSize:"10px",color:m.c,margin:"3px 0 0"}}>{m.sub}</p>}
                            </div>
                          ))}
                        </div>

                        {/* Receitas */}
                        {mesData.receitas.length>0&&(
                          <div style={{marginBottom:"20px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#DCFCE7",padding:"8px 14px",borderRadius:"8px 8px 0 0",borderBottom:"2px solid #16A34A"}}>
                              <span style={{fontWeight:700,color:"#14532D",fontSize:"13px"}}>📥 Receitas</span>
                              <span style={{fontWeight:700,color:"#16A34A"}}>{fmt2(recTotal)}</span>
                            </div>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                              <thead><tr style={{background:"#F0FDF4"}}>
                                {["Descrição","Cliente","Data","Forma Rec.","Status","Valor"].map(h=><th key={h} style={{padding:"7px 12px",textAlign:h==="Valor"?"right":"left",color:"#166534",fontWeight:600,borderBottom:"1px solid #BBF7D0"}}>{h}</th>)}
                              </tr></thead>
                              <tbody>{mesData.receitas.map((r,i)=>(
                                <tr key={r.id} style={{background:i%2===0?"#fff":"#F9FAFB"}}>
                                  <td style={{padding:"7px 12px",color:"#111827"}}>{r.desc}</td>
                                  <td style={{padding:"7px 12px",color:"#6B7280"}}>{r.cliente||"—"}</td>
                                  <td style={{padding:"7px 12px",color:"#6B7280",whiteSpace:"nowrap"}}>{r.date}</td>
                                  <td style={{padding:"7px 12px",color:"#6B7280"}}>{({pix:"PIX",dinheiro:"Dinheiro",ted:"TED",cheque:"Cheque"})[r.formaRec]||r.formaRec||"—"}</td>
                                  <td style={{padding:"7px 12px"}}><span style={{background:r.recebido?"#DCFCE7":"#FEF3C7",color:r.recebido?"#16A34A":"#D97706",padding:"2px 8px",borderRadius:"10px",fontSize:"10px",fontWeight:600}}>{r.recebido?"✓ Recebido":"Pendente"}</span></td>
                                  <td style={{padding:"7px 12px",textAlign:"right",fontWeight:600,color:"#16A34A"}}>{fmt2(r.valor)}</td>
                                </tr>
                              ))}</tbody>
                              <tfoot><tr style={{background:"#DCFCE7"}}><td colSpan={5} style={{padding:"8px 12px",fontWeight:700,color:"#14532D"}}>Total Receitas</td><td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#16A34A"}}>{fmt2(recTotal)}</td></tr></tfoot>
                            </table>
                          </div>
                        )}

                        {/* Despesas */}
                        {mesData.despesas.length>0&&(
                          <div style={{marginBottom:"20px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FEE2E2",padding:"8px 14px",borderRadius:"8px 8px 0 0",borderBottom:"2px solid #DC2626"}}>
                              <span style={{fontWeight:700,color:"#7F1D1D",fontSize:"13px"}}>📤 Despesas</span>
                              <span style={{fontWeight:700,color:"#DC2626"}}>{fmt2(despTotal)}</span>
                            </div>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                              <thead><tr style={{background:"#FFF5F5"}}>
                                {["Descrição","Fornecedor","Data","Meio Pag.","Parcela","Status","Valor"].map(h=><th key={h} style={{padding:"7px 12px",textAlign:h==="Valor"?"right":"left",color:"#991B1B",fontWeight:600,borderBottom:"1px solid #FECACA"}}>{h}</th>)}
                              </tr></thead>
                              <tbody>{mesData.despesas.map((d,i)=>(
                                <tr key={d.id} style={{background:i%2===0?"#fff":"#F9FAFB"}}>
                                  <td style={{padding:"7px 12px",color:"#111827"}}>{d.desc}</td>
                                  <td style={{padding:"7px 12px",color:"#6B7280"}}>{d.fornecedor||"—"}</td>
                                  <td style={{padding:"7px 12px",color:"#6B7280",whiteSpace:"nowrap"}}>{d.date}</td>
                                  <td style={{padding:"7px 12px",color:"#6B7280"}}>{({pix:"PIX",dinheiro:"Dinheiro",cheque:"Cheque",boleto:"Boleto",cartao:"Cartão"})[d.meioPag]||"—"}</td>
                                  <td style={{padding:"7px 12px",color:"#D97706",fontSize:"11px"}}>{d.parcelaNum?`${d.parcelaNum}/${d.parcelas}`:"—"}</td>
                                  <td style={{padding:"7px 12px"}}><span style={{background:d.pago?"#DCFCE7":"#FEF3C7",color:d.pago?"#16A34A":"#D97706",padding:"2px 8px",borderRadius:"10px",fontSize:"10px",fontWeight:600}}>{d.pago?"✓ Pago":"Pendente"}</span></td>
                                  <td style={{padding:"7px 12px",textAlign:"right",fontWeight:600,color:"#DC2626"}}>{fmt2(d.valor)}</td>
                                </tr>
                              ))}</tbody>
                              <tfoot><tr style={{background:"#FEE2E2"}}><td colSpan={6} style={{padding:"8px 12px",fontWeight:700,color:"#7F1D1D"}}>Total Despesas</td><td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#DC2626"}}>{fmt2(despTotal)}</td></tr></tfoot>
                            </table>
                          </div>
                        )}

                        {/* Cartões */}
                        {fatMes>0&&(
                          <div style={{marginBottom:"20px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FEF3C7",padding:"8px 14px",borderRadius:"8px 8px 0 0",borderBottom:"2px solid #D97706"}}>
                              <span style={{fontWeight:700,color:"#78350F",fontSize:"13px"}}>💳 Faturas de Cartão</span>
                              <span style={{fontWeight:700,color:"#D97706"}}>{fmt2(fatMes)}</span>
                            </div>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                              <thead><tr style={{background:"#FFFBEB"}}>{["Cartão","Total Fatura","Status"].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",color:"#92400E",fontWeight:600,borderBottom:"1px solid #FDE68A"}}>{h}</th>)}</tr></thead>
                              <tbody>{cartoes.map((c,i)=>{const v=getFat(c.id,relAno,mesIdx);const pg=isPago(c.id,relAno,mesIdx);return v>0?(<tr key={c.id} style={{background:i%2===0?"#fff":"#FFFBEB"}}>
                                <td style={{padding:"7px 12px",fontWeight:600}}>{c.nome}</td>
                                <td style={{padding:"7px 12px",fontWeight:600,color:"#D97706"}}>{fmt2(v)}</td>
                                <td style={{padding:"7px 12px"}}><span style={{background:pg?"#DCFCE7":"#FEE2E2",color:pg?"#16A34A":"#DC2626",padding:"2px 8px",borderRadius:"10px",fontSize:"10px",fontWeight:600}}>{pg?"✓ Pago":"Em aberto"}</span></td>
                              </tr>):null;})}</tbody>
                            </table>
                          </div>
                        )}

                        {/* Rodapé saldo */}
                        <div style={{background:saldoMes>=0?"#EFF6FF":"#FEF2F2",border:`2px solid ${saldoMes>=0?"#BFDBFE":"#FECACA"}`,borderRadius:"10px",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:"14px",fontWeight:600,color:saldoMes>=0?"#1E3A8A":"#7F1D1D"}}>Saldo Final — {mesLabel}</span>
                          <span style={{fontSize:"26px",fontWeight:700,color:saldoMes>=0?"#1D4ED8":"#DC2626"}}>{fmt2(saldoMes)}</span>
                        </div>
                      </div>
                    )}

                    {/* ── FATURA DE CARTÃO ── */}
                    {relTipo==="fatura"&&(
                      <div>
                        {!relCartaoId&&<p style={{color:"#6B7280",textAlign:"center",padding:"20px"}}>Selecione um cartão acima para gerar a fatura.</p>}
                        {relCartaoId&&(
                          <div>
                            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:"10px",marginBottom:"20px"}}>
                              {[{l:"Cartão",v:cartaoSel?.nome||"—",isText:true},{l:"Vencimento",v:cartaoSel?`Dia ${cartaoSel.diaPagamento}`:"-",isText:true},{l:"Total Fatura",v:fmt2(fatCartaoTotal),c:"#D97706"},{l:"Parcelas",v:`${comprasCartao.length} compras`,isText:true},{l:"Limite",v:cartaoSel?.limite>0?fmt2(cartaoSel.limite):"Não informado",isText:true},{l:"Status",v:fatCartaoPaga?"✓ PAGO":"EM ABERTO",c:fatCartaoPaga?"#16A34A":"#DC2626"}].map(m=>(
                                <div key={m.l} style={{background:"#F9FAFB",borderRadius:"8px",padding:"12px",border:"1px solid #E5E7EB"}}>
                                  <p style={{fontSize:"10px",color:"#6B7280",fontWeight:600,textTransform:"uppercase",margin:"0 0 4px"}}>{m.l}</p>
                                  <p style={{fontSize:m.c?"18px":"14px",fontWeight:700,color:m.c||"#111827",margin:0}}>{m.v}</p>
                                </div>
                              ))}
                            </div>
                            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:isMobile?"500px":"100%",marginBottom:"14px"}}>
                              <thead><tr style={{background:"#FEF3C7"}}>
                                {["Data","Descrição","Parcela","Valor Parcela","Valor Total"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:h.includes("Valor")?"right":"left",color:"#92400E",fontWeight:600,borderBottom:"2px solid #D97706"}}>{h}</th>)}
                              </tr></thead>
                              <tbody>{comprasCartao.map((u,i)=>{const np=getInstMonths(u).findIndex(im=>im.year===relAno&&im.month===mesIdx)+1;return(
                                <tr key={u.id} style={{background:i%2===0?"#fff":"#FFFBEB"}}>
                                  <td style={{padding:"7px 12px",color:"#6B7280",whiteSpace:"nowrap"}}>{u.data}</td>
                                  <td style={{padding:"7px 12px",color:"#111827",fontWeight:500}}>{u.descricao}</td>
                                  <td style={{padding:"7px 12px",color:"#D97706"}}>{np}/{u.parcelas}x</td>
                                  <td style={{padding:"7px 12px",textAlign:"right",fontWeight:600,color:"#D97706"}}>{fmt2(u.valorParcela)}</td>
                                  <td style={{padding:"7px 12px",textAlign:"right",color:"#6B7280"}}>{fmt2(u.valor)}</td>
                                </tr>);
                              })}</tbody>
                              <tfoot><tr style={{background:"#FEF3C7"}}><td colSpan={3} style={{padding:"8px 12px",fontWeight:700,color:"#78350F"}}>TOTAL DA FATURA</td><td colSpan={2} style={{padding:"8px 12px",textAlign:"right",fontWeight:700,fontSize:"16px",color:"#D97706"}}>{fmt2(fatCartaoTotal)}</td></tr></tfoot>
                            </table></div>
                            <div style={{background:fatCartaoPaga?"#DCFCE7":"#FEE2E2",border:`2px solid ${fatCartaoPaga?"#16A34A":"#DC2626"}`,borderRadius:"10px",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontWeight:600,color:fatCartaoPaga?"#14532D":"#7F1D1D"}}>Status do Pagamento</span>
                              <span style={{fontWeight:700,fontSize:"16px",color:fatCartaoPaga?"#16A34A":"#DC2626"}}>{fatCartaoPaga?"✓ FATURA PAGA":"⚠ FATURA EM ABERTO"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── POR FORNECEDOR/CLIENTE ── */}
                    {relTipo==="filtro"&&(
                      <div>
                        {!relFiltroTexto&&<p style={{color:"#6B7280",textAlign:"center",padding:"20px"}}>Digite um fornecedor, cliente ou descrição acima.</p>}
                        {relFiltroTexto&&itensFiltrados.length===0&&<p style={{color:"#6B7280",textAlign:"center",padding:"20px"}}>Nenhum resultado para "{relFiltroTexto}" em {mesLabel}.</p>}
                        {itensFiltrados.length>0&&(
                          <div>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",marginBottom:"14px"}}>
                              <thead><tr style={{background:"#F3F4F6"}}>
                                {["Tipo","Descrição","Fornecedor/Cliente","Data","Parcela","Status","Valor"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:h==="Valor"?"right":"left",color:"#374151",fontWeight:600,borderBottom:"2px solid #E5E7EB"}}>{h}</th>)}
                              </tr></thead>
                              <tbody>{itensFiltrados.map((item,i)=>(
                                <tr key={item.id} style={{background:i%2===0?"#fff":"#F9FAFB"}}>
                                  <td style={{padding:"7px 12px"}}><span style={{background:`${item._col}20`,color:item._col,padding:"2px 8px",borderRadius:"10px",fontSize:"10px",fontWeight:600}}>{item._tipo}</span></td>
                                  <td style={{padding:"7px 12px",fontWeight:500}}>{item.desc}</td>
                                  <td style={{padding:"7px 12px",color:"#6B7280"}}>{item.fornecedor||item.cliente||item.parafem||"—"}</td>
                                  <td style={{padding:"7px 12px",color:"#6B7280",whiteSpace:"nowrap"}}>{item.date}</td>
                                  <td style={{padding:"7px 12px",color:"#D97706",fontSize:"11px"}}>{item.parcelaNum?`${item.parcelaNum}/${item.parcelas}`:"—"}</td>
                                  <td style={{padding:"7px 12px"}}><span style={{background:(item.pago||item.recebido||item.investido)?"#DCFCE7":"#FEF3C7",color:(item.pago||item.recebido||item.investido)?"#16A34A":"#D97706",padding:"2px 8px",borderRadius:"10px",fontSize:"10px",fontWeight:600}}>{(item.pago||item.recebido||item.investido)?"✓ Pago":"Pendente"}</span></td>
                                  <td style={{padding:"7px 12px",textAlign:"right",fontWeight:600,color:item._col}}>{fmt2(item.valor)}</td>
                                </tr>
                              ))}</tbody>
                              <tfoot><tr style={{background:"#F3F4F6"}}><td colSpan={6} style={{padding:"8px 12px",fontWeight:700}}>Total</td><td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,fontSize:"14px"}}>{fmt2(itensFiltrados.reduce((s,x)=>s+x.valor,0))}</td></tr></tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rodapé do relatório */}
                    <div style={{borderTop:"1px solid #E5E7EB",marginTop:"20px",paddingTop:"14px",display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#9CA3AF"}}>
                      <span>GreenMind — Financial Planning</span>
                      <span>{dataGeracao}</span>
                      <span>Confidencial</span>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          );
        })()}

        {/* ── MEI ── */}
        {activeSection==="mei"&&(()=>{
          const { meis, notas } = meiData;
          const CY_STR = String(meiViewYear); // usa ano próprio do MEI, independente do ano global

          // Anos disponíveis baseado nas notas registradas
          const anosDisponiveis = [...new Set(notas.map(n=>n.competencia?.slice(0,4)).filter(Boolean))].sort((a,b)=>Number(b)-Number(a));
          const isPastYear = meiViewYear < new Date().getFullYear();

          // helpers
          const faturadoMes = (meiId, comp) => notas.filter(n=>n.meiId===meiId&&n.competencia===comp).reduce((s,n)=>s+parseFloat(n.valor||0),0);
          const faturadoAno = (meiId) => notas.filter(n=>n.meiId===meiId&&n.competencia?.startsWith(CY_STR)).reduce((s,n)=>s+parseFloat(n.valor||0),0);
          const faturadoAnoEspecifico = (meiId, ano) => notas.filter(n=>n.meiId===meiId&&n.competencia?.startsWith(String(ano))).reduce((s,n)=>s+parseFloat(n.valor||0),0);
          const notasMes = (meiId, comp) => notas.filter(n=>n.meiId===meiId&&n.competencia===comp);
          const notasAnoMei = (meiId) => notas.filter(n=>n.meiId===meiId&&n.competencia?.startsWith(CY_STR));
          const mesesComDados = (meiId) => {
            const set = new Set(notas.filter(n=>n.meiId===meiId&&n.competencia?.startsWith(CY_STR)).map(n=>n.competencia));
            return set.size;
          };
          const projecaoAnual = (meiId) => {
            const m = mesesComDados(meiId);
            if(m===0) return 0;
            return (faturadoAno(meiId)/m)*12;
          };
          const restanteLimite = (meiId) => {
            const mei = meis.find(m=>m.id===meiId);
            return Math.max(0,getLimiteEfetivo(mei,currentYear)-faturadoAno(meiId));
          };
          const mediaMensalSegura = (meiId) => {
            const mei = meis.find(m=>m.id===meiId);
            const mAtual = new Date().getMonth();
            // Se MEI abriu neste ano, contar a partir do mês de abertura
            let mInicio = 0;
            if(mei?.dataAbertura){
              const ab = new Date(mei.dataAbertura+"T12:00:00");
              if(ab.getFullYear()===currentYear) mInicio = ab.getMonth();
            }
            const mesesRestantes = 12 - Math.max(mAtual, mInicio);
            return mesesRestantes>0?restanteLimite(meiId)/mesesRestantes:0;
          };
          const pctLimite = (valor, limiteAnual) => Math.min(100,(valor/(limiteAnual||LIMITE_MEI_ANUAL))*100);

          // Calcula o limite efetivo do MEI para o ano — proporcional se abriu neste ano
          const getLimiteEfetivo = (mei, year) => {
            const limBase = mei?.limiteAnual || LIMITE_MEI_ANUAL;
            if(!mei?.dataAbertura) return limBase;
            const abDate = new Date(mei.dataAbertura + "T12:00:00");
            if(abDate.getFullYear() !== year) return limBase;
            // Meses ativos = do mês de abertura até dezembro (inclusive)
            const mesesAtivos = 12 - abDate.getMonth();
            return parseFloat(((limBase / 12) * mesesAtivos).toFixed(2));
          };

          const addNF = () => {
            const { meiId, competencia, numeroNF, valor, prestador, tomador, descricao } = nfForm;
            if(!meiId||!competencia||!valor) { showToast("Preencha MEI, competência e valor","error"); return; }
            const { dataEmissao } = nfForm;
            const novaNotaFiscal = { id:uid(), meiId, competencia, dataEmissao, numeroNF, valor:parseFloat(valor)||0, prestador, tomador, descricao, dataCad:today };
            setMeiData(d=>({...d, notas:[...d.notas, novaNotaFiscal]}));
            setNfForm(emptyNFForm());
            showToast("NF registrada!");
          };

          const removeNF = (id) => { setMeiData(d=>({...d, notas:d.notas.filter(n=>n.id!==id)})); };

          // Color for a MEI
          const meiCor = (meiId) => meis.find(m=>m.id===meiId)?.cor||T.purple;
          const meiNome = (meiId) => meis.find(m=>m.id===meiId)?.nome||meiId;

          // chart data for visual mensal
          const mesesChart = Array.from({length:12},(_,i)=>{
            const comp = CY_STR+"-"+String(i+1).padStart(2,"0");
            const obj = { name:MS[i] };
            meis.forEach(m=>{ obj[m.nome]=faturadoMes(m.id,comp); });
            return obj;
          });

          return (
            <div>
              {/* Sub-tabs */}
              <div style={{display:"flex",gap:"6px",marginBottom:"16px",flexWrap:"wrap"}}>
                {[["lancamentos","📝","Lançamentos"],["mensal","📅","Visão Mensal"],["anual","📊","Visão Anual"],["config","⚙️","Config"]].map(([k,ic,l])=>(
                  <button key={k} style={{...subT(meiTab===k),whiteSpace:"nowrap"}} onClick={()=>setMeiTab(k)}>{ic} {l}</button>
                ))}
              </div>

              {/* ── LANÇAMENTOS ── */}
              {meiTab==="lancamentos"&&(
                <div>
                  {/* Form */}
                  <div style={card()}>
                    <p style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"14px"}}>📝 Registrar Nota Fiscal</p>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"10px",marginBottom:"12px"}}>
                      <div>
                        <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>MEI *</label>
                        <select style={selS} value={nfForm.meiId} onChange={e=>setNfForm(f=>({...f,meiId:e.target.value}))}>
                          <option value="">Selecione o MEI</option>
                          {meis.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Competência * <span style={{color:T.textMuted,fontSize:"10px"}}>(mês de referência)</span></label>
                        <input type="month" style={inpS} value={nfForm.competencia} onChange={e=>setNfForm(f=>({...f,competencia:e.target.value}))}/>
                      </div>
                      <div>
                        <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Data de Emissão da NF</label>
                        <input type="date" style={inpS} value={nfForm.dataEmissao} onChange={e=>setNfForm(f=>({...f,dataEmissao:e.target.value}))}/>
                      </div>
                      <div>
                        <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Nº da NF</label>
                        <input style={inpS} placeholder="Ex: 001" value={nfForm.numeroNF} onChange={e=>setNfForm(f=>({...f,numeroNF:e.target.value}))}/>
                      </div>
                      <div>
                        <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Valor (R$) *</label>
                        <input type="number" step="0.01" style={inpS} placeholder="0,00" value={nfForm.valor} onChange={e=>setNfForm(f=>({...f,valor:e.target.value}))}/>
                      </div>
                      <div>
                        <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Prestador (quem emite)</label>
                        <input style={inpS} placeholder="Nome do MEI" value={nfForm.prestador} onChange={e=>setNfForm(f=>({...f,prestador:e.target.value}))}/>
                      </div>
                      <div>
                        <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Tomador (cliente)</label>
                        <input style={inpS} placeholder="Empresa/pessoa contratante" value={nfForm.tomador} onChange={e=>setNfForm(f=>({...f,tomador:e.target.value}))}/>
                      </div>
                      <div style={{gridColumn:"span 3"}}>
                        <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Descrição do serviço</label>
                        <input style={inpS} placeholder="Ex: Serviços de contabilidade referente ao mês..." value={nfForm.descricao} onChange={e=>setNfForm(f=>({...f,descricao:e.target.value}))}/>
                      </div>
                    </div>
                    <button style={btnP(T.green)} onClick={addNF}>+ Registrar NF</button>
                  </div>

                  {/* Cards de limite em tempo real */}
                  {nfForm.competencia&&(
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:"12px",marginBottom:"14px"}}>
                      {meis.map(m=>{
                        const fatMes=faturadoMes(m.id,nfForm.competencia);
                        const limEf=getLimiteEfetivo(m,meiViewYear);
                        const limMes=limEf/12;
                        const fatAno=faturadoAno(m.id);
                        const limAnual=limEf;
                        const pctMes=pctLimite(fatMes,limMes);
                        const pctAno=(fatAno/limAnual)*100;
                        return(
                          <div key={m.id} style={{...card({marginBottom:0}),border:`1px solid ${m.cor}30`}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                              <span style={{...chip(m.cor),fontSize:"12px"}}>{m.nome}</span>
                              <span style={{fontSize:"11px",color:T.textSub}}>{nfForm.competencia.replace("-","/")}</span>
                            </div>
                            <div style={{marginBottom:"8px"}}>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"3px"}}>
                                <span style={{color:T.textSub}}>Mês: {fmt(fatMes)}</span>
                                <span style={{color:pctMes>100?T.red:T.textSub}}>Limite: {fmt(limMes)}</span>
                              </div>
                              <div style={{height:6,background:T.surfaceAlt,borderRadius:4,border:`1px solid ${T.border}`}}>
                                <div style={{height:6,width:`${Math.min(100,pctMes)}%`,background:pctMes>90?T.red:pctMes>70?T.amber:m.cor,borderRadius:4,transition:"width 0.4s"}}/>
                              </div>
                            </div>
                            <div>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"3px"}}>
                                <span style={{color:T.textSub}}>Ano: {fmt(fatAno)}</span>
                                <span style={{color:pctAno>100?T.red:T.textSub}}>{pctAno.toFixed(1)}% do limite</span>
                              </div>
                              <div style={{height:6,background:T.surfaceAlt,borderRadius:4,border:`1px solid ${T.border}`}}>
                                <div style={{height:6,width:`${Math.min(100,pctAno)}%`,background:pctAno>90?T.red:pctAno>70?T.amber:m.cor,borderRadius:4,transition:"width 0.4s"}}/>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tabela todas as NFs */}
                  {notas.length>0&&(
                    <div style={card()}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
                        <p style={{fontSize:"13px",fontWeight:700,color:T.text,margin:0}}>📋 Notas Fiscais Registradas ({notas.length})</p>
                        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                          {anosDisponiveis.map(ano=>(
                            <button key={ano} style={{...subT(String(meiViewYear)===ano),fontSize:"11px",padding:"3px 10px"}} onClick={()=>setMeiViewYear(Number(ano))}>{ano}</button>
                          ))}
                          {anosDisponiveis.length>0&&<button style={{...subT(false),fontSize:"11px",padding:"3px 10px"}} onClick={()=>{}}>Todos</button>}
                        </div>
                      </div>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                          <thead>
                            <tr style={{background:T.surfaceAlt}}>
                              {["MEI","Competência","Emissão","Nº NF","Valor","Prestador","Tomador","Descrição",""].map(h=>(
                                <th key={h} style={{padding:"8px 10px",textAlign:"left",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...notas].sort((a,b)=>b.competencia?.localeCompare(a.competencia||"")||0).map(n=>(
                              <tr key={n.id} style={{borderBottom:`1px solid ${T.border}`}}>
                                <td style={{padding:"8px 10px"}}><span style={chip(meiCor(n.meiId))}>{meiNome(n.meiId)}</span></td>
                                <td style={{padding:"8px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{n.competencia?.replace("-","/")||"—"}</td>
                                <td style={{padding:"8px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{n.dataEmissao||"—"}</td>
                                <td style={{padding:"8px 10px",color:T.purple,fontWeight:600}}>{n.numeroNF||"—"}</td>
                                <td style={{padding:"8px 10px",color:T.green,fontWeight:700,whiteSpace:"nowrap"}}>{fmt(n.valor)}</td>
                                <td style={{padding:"8px 10px",color:T.text}}>{n.prestador||"—"}</td>
                                <td style={{padding:"8px 10px",color:T.text}}>{n.tomador||"—"}</td>
                                <td style={{padding:"8px 10px",color:T.textSub,maxWidth:"140px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.descricao||"—"}</td>
                                <td style={{padding:"8px 10px"}}>
                                  <div style={{display:"flex",gap:"4px"}}>
                                    <button style={editB} onClick={()=>setEditNF({...n})}>✏️</button>
                                    <button style={remB} onClick={()=>{if(confirm("Remover esta NF?"))removeNF(n.id);}}>✕</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── VISÃO MENSAL ── */}
              {meiTab==="mensal"&&(
                <div>
                  <div style={{...card({marginBottom:"14px"}),padding:"12px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
                      <label style={{fontSize:"13px",fontWeight:600,color:T.text}}>Competência:</label>
                      <input type="month" style={{...inpS,width:"160px"}} value={meiVisualMonth} onChange={e=>setMeiVisualMonth(e.target.value)}/>
                    </div>
                  </div>

                  {/* Gráfico barras por MEI */}
                  <div style={card()}>
                    <p style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"12px"}}>📊 Faturamento — {meiVisualMonth.replace("-","/")} </p>
                    <div style={{display:"flex",gap:"16px",alignItems:"flex-end",height:"160px",marginBottom:"8px",padding:"0 8px"}}>
                      {meis.map(m=>{
                        const fat=faturadoMes(m.id,meiVisualMonth);
                        const limMes=getLimiteEfetivo(m,meiViewYear)/12;
                        const pct=Math.min(100,(fat/limMes)*100);
                        return(
                          <div key={m.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
                            <span style={{fontSize:"12px",fontWeight:700,color:pct>90?T.red:m.cor}}>{fmt(fat)}</span>
                            <div style={{width:"100%",height:"120px",background:T.surfaceAlt,borderRadius:"6px 6px 0 0",border:`1px solid ${T.border}`,display:"flex",alignItems:"flex-end"}}>
                              <div style={{width:"100%",height:`${pct}%`,background:pct>90?T.red:pct>70?T.amber:m.cor,borderRadius:"4px 4px 0 0",minHeight:pct>0?"4px":"0",transition:"height 0.4s"}}/>
                            </div>
                            <span style={chip(m.cor)}>{m.nome}</span>
                            <span style={{fontSize:"10px",color:T.textSub}}>{pct.toFixed(1)}% do limite</span>
                          </div>
                        );
                      })}
                      {/* Linha limite */}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"4px"}}>
                      <div style={{width:"20px",height:"2px",background:T.amber,borderStyle:"dashed"}}/>
                      <span style={{fontSize:"11px",color:T.amber}}>Limite mensal ideal: {fmt(LIMITE_MEI_MENSAL)}/mês</span>
                    </div>
                  </div>

                  {/* Tabela mês a mês */}
                  <div style={card()}>
                    <p style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"12px"}}>📅 Faturamento mês a mês — {CY}</p>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                        <thead>
                          <tr style={{background:T.surfaceAlt}}>
                            <th style={{padding:"8px 10px",textAlign:"left",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Mês</th>
                            {meis.map(m=><th key={m.id} style={{padding:"8px 10px",textAlign:"right",color:m.cor,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{m.nome}</th>)}
                            <th style={{padding:"8px 10px",textAlign:"right",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({length:12},(_,i)=>{
                            const comp=CY_STR+"-"+String(i+1).padStart(2,"0");
                            const vals=meis.map(m=>faturadoMes(m.id,comp));
                            const total=vals.reduce((s,v)=>s+v,0);
                            const isSelected=comp===meiVisualMonth;
                            return(
                              <tr key={i} style={{background:isSelected?T.purpleLight:"transparent",cursor:"pointer"}} onClick={()=>setMeiVisualMonth(comp)}>
                                <td style={{padding:"8px 10px",fontWeight:isSelected?700:400,color:isSelected?T.purple:T.text}}>{MONTHS[i]}</td>
                                {vals.map((v,j)=>{
                                  const lim=meis[j].limiteAnual/12;
                                  const pct=lim>0?(v/lim)*100:0;
                                  return(
                                    <td key={j} style={{padding:"8px 10px",textAlign:"right"}}>
                                      {v>0?(
                                        <div>
                                          <span style={{color:pct>100?T.red:meis[j].cor,fontWeight:600}}>{fmt(v)}</span>
                                          <div style={{height:3,background:T.surfaceAlt,borderRadius:2,marginTop:"2px",minWidth:"60px"}}>
                                            <div style={{height:3,width:`${Math.min(100,pct)}%`,background:pct>100?T.red:pct>80?T.amber:meis[j].cor,borderRadius:2}}/>
                                          </div>
                                        </div>
                                      ):"—"}
                                    </td>
                                  );
                                })}
                                <td style={{padding:"8px 10px",textAlign:"right",fontWeight:total>0?700:400,color:total>0?T.text:T.textMuted}}>{total>0?fmt(total):"—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{borderTop:`2px solid ${T.borderStrong}`,background:T.surfaceAlt}}>
                            <td style={{padding:"8px 10px",fontWeight:700}}>TOTAL {CY}</td>
                            {meis.map(m=><td key={m.id} style={{padding:"8px 10px",textAlign:"right",color:m.cor,fontWeight:700}}>{fmt(faturadoAno(m.id))}</td>)}
                            <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:T.text}}>{fmt(meis.reduce((s,m)=>s+faturadoAno(m.id),0))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* NFs do mês selecionado */}
                  {meis.some(m=>notasMes(m.id,meiVisualMonth).length>0)&&(
                    <div style={card()}>
                      <p style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"12px"}}>🧾 NFs de {meiVisualMonth.replace("-","/")} </p>
                      {meis.map(m=>{
                        const nfs=notasMes(m.id,meiVisualMonth);
                        if(nfs.length===0)return null;
                        return(
                          <div key={m.id} style={{marginBottom:"12px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                              <span style={chip(m.cor)}>{m.nome}</span>
                              <span style={{fontSize:"12px",color:T.textSub}}>{nfs.length} NF(s) • Total: <strong style={{color:m.cor}}>{fmt(nfs.reduce((s,n)=>s+n.valor,0))}</strong></span>
                            </div>
                            {nfs.map(n=>(
                              <div key={n.id} style={{...itemRow,marginLeft:"8px"}}>
                                <div>
                                  <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                                    {n.numeroNF&&<span style={{...chip(T.purple),fontSize:"10px"}}>NF {n.numeroNF}</span>}
                                    <span style={{fontSize:"13px",fontWeight:500,color:T.text}}>{n.tomador||n.descricao||"—"}</span>
                                  </div>
                                  {n.descricao&&<p style={{fontSize:"11px",color:T.textSub,margin:"2px 0 0"}}>{n.descricao}</p>}
                                </div>
                                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                                  <span style={{color:m.cor,fontWeight:700,fontSize:"14px"}}>{fmt(n.valor)}</span>
                                  <button style={remB} onClick={()=>removeNF(n.id)}>✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── VISÃO ANUAL ── */}
              {meiTab==="anual"&&(
                <div>
                  {/* Seletor de ano próprio do MEI */}
                  <div style={{...card({marginBottom:"14px",padding:"12px 16px"}),background:T.purpleLight,border:`1px solid #DDD6FE`}}>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <button style={{...btnG,padding:"5px 12px"}} onClick={()=>setMeiViewYear(y=>y-1)}>‹</button>
                        <span style={{fontSize:"16px",fontWeight:700,color:T.purple,minWidth:"50px",textAlign:"center"}}>{meiViewYear}</span>
                        <button style={{...btnG,padding:"5px 12px"}} onClick={()=>setMeiViewYear(y=>y+1)}>›</button>
                        {isPastYear&&<span style={{...chip(T.amber),fontSize:"11px"}}>Ano concluído</span>}
                      </div>
                      {anosDisponiveis.length>0&&(
                        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                          {anosDisponiveis.map(ano=>(
                            <button key={ano} style={{...subT(String(meiViewYear)===ano),fontSize:"11px",padding:"4px 12px"}} onClick={()=>setMeiViewYear(Number(ano))}>{ano}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Alert projeção */}
                  {meis.some(m=>projecaoAnual(m.id)>getLimiteEfetivo(m,meiViewYear))&&(
                    <div style={{background:T.redLight,border:"1px solid #FECACA",borderRadius:"10px",padding:"12px 16px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"12px"}}>
                      <span style={{fontSize:"22px"}}>🚨</span>
                      <div>
                        <p style={{color:T.red,fontWeight:700,fontSize:"13px",margin:0}}>Projeção acima do limite MEI!</p>
                        <p style={{color:"#B91C1C",fontSize:"12px",margin:"2px 0 0"}}>
                          {meis.filter(m=>projecaoAnual(m.id)>getLimiteEfetivo(m,meiViewYear)).map(m=>`${m.nome}: projeção ${fmt(projecaoAnual(m.id))} (limite ${fmt(getLimiteEfetivo(m,meiViewYear))})`).join(" • ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cards por MEI */}
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:"14px",marginBottom:"14px"}}>
                    {meis.map(m=>{
                      const fatAno=faturadoAno(m.id);
                      const limAnual=getLimiteEfetivo(m,meiViewYear);
                      const proj=projecaoAnual(m.id);
                      const restante=restanteLimite(m.id);
                      const mediaSeg=mediaMensalSegura(m.id);
                      const pctAnual=(fatAno/limAnual)*100;
                      const projAcima=proj>limAnual;
                      return(
                        <div key={m.id} style={{...card({marginBottom:0}),border:`1px solid ${m.cor}30`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                            <span style={{...chip(m.cor),fontSize:"13px"}}>{m.nome}</span>
                            {projAcima&&<span style={{...chip(T.red),fontSize:"10px"}}>⚠️ Projeção acima</span>}
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
                            <div style={{background:T.surfaceAlt,borderRadius:"8px",padding:"10px"}}>
                              <p style={{fontSize:"10px",color:T.textSub,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Faturado</p>
                              <p style={{fontSize:"18px",fontWeight:700,color:m.cor,margin:0}}>{fmt(fatAno)}</p>
                            </div>
                            <div style={{background:T.surfaceAlt,borderRadius:"8px",padding:"10px"}}>
                              <p style={{fontSize:"10px",color:T.textSub,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Restante</p>
                              <p style={{fontSize:"18px",fontWeight:700,color:restante>0?T.green:T.red,margin:0}}>{fmt(restante)}</p>
                            </div>
                            <div style={{background:T.surfaceAlt,borderRadius:"8px",padding:"10px"}}>
                              <p style={{fontSize:"10px",color:T.textSub,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{isPastYear?"Total Realizado":"Projeção Anual"}</p>
                              <p style={{fontSize:"16px",fontWeight:700,color:isPastYear?m.cor:projAcima?T.red:T.text,margin:0}}>{isPastYear?fmt(fatAno):proj>0?fmt(proj):"—"}</p>
                            </div>
                            <div style={{background:T.surfaceAlt,borderRadius:"8px",padding:"10px"}}>
                              <p style={{fontSize:"10px",color:T.textSub,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.06em"}}>{isPastYear?"Meses com NF":"Média Segura/mês"}</p>
                              <p style={{fontSize:"16px",fontWeight:700,color:T.green,margin:0}}>{isPastYear?`${mesesComDados(m.id)} meses`:mediaSeg>0?fmt(mediaSeg):"—"}</p>
                            </div>
                          </div>
                          <div>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"4px"}}>
                              <span style={{color:T.textSub}}>{pctAnual.toFixed(1)}% do limite anual</span>
                              <span style={{color:T.textSub}}>
                                Limite: {fmt(limAnual)}
                                {m.dataAbertura&&new Date(m.dataAbertura+"T12:00:00").getFullYear()===meiViewYear&&(
                                  <span style={{color:T.amber,marginLeft:"4px",fontSize:"10px"}}>⚠️ proporcional</span>
                                )}
                              </span>
                            </div>
                            <div style={{height:10,background:T.surfaceAlt,borderRadius:6,border:`1px solid ${T.border}`}}>
                              <div style={{height:10,width:`${Math.min(100,pctAnual)}%`,background:pctAnual>90?T.red:pctAnual>70?T.amber:m.cor,borderRadius:6,transition:"width 0.5s"}}/>
                            </div>
                            {proj>0&&proj>fatAno&&(
                              <div style={{marginTop:"3px",fontSize:"10px",color:projAcima?T.red:T.amber}}>
                                📈 Projeção: {((proj/limAnual)*100).toFixed(1)}% do limite
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card família consolidado */}
                  {meis.length>1&&(()=>{
                    const totalFam=meis.reduce((s,m)=>s+faturadoAno(m.id),0);
                    const limFam=meis.reduce((s,m)=>s+getLimiteEfetivo(m,meiViewYear),0);
                    const pctFam=(totalFam/limFam)*100;
                    return(
                      <div style={{...card({marginBottom:"14px"}),background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)",border:"1px solid #BBF7D0"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                          <p style={{fontSize:"14px",fontWeight:700,color:T.green,margin:0}}>🏠 Consolidado Família</p>
                          <span style={{fontSize:"13px",color:T.textSub}}>Limite total: {fmt(limFam)}</span>
                        </div>
                        <p style={{fontSize:"28px",fontWeight:700,color:T.green,margin:"0 0 8px"}}>{fmt(totalFam)}</p>
                        <div style={{height:12,background:"rgba(255,255,255,0.6)",borderRadius:6,border:"1px solid #BBF7D0",overflow:"hidden",display:"flex",width:"100%"}}>
                          {meis.map(m=>{
                            const w=limFam>0?Math.min(100,(faturadoAno(m.id)/limFam)*100):0;
                            return w>0?<div key={m.id} style={{height:"12px",width:`${w}%`,background:m.cor,flexShrink:0}}/>:null;
                          })}
                        </div>
                        <div style={{display:"flex",gap:"12px",marginTop:"6px",flexWrap:"wrap"}}>
                          {meis.map(m=><span key={m.id} style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"11px",color:T.textSub}}><span style={{width:8,height:8,borderRadius:2,background:m.cor,display:"inline-block"}}/>{m.nome}: {fmt(faturadoAno(m.id))}</span>)}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Histórico por ano */}
                  {anosDisponiveis.length>0&&(
                    <div style={card()}>
                      <p style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"12px"}}>📋 Histórico por Ano</p>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                          <thead>
                            <tr style={{background:T.surfaceAlt}}>
                              <th style={{padding:"8px 12px",textAlign:"left",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Ano</th>
                              {meis.map(m=><th key={m.id} style={{padding:"8px 12px",textAlign:"right",color:m.cor,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{m.nome}</th>)}
                              <th style={{padding:"8px 12px",textAlign:"right",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Total Família</th>
                              <th style={{padding:"8px 12px",textAlign:"right",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>Limite Usado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {anosDisponiveis.map(ano=>{
                              const vals=meis.map(m=>faturadoAnoEspecifico(m.id,Number(ano)));
                              const totalFam=vals.reduce((s,v)=>s+v,0);
                              const limFamAno=meis.reduce((s,m)=>s+getLimiteEfetivo(m,Number(ano)),0);
                              const pct=limFamAno>0?(totalFam/limFamAno)*100:0;
                              const isViewing=String(meiViewYear)===ano;
                              return(
                                <tr key={ano} style={{background:isViewing?T.purpleLight:"transparent",cursor:"pointer"}} onClick={()=>setMeiViewYear(Number(ano))}>
                                  <td style={{padding:"8px 12px",fontWeight:700,color:isViewing?T.purple:T.text}}>
                                    {ano}{isViewing&&<span style={{fontSize:"10px",background:T.purple,color:"#fff",borderRadius:"10px",padding:"1px 6px",marginLeft:"6px"}}>atual</span>}
                                  </td>
                                  {vals.map((v,i)=>(
                                    <td key={i} style={{padding:"8px 12px",textAlign:"right",color:meis[i].cor,fontWeight:v>0?600:400}}>{v>0?fmt(v):"—"}</td>
                                  ))}
                                  <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:T.text}}>{fmt(totalFam)}</td>
                                  <td style={{padding:"8px 12px",textAlign:"right"}}>
                                    <div style={{display:"flex",alignItems:"center",gap:"8px",justifyContent:"flex-end"}}>
                                      <div style={{width:"60px",height:4,background:T.surfaceAlt,borderRadius:2,border:`1px solid ${T.border}`}}>
                                        <div style={{height:4,width:`${Math.min(100,pct)}%`,background:pct>100?T.red:pct>80?T.amber:T.green,borderRadius:2}}/>
                                      </div>
                                      <span style={{color:pct>100?T.red:pct>80?T.amber:T.green,fontWeight:600}}>{pct.toFixed(1)}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Gráfico linha comparativo */}
                  <div style={card()}>
                    <p style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"12px"}}>📈 Evolução Comparativa — {meiViewYear}</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={mesesChart} margin={{top:5,right:5,bottom:0,left:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                        <XAxis dataKey="name" tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                        <YAxis tickFormatter={fmtK} tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false}/>
                        <Tooltip content={<CT/>}/>
                        {meis.map(m=><Bar key={m.id} dataKey={m.nome} fill={m.cor} radius={[3,3,0,0]}/>)}
                        <ReferenceLine y={LIMITE_MEI_MENSAL} stroke={T.amber} strokeDasharray="4 4" label={{value:`Limite ${fmtK(LIMITE_MEI_MENSAL)}`,fill:T.amber,fontSize:10,position:"right"}}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── CONFIG ── */}
              {meiTab==="config"&&(
                <div>
                  <div style={card()}>
                    <p style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"14px"}}>⚙️ MEIs Cadastrados</p>
                    {meis.map((m,i)=>(
                      <div key={m.id} style={{...itemRow,flexDirection:"column",alignItems:"stretch",marginBottom:"10px"}}>
                        {editMei?.id===m.id?(
                          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"10px"}}>
                            <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Nome</label><input style={inpS} value={editMei.nome} onChange={e=>setEditMei(em=>({...em,nome:e.target.value}))}/></div>
                            <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Data de Abertura</label><input type="date" style={inpS} value={editMei.dataAbertura||""} onChange={e=>setEditMei(em=>({...em,dataAbertura:e.target.value}))}/></div>
                            <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>CNPJ</label><input style={inpS} placeholder="00.000.000/0001-00" value={editMei.cnpj||""} onChange={e=>setEditMei(em=>({...em,cnpj:e.target.value}))}/></div>
                            <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Cor</label>
                              <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                                <input type="color" value={editMei.cor} onChange={e=>setEditMei(em=>({...em,cor:e.target.value}))} style={{width:"36px",height:"36px",borderRadius:"8px",border:`1px solid ${T.border}`,cursor:"pointer",padding:"2px"}}/>
                                <span style={{fontSize:"12px",color:T.textSub}}>{editMei.cor}</span>
                              </div>
                            </div>
                            <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Limite Anual (R$)</label><input type="number" style={inpS} value={editMei.limiteAnual} onChange={e=>setEditMei(em=>({...em,limiteAnual:parseFloat(e.target.value)||0}))}/></div>
                            <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Tipo</label>
                              <select style={selS} value={editMei.tipo} onChange={e=>setEditMei(em=>({...em,tipo:e.target.value}))}>
                                <option value="servicos">Serviços</option>
                                <option value="comercio">Comércio</option>
                                <option value="ambos">Serviços + Comércio</option>
                              </select>
                            </div>
                            <div style={{gridColumn:"span 2",display:"flex",gap:"8px",alignItems:"flex-end",paddingBottom:"2px"}}>
                              <button style={btnP(T.green)} onClick={()=>{setMeiData(d=>({...d,meis:d.meis.map(mm=>mm.id===editMei.id?editMei:mm)}));setEditMei(null);showToast("MEI atualizado!");}}>✅ Salvar</button>
                              <button style={btnG} onClick={()=>setEditMei(null)}>Cancelar</button>
                            </div>
                          </div>
                        ):(
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                              <div style={{width:"14px",height:"14px",borderRadius:"50%",background:m.cor,flexShrink:0}}/>
                              <div>
                                <p style={{fontSize:"14px",fontWeight:600,color:T.text,margin:0}}>{m.nome}</p>
                                <p style={{fontSize:"12px",color:T.textSub,margin:0}}>
                                {(()=>{const le=getLimiteEfetivo(m,currentYear);const isDiff=le!==(m.limiteAnual||LIMITE_MEI_ANUAL);return<>Limite: {isDiff?<><span style={{textDecoration:"line-through",color:T.textMuted}}>{fmt(m.limiteAnual||LIMITE_MEI_ANUAL)}</span><span style={{color:T.amber,marginLeft:"4px",fontWeight:700}}>{fmt(le)} (proporcional)</span></>:fmt(m.limiteAnual||LIMITE_MEI_ANUAL)} • {m.tipo==="servicos"?"Serviços":m.tipo==="comercio"?"Comércio":"Serv+Com"}{m.cnpj&&<span style={{color:T.textMuted,marginLeft:"8px"}}>• CNPJ: {m.cnpj}</span>}</>;})()}
                                {m.dataAbertura&&<span style={{color:T.blue,marginLeft:"8px"}}>• Abertura: {m.dataAbertura}</span>}
                              </p>
                              {m.dataAbertura&&(()=>{
                                const aberturaDate=new Date(m.dataAbertura+"T12:00:00");
                                const anoAbertura=aberturaDate.getFullYear();
                                if(anoAbertura===currentYear){
                                  const mesAbertura=aberturaDate.getMonth();
                                  const mesesAtivos=12-mesAbertura;
                                  const limiteProp=(m.limiteAnual/12)*mesesAtivos;
                                  return <p style={{fontSize:"11px",color:T.amber,margin:"2px 0 0"}}>⚠️ Ano de abertura: limite proporcional = {fmt(limiteProp)} ({mesesAtivos} meses ativos)</p>;
                                }
                                return null;
                              })()}
                              </div>
                            </div>
                            <button style={editB} onClick={()=>setEditMei({...m})}>✏️ Editar</button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{marginTop:"14px",paddingTop:"14px",borderTop:`1px solid ${T.border}`}}>
                      <p style={{fontSize:"12px",fontWeight:600,color:T.textSub,marginBottom:"10px"}}>➕ Adicionar novo MEI</p>
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"10px"}}>
                        <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Nome</label><input style={inpS} placeholder="Ex: Maria" id="meiNomeNew"/></div>
                        <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Cor</label><input type="color" defaultValue="#7C3AED" id="meiCorNew" style={{width:"36px",height:"36px",borderRadius:"8px",border:`1px solid ${T.border}`,cursor:"pointer",padding:"2px"}}/></div>
                        <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Limite Anual</label><input type="number" style={inpS} placeholder="81000" id="meiLimNew"/></div>
                      </div>
                      <button style={{...btnP(T.purple),marginTop:"10px"}} onClick={()=>{
                        const nome=document.getElementById("meiNomeNew")?.value;
                        const cor=document.getElementById("meiCorNew")?.value||"#7C3AED";
                        const lim=parseFloat(document.getElementById("meiLimNew")?.value)||81000;
                        if(!nome){showToast("Informe o nome","error");return;}
                        setMeiData(d=>({...d,meis:[...d.meis,{id:uid(),nome,cor,limiteAnual:lim,tipo:"servicos"}]}));
                        showToast("MEI adicionado!");
                      }}>+ Adicionar MEI</button>
                    </div>
                  </div>

                  {/* DAS-MEI info card */}
                  <div style={{...card({marginBottom:0}),background:T.blueLight,border:"1px solid #BAE6FD"}}>
                    <p style={{fontSize:"14px",fontWeight:700,color:T.blue,marginBottom:"12px"}}>💡 DAS-MEI 2026 — Valores de Referência</p>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"10px"}}>
                      {[
                        {label:"Limite Anual MEI",valor:"R$ 81.000,00",desc:"Faturamento máximo permitido"},
                        {label:"Limite Mensal Ideal",valor:"R$ 6.750,00",desc:"81.000 ÷ 12 meses"},
                        {label:"INSS (5% salário mínimo)",valor:"R$ 75,90",desc:"Contribuição previdenciária"},
                        {label:"ISS — Serviços",valor:"R$ 5,00",desc:"Imposto Sobre Serviços"},
                        {label:"ICMS — Comércio",valor:"R$ 1,00",desc:"Imposto sobre circulação"},
                        {label:"DAS Total (Serviços)",valor:"R$ 80,90",desc:"INSS + ISS"},
                      ].map(item=>(
                        <div key={item.label} style={{background:T.surface,borderRadius:"8px",padding:"12px",border:`1px solid ${T.border}`}}>
                          <p style={{fontSize:"11px",color:T.textSub,margin:"0 0 4px"}}>{item.label}</p>
                          <p style={{fontSize:"16px",fontWeight:700,color:T.blue,margin:"0 0 2px"}}>{item.valor}</p>
                          <p style={{fontSize:"10px",color:T.textMuted,margin:0}}>{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <p style={{fontSize:"11px",color:"#0369A1",marginTop:"10px",fontStyle:"italic"}}>* Valores baseados no salário mínimo de R$ 1.518,00. Verifique os valores atualizados na Receita Federal.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── BUSCAR ── */}
        {activeSection==="buscar"&&(()=>{
          // Coleta todos os itens de todos os anos e meses
          const allItems = [];
          Object.entries(allYearsData).forEach(([yr, meses]) => {
            if(!Array.isArray(meses)) return;
            meses.forEach((m, mi) => {
              ["receitas","despesas","investimentos","emprestimos"].forEach(tipo => {
                (m[tipo]||[]).forEach(item => {
                  allItems.push({ ...item, tipo, year: Number(yr), monthIdx: mi, monthName: MONTHS[mi] });
                });
              });
            });
          });

          // Agrupa por groupId (parcelado/recorrente) ou por item individual
          const groups = {};
          allItems.forEach(item => {
            const gid = item.parcelaGroupId || item.recorrenteGroupId || item.id;
            if(!groups[gid]) groups[gid] = { gid, items: [], tipo: item.tipo, isParcelado: !!item.parcelaGroupId, isRecorrente: !!item.recorrenteGroupId };
            groups[gid].items.push(item);
          });

          // Filtro de busca
          const q = searchQuery.toLowerCase().trim();
          const filtered = Object.values(groups).filter(g => {
            if(!q) return false;
            const ref = g.items[0];
            return (
              (ref.desc||"").toLowerCase().includes(q) ||
              (ref.fornecedor||"").toLowerCase().includes(q) ||
              (ref.cliente||"").toLowerCase().includes(q) ||
              (ref.tomador||"").toLowerCase().includes(q) ||
              (ref.prestador||"").toLowerCase().includes(q) ||
              (ref.parafem||"").toLowerCase().includes(q) ||
              (ref.ref||"").toLowerCase().includes(q) ||
              (ref.banco||"").toLowerCase().includes(q)
            );
          }).sort((a,b) => {
            const da = a.items[0]; const db = b.items[0];
            return (db.year - da.year) || (db.monthIdx - da.monthIdx);
          });

          const tipoLabel = { receitas:"Receita", despesas:"Despesa", investimentos:"Investimento", emprestimos:"Empréstimo" };
          const tipoCol = { receitas:T.green, despesas:T.red, investimentos:T.blue, emprestimos:T.amber };
          const statusField = { receitas:"recebido", despesas:"pago", investimentos:"investido", emprestimos:"pago" };

          return (
            <div>
              {/* Search bar */}
              <div style={{...card({marginBottom:"16px"}),padding:"16px 20px"}}>
                <p style={{fontSize:"13px",color:T.textSub,marginBottom:"10px"}}>🔍 Pesquise por descrição, fornecedor, cliente, banco, referência...</p>
                <input
                  style={{...inpS,fontSize:"15px",padding:"12px 16px"}}
                  placeholder="Ex: Casas da Água, Caixa, Maquiagens, Nubank..."
                  value={searchQuery}
                  onChange={e=>setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery&&<p style={{fontSize:"12px",color:T.textSub,marginTop:"8px"}}>{filtered.length} resultado(s) encontrado(s)</p>}
              </div>

              {/* Empty state */}
              {!searchQuery&&(
                <div style={{...card(),textAlign:"center",padding:"40px 20px"}}>
                  <p style={{fontSize:"40px",marginBottom:"12px"}}>🔍</p>
                  <p style={{fontSize:"15px",fontWeight:600,color:T.text,marginBottom:"6px"}}>Busca de Lançamentos</p>
                  <p style={{fontSize:"13px",color:T.textSub,maxWidth:"400px",margin:"0 auto"}}>Digite o nome de uma despesa, fornecedor, cliente ou referência para ver o ciclo completo de pagamentos — parcelas pagas, pendentes e quanto falta.</p>
                </div>
              )}

              {/* No results */}
              {searchQuery&&filtered.length===0&&(
                <div style={{...card(),textAlign:"center",padding:"32px 20px"}}>
                  <p style={{fontSize:"32px",marginBottom:"8px"}}>😶</p>
                  <p style={{fontSize:"14px",color:T.textSub}}>Nenhum resultado para <strong>"{searchQuery}"</strong></p>
                </div>
              )}

              {/* Results */}
              {filtered.map(group => {
                const ref = group.items[0];
                const col = tipoCol[group.tipo] || T.purple;
                const sf = statusField[group.tipo] || "pago";
                const sorted = [...group.items].sort((a,b) => (a.year-b.year)||(a.monthIdx-b.monthIdx)||(a.parcelaNum||0)-(b.parcelaNum||0));
                const totalPago = sorted.filter(i=>i[sf]).length;
                const totalPendente = sorted.length - totalPago;
                const valorTotal = group.isParcelado ? (ref.valorTotal||ref.valor*sorted.length) : sorted.reduce((s,i)=>s+i.valor,0);
                const valorPago = sorted.filter(i=>i[sf]).reduce((s,i)=>s+i.valor,0);
                const valorPendente = sorted.filter(i=>!i[sf]).reduce((s,i)=>s+i.valor,0);
                const ultimaParcela = sorted[sorted.length-1];
                const proximaPendente = sorted.find(i=>!i[sf]);

                return (
                  <div key={group.gid} style={{...card(),border:`1px solid ${col}25`,marginBottom:"12px"}}>
                    {/* Header */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                          <h3 style={{fontSize:"15px",fontWeight:700,color:T.text,margin:0}}>{ref.desc}</h3>
                          <span style={chip(col)}>{tipoLabel[group.tipo]}</span>
                          {group.isParcelado&&<span style={{...chip(T.amber),fontSize:"10px"}}>🔢 Parcelado</span>}
                          {group.isRecorrente&&<span style={{...chip(T.purple),fontSize:"10px"}}>🔁 Recorrente</span>}
                        </div>
                        <div style={{display:"flex",gap:"10px",marginTop:"4px",flexWrap:"wrap"}}>
                          {ref.fornecedor&&<span style={{fontSize:"12px",color:T.textSub}}>🏢 {ref.fornecedor}</span>}
                          {ref.cliente&&<span style={{fontSize:"12px",color:T.textSub}}>👤 {ref.cliente}</span>}
                          {ref.parafem&&<span style={{fontSize:"12px",color:T.textSub}}>↔ {ref.parafem}</span>}
                          {ref.banco&&<span style={{fontSize:"12px",color:T.textSub}}>🏦 {ref.banco}</span>}
                          {ref.meioPag&&<span style={{fontSize:"12px",color:T.blue}}>{({pix:"PIX",dinheiro:"Dinheiro",cheque:"Cheque",boleto:"Boleto",cartao:"Cartão"})[ref.meioPag]||ref.meioPag}</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <p style={{fontSize:"20px",fontWeight:700,color:col,margin:0}}>{fmt(valorTotal)}</p>
                        <p style={{fontSize:"11px",color:T.textSub,margin:0}}>valor total</p>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(3,1fr)",gap:"6px",marginBottom:"14px"}}>
                      <div style={{background:T.greenLight,borderRadius:"8px",padding:"10px",border:"1px solid #BBF7D0"}}>
                        <p style={{fontSize:"10px",color:T.green,fontWeight:600,textTransform:"uppercase",margin:"0 0 3px"}}>✓ {sf==="recebido"?"Recebido":"Pago"}</p>
                        <p style={{fontSize:"16px",fontWeight:700,color:T.green,margin:0}}>{fmt(valorPago)}</p>
                        <p style={{fontSize:"11px",color:T.textSub,margin:"2px 0 0"}}>{totalPago} de {sorted.length} {group.isParcelado?"parcelas":"meses"}</p>
                      </div>
                      <div style={{background:totalPendente>0?T.amberLight:T.greenLight,borderRadius:"8px",padding:"10px",border:`1px solid ${totalPendente>0?"#FDE68A":"#BBF7D0"}`}}>
                        <p style={{fontSize:"10px",color:totalPendente>0?T.amber:T.green,fontWeight:600,textTransform:"uppercase",margin:"0 0 3px"}}>{totalPendente>0?"⏳ Pendente":"✓ Quitado"}</p>
                        <p style={{fontSize:"16px",fontWeight:700,color:totalPendente>0?T.amber:T.green,margin:0}}>{totalPendente>0?fmt(valorPendente):"R$ 0,00"}</p>
                        <p style={{fontSize:"11px",color:T.textSub,margin:"2px 0 0"}}>{totalPendente} restante(s)</p>
                      </div>
                      <div style={{background:T.surfaceAlt,borderRadius:"8px",padding:"10px",border:`1px solid ${T.border}`}}>
                        <p style={{fontSize:"10px",color:T.textSub,fontWeight:600,textTransform:"uppercase",margin:"0 0 3px"}}>📅 Período</p>
                        <p style={{fontSize:"12px",fontWeight:600,color:T.text,margin:0}}>{sorted[0].monthName}/{sorted[0].year}</p>
                        <p style={{fontSize:"11px",color:T.textSub,margin:"1px 0 0"}}>até {ultimaParcela.monthName}/{ultimaParcela.year}</p>
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div style={{marginBottom:"12px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"4px"}}>
                        <span style={{color:T.textSub}}>Progresso</span>
                        <span style={{color:col,fontWeight:600}}>{sorted.length>0?Math.round((totalPago/sorted.length)*100):0}% {sf==="recebido"?"recebido":"pago"}</span>
                      </div>
                      <div style={{height:8,background:T.surfaceAlt,borderRadius:6,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                        <div style={{height:8,width:`${sorted.length>0?(totalPago/sorted.length)*100:0}%`,background:totalPendente===0?T.green:col,borderRadius:6,transition:"width 0.5s"}}/>
                      </div>
                      {proximaPendente&&<p style={{fontSize:"11px",color:T.amber,margin:"5px 0 0"}}>⏰ Próxima pendente: <strong>{proximaPendente.monthName}/{proximaPendente.year}</strong> — {fmt(proximaPendente.valor)}</p>}
                      {totalPendente===0&&<p style={{fontSize:"11px",color:T.green,margin:"5px 0 0"}}>✅ Totalmente {sf==="recebido"?"recebido":"quitado"}!</p>}
                    </div>

                    {/* Timeline de parcelas */}
                    <div>
                      <p style={{fontSize:"11px",fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"8px"}}>Timeline</p>
                      <div style={{display:"flex",gap:"4px",flexWrap:"wrap",overflowX:isMobile?"auto":"visible",paddingBottom:isMobile?"4px":"0"}}>
                        {sorted.map((item,idx) => {
                          const isPg = !!item[sf];
                          return (
                            <div key={item.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",minWidth:"52px"}}>
                              <div style={{width:"44px",height:"44px",borderRadius:"10px",background:isPg?T.greenLight:item.year===currentYear&&item.monthIdx===currentMonth?"#FFFBEB":T.surfaceAlt,border:`1.5px solid ${isPg?"#BBF7D0":item.year===currentYear&&item.monthIdx===currentMonth?T.amber:T.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
                                onClick={()=>{setCurrentYear(item.year);setCurrentMonth(item.monthIdx);setActiveSection("lancamentos");setLancTab(group.tipo==="receitas"?"receita":group.tipo==="despesas"?"despesa":group.tipo==="investimentos"?"investimento":"emprestimo");}}>
                                <span style={{fontSize:"9px",fontWeight:600,color:isPg?T.green:T.textSub}}>{MS[item.monthIdx]}</span>
                                <span style={{fontSize:"8px",color:T.textMuted}}>{item.year}</span>
                                <span style={{fontSize:"13px"}}>{isPg?"✓":"○"}</span>
                              </div>
                              {group.isParcelado&&<span style={{fontSize:"9px",color:T.textMuted}}>{item.parcelaNum}/{item.parcelas}</span>}
                              <span style={{fontSize:"9px",color:col,fontWeight:600}}>{fmt(item.valor).replace("R$","").trim()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── SINCRONIZAR ── */}
        {activeSection==="sincronizar"&&(
          <div style={{maxWidth:"680px"}}>
            <div style={card()}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
                <span style={{background:T.purple,color:"#fff",borderRadius:"50%",width:"24px",height:"24px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,flexShrink:0}}>1</span>
                <p style={{fontSize:"15px",fontWeight:600,color:T.text,margin:0}}>URL do Apps Script</p>
              </div>
              <p style={{color:T.textSub,fontSize:"13px",marginBottom:"12px"}}>Cole o arquivo <strong>google-apps-script.js</strong> no Google Apps Script e implante como App da Web.</p>
              <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
                <input style={{...inpS,flex:1}} placeholder="https://script.google.com/macros/s/..." value={syncUrl} onChange={e=>setSyncUrl(e.target.value)}/>
                <button style={btnP(T.green)} onClick={async()=>{try{await saveToSupa({allYearsData:{...allYearsData,[String(currentYear)]:safeData},cartoes,uso_cartoes:usoCartoes,pagamentos,sync_url:syncUrl,cadastros});showToast("URL salva!");}catch(_){showToast("Erro","error");}}}>Salvar</button>
              </div>
              <button style={btnO(T.purple)} onClick={async()=>{if(!syncUrl){setSyncStatus({ok:false,msg:"Cole a URL primeiro"});return;}setSyncing(true);try{const r=await fetch(`${syncUrl}?action=test`);const j=await r.json();setSyncStatus({ok:true,msg:j.message||"✅ Conexão OK!"});}catch{setSyncStatus({ok:false,msg:"❌ Erro de conexão"});}setSyncing(false);}}>
                {syncing?"⏳ Testando...":"📡 Testar conexão"}
              </button>
              {syncStatus&&<div style={{background:syncStatus.ok?T.greenLight:T.redLight,border:`1px solid ${syncStatus.ok?"#BBF7D0":"#FECACA"}`,borderRadius:"8px",padding:"10px 14px",marginTop:"10px",color:syncStatus.ok?T.green:T.red,fontSize:"13px"}}>{syncStatus.msg}</div>}
            </div>
            <div style={card()}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
                <span style={{background:T.purple,color:"#fff",borderRadius:"50%",width:"24px",height:"24px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,flexShrink:0}}>2</span>
                <p style={{fontSize:"15px",fontWeight:600,color:T.text,margin:0}}>Importar mês da planilha</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                <button style={btnG} onClick={()=>setSyncMonth(m=>Math.max(0,m-1))}>‹</button>
                <span style={{fontSize:"15px",fontWeight:600,color:T.text,minWidth:"130px",textAlign:"center"}}>{MONTHS[syncMonth]} {CY}</span>
                <button style={btnG} onClick={()=>setSyncMonth(m=>Math.min(11,m+1))}>›</button>
                <button style={btnP(T.blue)} onClick={lerDaPlanilha} disabled={syncing}>{syncing?"⏳ Importando...":"🔄 Ler da planilha"}</button>
              </div>
              {syncPreview&&(
                <div style={{background:T.surfaceAlt,border:`1.5px solid ${T.purple}`,borderRadius:"12px",padding:"16px",marginTop:"10px"}}>
                  <p style={{fontSize:"14px",fontWeight:700,color:T.purple,marginBottom:"12px"}}>🔍 Prévia — {MONTHS[syncPreview.month]} {CY}</p>
                  {syncPreview.receitas.length>0&&<div style={{marginBottom:"10px"}}>
                    <p style={{fontSize:"12px",fontWeight:700,color:T.green,marginBottom:"6px"}}>📥 Receitas ({syncPreview.receitas.length}) — {fmt(syncPreview.receitas.reduce((s,x)=>s+x.valor,0))}</p>
                    {syncPreview.receitas.map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"12px",padding:"4px 8px",background:T.greenLight,borderRadius:"6px",marginBottom:"3px"}}><span>{x.desc}</span><strong style={{color:T.green}}>{fmt(x.valor)}</strong></div>)}
                  </div>}
                  {syncPreview.despesas.length>0&&<div style={{marginBottom:"10px"}}>
                    <p style={{fontSize:"12px",fontWeight:700,color:T.red,marginBottom:"6px"}}>📤 Despesas ({syncPreview.despesas.length}) — {fmt(syncPreview.despesas.reduce((s,x)=>s+x.valor,0))}</p>
                    {syncPreview.despesas.map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"12px",padding:"4px 8px",background:T.redLight,borderRadius:"6px",marginBottom:"3px"}}><span>{x.desc}</span><strong style={{color:T.red}}>{fmt(x.valor)}</strong></div>)}
                  </div>}
                  <div style={{display:"flex",gap:"8px",marginTop:"14px"}}>
                    <button style={btnP(T.green)} onClick={confirmarImport}>✅ Confirmar e Salvar</button>
                    <button style={btnO(T.red)} onClick={()=>setSyncPreview(null)}>✕ Cancelar</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{...card({marginBottom:0}),background:T.blueLight,border:"1px solid #BAE6FD"}}>
              <p style={{fontSize:"14px",fontWeight:700,color:T.blue,marginBottom:"10px"}}>📋 Passo a passo</p>
              <ol style={{color:"#0369A1",fontSize:"13px",lineHeight:"1.8",paddingLeft:"18px",margin:0}}>
                <li>Abra sua planilha no <strong>Google Sheets</strong></li>
                <li>Menu: <strong>Extensões → Apps Script</strong></li>
                <li>Cole o conteúdo do arquivo <strong>google-apps-script.js</strong></li>
                <li><strong>Implantar → Nova implantação → App da Web</strong></li>
                <li>Executar como: <strong>Eu mesmo</strong> • Acesso: <strong>Qualquer pessoa</strong></li>
                <li>Copie a URL e cole acima</li>
              </ol>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"center",marginTop:"20px",paddingTop:"16px",borderTop:`1px solid ${T.border}`}}>
          <button style={btnP(T.green)} onClick={handleSave}>💾 Salvar</button>
          <button style={btnO(T.amber)} onClick={()=>setShowLote(true)}>📋 Lote</button>
          <button style={btnP(T.amber)} onClick={()=>{const b=new Blob([JSON.stringify({allYearsData,cartoes,usoCartoes,pagamentos,cadastros,mei_data:meiData},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`financas_${CY}.json`;a.click();showToast("Exportado!");}}>📤 Exportar</button>
          <button style={btnO(T.purple)} onClick={()=>setShowImport(true)}>📥 Importar</button>
          <button style={btnO(T.red)} onClick={()=>{if(!confirm("Resetar todos os dados?"))return;setData(emptyYear());setCartoes([]);setUsoCartoes([]);setPagamentos({});setCadastros(emptyCadastros());showToast("Resetado","error");}}>🗑 Reset</button>
        </div>
      </main>

      {/* MODAL LANÇAMENTO */}
      {showModal&&<LancModal tipo={showModal} form={showModal==="receita"?recForm:showModal==="despesa"?despForm:showModal==="investimento"?invForm:empForm} setForm={showModal==="receita"?setRecForm:showModal==="despesa"?setDespForm:showModal==="investimento"?setInvForm:setEmpForm} onSave={()=>addItem(showModal)} onClose={()=>setShowModal(null)} cadastros={cadastros} today={today}/>}

      {/* MODAL EDIÇÃO */}
      {editingItem&&(
        <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>setEditingItem(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"16px",padding:"24px",width:"480px",maxWidth:"96vw",boxShadow:shadowMd}} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:T.text,margin:"0 0 16px",fontSize:"16px"}}>✏️ Editar lançamento</h3>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Descrição</label><input style={inpS} value={editingItem.editDesc} onChange={e=>setEditingItem(ei=>({...ei,editDesc:e.target.value}))}/></div>
              <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Ref.</label><input style={inpS} value={editingItem.editRef} onChange={e=>setEditingItem(ei=>({...ei,editRef:e.target.value}))}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Valor (R$)</label><input type="number" step="0.01" style={inpS} value={editingItem.editValor} onChange={e=>setEditingItem(ei=>({...ei,editValor:e.target.value}))}/></div>
                <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Data</label><input type="date" style={inpDate} value={editingItem.editDate} onChange={e=>setEditingItem(ei=>({...ei,editDate:e.target.value}))}/></div>
                {(editingItem.tipo==="receita")&&<div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Cliente</label><input style={inpS} value={editingItem.editCliente} onChange={e=>setEditingItem(ei=>({...ei,editCliente:e.target.value}))}/></div>}
                {(editingItem.tipo==="despesa")&&<div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Fornecedor</label><input style={inpS} value={editingItem.editFornecedor} onChange={e=>setEditingItem(ei=>({...ei,editFornecedor:e.target.value}))}/></div>}
                {(editingItem.tipo==="receita"||editingItem.tipo==="investimento")&&<div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Banco</label><input style={inpS} value={editingItem.editBanco} onChange={e=>setEditingItem(ei=>({...ei,editBanco:e.target.value}))}/></div>}
              </div>
            </div>
            <div style={{display:"flex",gap:"8px",marginTop:"16px",justifyContent:"flex-end",borderTop:`1px solid ${T.border}`,paddingTop:"14px"}}>
              <button style={btnP(T.green)} onClick={saveEdit}>✅ Salvar alteração</button>
              <button style={btnG} onClick={()=>setEditingItem(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOTE */}
      {showLote&&(
        <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowLote(false)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"16px",padding:"24px",width:"520px",maxWidth:"92vw",boxShadow:shadowMd}} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:T.text,margin:"0 0 8px"}}>📋 Importação em Lote</h3>
            <p style={{color:T.textSub,fontSize:"13px",marginBottom:"12px"}}>Formato: <code style={{color:T.purple,background:T.purpleLight,padding:"1px 5px",borderRadius:4}}>tipo;descrição;valor;data</code></p>
            <textarea style={{width:"100%",border:`1.5px solid ${T.borderStrong}`,borderRadius:"10px",padding:"10px",color:T.text,fontSize:"12px",outline:"none",resize:"vertical",minHeight:"110px",boxSizing:"border-box",fontFamily:"monospace",background:T.surfaceAlt}} value={loteText} onChange={e=>setLoteText(e.target.value)} placeholder={"receita;Salário;5000;2026-05-10\ndespesa;Aluguel;1200;2026-05-05"}/>
            <div style={{display:"flex",gap:"8px",marginTop:"14px",justifyContent:"flex-end"}}>
              <button style={btnP(T.purple)} onClick={()=>{
                const lines=loteText.split("\n").filter(l=>l.trim());let added=0;
                const nd=safeData.map(m=>({...m,receitas:[...m.receitas],despesas:[...m.despesas],investimentos:[...m.investimentos],emprestimos:[...m.emprestimos]}));
                lines.forEach(line=>{const[tipo,desc,val,dateStr]=line.split(";").map(p=>p.trim());const valor=parseFloat(val?.replace(",","."));const mIdx=dateStr?new Date(dateStr).getMonth():currentMonth;const date=dateStr||today;if(!tipo||!desc||isNaN(valor))return;if(tipo.toLowerCase().includes("rec"))nd[mIdx]?.receitas.push({id:uid(),desc,valor,date});else if(tipo.toLowerCase().includes("desp"))nd[mIdx]?.despesas.push({id:uid(),desc,valor,date});else if(tipo.toLowerCase().includes("inv"))nd[mIdx]?.investimentos.push({id:uid(),desc,valor,date});else if(tipo.toLowerCase().includes("emp"))nd[mIdx]?.emprestimos.push({id:uid(),desc,valor,date});added++;});
                setData(nd);setLoteText("");setShowLote(false);showToast(`${added} item(s) importados!`);
              }}>✓ Processar</button>
              <button style={btnG} onClick={()=>setShowLote(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORTAR */}
      {showImport&&(
        <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowImport(false)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"16px",padding:"24px",width:"520px",maxWidth:"92vw",boxShadow:shadowMd}} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:T.text,margin:"0 0 8px"}}>📥 Importar JSON</h3>
            <textarea style={{width:"100%",border:`1.5px solid ${T.borderStrong}`,borderRadius:"10px",padding:"10px",color:T.text,fontSize:"12px",outline:"none",resize:"vertical",minHeight:"110px",boxSizing:"border-box",fontFamily:"monospace",background:T.surfaceAlt}} id="importArea" placeholder='{"data":[...],"cartoes":[...]}' />
            <div style={{display:"flex",gap:"8px",marginTop:"14px",justifyContent:"flex-end"}}>
              <button style={btnP(T.purple)} onClick={()=>{try{const imp=JSON.parse(document.getElementById("importArea").value);if(imp.allYearsData||imp.data||imp.mei_data||imp.cartoes||imp.cadastros){if(imp.allYearsData)setAllYearsData(imp.allYearsData);else if(Array.isArray(imp.data))setAllYearsData({[String(currentYear)]:imp.data});if(imp.cartoes)setCartoes(imp.cartoes);if(imp.usoCartoes)setUsoCartoes(imp.usoCartoes);if(imp.pagamentos)setPagamentos(imp.pagamentos);if(imp.cadastros)setCadastros({...emptyCadastros(),...imp.cadastros});if(imp.mei_data)setMeiData({...emptyMei(),...imp.mei_data,meis:(imp.mei_data.meis||emptyMei().meis),notas:Array.isArray(imp.mei_data.notas)?imp.mei_data.notas:[]});setShowImport(false);showToast("Importado com sucesso!");}else showToast("Formato inválido — JSON não reconhecido","error");}catch{showToast("JSON inválido","error");}}}>✓ Importar</button>
              <button style={btnG} onClick={()=>setShowImport(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {pagamentoModal&&(
        <div style={{position:"fixed",inset:0,zIndex:600,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>setPagamentoModal(null)}>
          <div style={{background:T.surface,border:`2px solid ${T.green}30`,borderRadius:"18px",padding:"24px",width:"480px",maxWidth:"96vw",boxShadow:shadowMd}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <h3 style={{color:T.text,margin:0,fontSize:"16px",fontWeight:700,borderLeft:`4px solid ${T.green}`,paddingLeft:"10px"}}>💳 Pagamento de Fatura</h3>
              <button style={{...btnG,padding:"4px 10px"}} onClick={()=>setPagamentoModal(null)}>✕</button>
            </div>

            <div style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:"12px",padding:"14px",marginBottom:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                <span style={{fontSize:"13px",fontWeight:600,color:T.text}}>{pagamentoModal.nomeCartao}</span>
                <span style={{fontSize:"13px",color:T.textSub}}>{MONTHS[pagamentoModal.month]} {pagamentoModal.year}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:"12px",color:T.textSub}}>Valor total da fatura:</span>
                <span style={{fontSize:"16px",fontWeight:700,color:T.red}}>{fmt(pagamentoModal.valorFatura)}</span>
              </div>
              {pagamentoModal.saldoRestante<pagamentoModal.valorFatura&&(
                <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
                  <span style={{fontSize:"12px",color:T.textSub}}>Saldo restante:</span>
                  <span style={{fontSize:"14px",fontWeight:700,color:T.amber}}>{fmt(pagamentoModal.saldoRestante)}</span>
                </div>
              )}
            </div>

            <RadioGroup label="Tipo de Pagamento" value={pagForm.tipo} onChange={v=>{setPagForm(f=>({...f,tipo:v,valor:v==="total"?pagamentoModal.saldoRestante.toFixed(2):f.valor}));}}
              options={[{value:"total",label:`Total ${fmt(pagamentoModal.saldoRestante)}`},{value:"parcial",label:"Parcial"}]}/>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
              <div>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Valor a pagar (R$)</label>
                <input type="number" step="0.01" style={inpS} value={pagForm.valor}
                  readOnly={pagForm.tipo==="total"}
                  onChange={e=>setPagForm(f=>({...f,valor:e.target.value}))}
                  placeholder="0,00"/>
              </div>
              <div>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Data do pagamento</label>
                <input type="date" style={inpDate} value={pagForm.data} onChange={e=>setPagForm(f=>({...f,data:e.target.value}))}/>
              </div>
            </div>

            <div style={{marginBottom:"12px"}}>
              <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Observação (opcional)</label>
              <input style={inpS} placeholder="Ex: Pagamento mínimo, débito automático..." value={pagForm.obs} onChange={e=>setPagForm(f=>({...f,obs:e.target.value}))}/>
            </div>

            {pagForm.tipo==="parcial"&&parseFloat(pagForm.valor)>0&&(
              <div style={{background:T.amberLight,border:"1px solid #FDE68A",borderRadius:"8px",padding:"10px 14px",marginBottom:"12px"}}>
                <p style={{fontSize:"12px",color:T.amber,fontWeight:600,margin:"0 0 2px"}}>⚡ Pagamento parcial</p>
                <p style={{fontSize:"12px",color:"#92400E",margin:0}}>
                  Valor a pagar: <strong>{fmt(parseFloat(pagForm.valor)||0)}</strong> •
                  Saldo devedor restante: <strong>{fmt(Math.max(0,pagamentoModal.saldoRestante-(parseFloat(pagForm.valor)||0)))}</strong>
                </p>
              </div>
            )}

            <div style={{display:"flex",gap:"8px",justifyContent:"flex-end",paddingTop:"14px",borderTop:`1px solid ${T.border}`}}>
              <button style={btnP(T.green)} onClick={confirmarPagamento}>
                ✅ {pagForm.tipo==="total"?"Confirmar Pagamento Total":"Registrar Pagamento Parcial"}
              </button>
              <button style={btnG} onClick={()=>setPagamentoModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USO MODAL */}
      {editUso&&(
        <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>setEditUso(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"16px",padding:"24px",width:"480px",maxWidth:"96vw",boxShadow:shadowMd}} onClick={e=>e.stopPropagation()}>
            <h3 style={{color:T.text,margin:"0 0 16px",fontSize:"16px"}}>✏️ Editar compra no cartão</h3>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Cartão</label>
                <select style={selS} value={editUso.cartaoId} onChange={e=>setEditUso(u=>({...u,cartaoId:e.target.value}))}>
                  {cartoes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Data da compra</label><input type="date" style={inpDate} value={editUso.data} onChange={e=>setEditUso(u=>({...u,data:e.target.value}))}/></div>
                <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Parcelas</label><input type="number" style={inpS} value={editUso.parcelas} onChange={e=>{const p=parseInt(e.target.value)||1;setEditUso(u=>({...u,parcelas:p,valorParcela:parseFloat((u.valor/p).toFixed(2))}));}} /></div>
              </div>
              <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Descrição</label><input style={inpS} value={editUso.descricao} onChange={e=>setEditUso(u=>({...u,descricao:e.target.value}))}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Valor total (R$)</label><input type="number" step="0.01" style={inpS} value={editUso.valor} onChange={e=>{const v=parseFloat(e.target.value)||0;setEditUso(u=>({...u,valor:v,valorParcela:parseFloat((v/u.parcelas).toFixed(2))}));}} /></div>
                <div><label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Valor/parcela</label><input style={{...inpS,background:T.surfaceAlt,color:T.textSub}} readOnly value={fmt(editUso.valorParcela)}/></div>
              </div>
            </div>
            <div style={{display:"flex",gap:"8px",marginTop:"16px",justifyContent:"flex-end",borderTop:`1px solid ${T.border}`,paddingTop:"14px"}}>
              <button style={btnP(T.green)} onClick={()=>{setUsoCartoes(u=>u.map(x=>x.id===editUso.id?editUso:x));setEditUso(null);showToast("Compra atualizada!");}}>✅ Salvar</button>
              <button style={btnG} onClick={()=>setEditUso(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      {isMobile&&(
        <>
          {/* Overlay do menu completo */}
          {showMobileMenu&&(
            <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}} onClick={()=>setShowMobileMenu(false)}>
              <div style={{position:"absolute",bottom:"70px",left:0,right:0,background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 16px",boxShadow:"0 -4px 20px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
                <div style={{width:"36px",height:"4px",background:T.border,borderRadius:"2px",margin:"0 auto 16px"}}/>
                <p style={{fontSize:"12px",fontWeight:700,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"12px"}}>Navegação</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
                  {[{key:"dashboard",icon:"📊",label:"Dashboard"},{key:"lancamentos",icon:"✏️",label:"Lançamentos"},{key:"buscar",icon:"🔍",label:"Buscar"},{key:"relatorio",icon:"📈",label:"Relatório"},{key:"cartoes",icon:"💳",label:"Cartões"},{key:"cadastros",icon:"🗂️",label:"Cadastros"},{key:"mei",icon:"🏢",label:"MEI"},{key:"emitir",icon:"📄",label:"Emitir PDF"},{key:"sincronizar",icon:"🔄",label:"Sincronizar"}].map(n=>(
                    <div key={n.key} onClick={()=>{setActiveSection(n.key);setShowMobileMenu(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",padding:"12px 6px",borderRadius:"12px",cursor:"pointer",background:activeSection===n.key?T.purpleLight:T.surfaceAlt,border:`1px solid ${activeSection===n.key?T.purple:T.border}`}}>
                      <span style={{fontSize:"22px"}}>{n.icon}</span>
                      <span style={{fontSize:"9px",fontWeight:600,color:activeSection===n.key?T.purple:T.textSub,textAlign:"center",lineHeight:1.2}}>{n.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Barra fixa bottom */}
          <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 env(safe-area-inset-bottom,12px)",boxShadow:"0 -2px 10px rgba(0,0,0,0.08)"}}>
            {[{key:"dashboard",icon:"📊",label:"Início"},{key:"lancamentos",icon:"✏️",label:"Lançar"},{key:"emitir",icon:"📄",label:"Relatório"},{key:"mei",icon:"🏢",label:"MEI"}].map(n=>(
              <div key={n.key} onClick={()=>setActiveSection(n.key)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",cursor:"pointer",minWidth:"54px",padding:"4px 0"}}>
                <span style={{fontSize:"21px"}}>{n.icon}</span>
                <span style={{fontSize:"9px",fontWeight:600,color:activeSection===n.key?T.purple:T.textMuted}}>{n.label}</span>
                {activeSection===n.key&&<span style={{width:"4px",height:"4px",borderRadius:"50%",background:T.purple,display:"block"}}/>}
              </div>
            ))}
            <div onClick={()=>setShowMobileMenu(m=>!m)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",cursor:"pointer",minWidth:"54px",padding:"4px 0"}}>
              <span style={{fontSize:"21px"}}>{showMobileMenu?"✕":"☰"}</span>
              <span style={{fontSize:"9px",fontWeight:600,color:T.textMuted}}>Mais</span>
            </div>
          </div>
        </>
      )}

      {/* EDIT NF MODAL */}
      {editNF&&(
        <div style={{position:"fixed",inset:0,zIndex:600,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>setEditNF(null)}>
          <div style={{background:T.surface,border:`2px solid ${T.green}30`,borderRadius:"18px",padding:"24px",width:"600px",maxWidth:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:shadowMd}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <h3 style={{color:T.text,margin:0,fontSize:"16px",fontWeight:700,borderLeft:`4px solid ${T.green}`,paddingLeft:"10px"}}>✏️ Editar Nota Fiscal</h3>
              <button style={{...btnG,padding:"4px 10px"}} onClick={()=>setEditNF(null)}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div style={{gridColumn:"span 2"}}>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>MEI</label>
                <select style={selS} value={editNF.meiId} onChange={e=>setEditNF(n=>({...n,meiId:e.target.value}))}>
                  {meiData.meis.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Competência</label>
                <input type="month" style={inpS} value={editNF.competencia||""} onChange={e=>setEditNF(n=>({...n,competencia:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Data de Emissão</label>
                <input type="date" style={inpS} value={editNF.dataEmissao||""} onChange={e=>setEditNF(n=>({...n,dataEmissao:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Nº da NF</label>
                <input style={inpS} value={editNF.numeroNF||""} onChange={e=>setEditNF(n=>({...n,numeroNF:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Valor (R$)</label>
                <input type="number" step="0.01" style={inpS} value={editNF.valor||""} onChange={e=>setEditNF(n=>({...n,valor:parseFloat(e.target.value)||0}))}/>
              </div>
              <div>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Prestador (quem emite)</label>
                <input style={inpS} value={editNF.prestador||""} onChange={e=>setEditNF(n=>({...n,prestador:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Tomador (cliente)</label>
                <input style={inpS} value={editNF.tomador||""} onChange={e=>setEditNF(n=>({...n,tomador:e.target.value}))}/>
              </div>
              <div style={{gridColumn:"span 2"}}>
                <label style={{fontSize:"12px",color:T.textSub,display:"block",marginBottom:"4px"}}>Descrição do serviço</label>
                <input style={inpS} value={editNF.descricao||""} onChange={e=>setEditNF(n=>({...n,descricao:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:"flex",gap:"8px",justifyContent:"flex-end",paddingTop:"14px",borderTop:`1px solid ${T.border}`}}>
              <button style={btnP(T.green)} onClick={()=>{
                setMeiData(d=>({...d,notas:d.notas.map(n=>n.id===editNF.id?editNF:n)}));
                setEditNF(null);
                showToast("NF atualizada!");
              }}>✅ Salvar alteração</button>
              <button style={btnG} onClick={()=>setEditNF(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast&&<div style={{position:"fixed",bottom:"20px",right:"20px",zIndex:9999,background:toast.type==="error"?T.red:T.green,borderRadius:"10px",padding:"12px 18px",color:"#fff",fontWeight:600,fontSize:"13px",boxShadow:shadowMd}}>{toast.msg}</div>}
    </div>
  );
}
