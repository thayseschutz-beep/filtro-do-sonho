"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ── Supabase ───────────────────────────────────────────────────────────────
const CASAL_ID = "casal";

// ── Constants ─────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const CARD_COLORS = ["#7C3AED","#EF4444","#0EA5E9","#22C55E","#F59E0B","#EC4899","#8B5CF6","#14B8A6"];
const fmt = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const fmtK = (v) => Math.abs(v||0)>=1000?`R$${((v||0)/1000).toFixed(1)}k`:`R$${(v||0).toFixed(0)}`;
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const sumArr = (arr) => (arr||[]).reduce((s,x)=>s+(x.valor||0),0);
const emptyYear = () => Array.from({length:12},(_,i)=>({month:i,receitas:[],despesas:[],investimentos:[],emprestimos:[]}));
const emptyCadastros = () => ({bancos:[],fornecedores:[],pessoas:[],catReceitas:[],catDespesas:[],catInvestimentos:[]});
const emptyRecForm = (today) => ({data:today,desc:"",ref:"",cliente:"",valor:"",formaRec:"pix",banco:""});
const emptyDespForm = (today) => ({data:today,desc:"",ref:"",fornecedor:"",valor:"",recorrente:false,formaPag:"avista",parcelas:"1",meioPag:"pix",pago:false});
const emptyInvForm = (today) => ({data:today,desc:"",ref:"",valor:"",investido:false,banco:""});
const emptyEmpForm = (today) => ({data:today,desc:"",ref:"",parafem:"",valor:"",valorParcela:"",parcelas:"1",dataVenc1:"",dataVencN:"",meioPag:"pix",pago:false});

// ── Theme ──────────────────────────────────────────────────────────────────
const T = {
  bg:"#F1F5F9",surface:"#FFFFFF",surfaceAlt:"#F8FAFC",
  border:"#E2E8F0",borderStrong:"#CBD5E1",
  text:"#0F172A",textSub:"#64748B",textMuted:"#94A3B8",
  purple:"#7C3AED",purpleLight:"#EDE9FE",
  green:"#16A34A",greenLight:"#DCFCE7",
  red:"#DC2626",redLight:"#FEE2E2",
  blue:"#0284C7",blueLight:"#E0F2FE",
  amber:"#D97706",amberLight:"#FEF3C7",
  indigo:"#4F46E5",indigoLight:"#EEF2FF",
};
const shadow = "0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04)";
const shadowMd = "0 4px 6px rgba(0,0,0,0.07),0 2px 4px rgba(0,0,0,0.04)";
const card = (ex={}) => ({background:T.surface,border:`1px solid ${T.border}`,borderRadius:"12px",padding:"18px",boxShadow:shadow,marginBottom:"14px",...ex});
const inpS = {background:T.surface,border:`1.5px solid ${T.borderStrong}`,borderRadius:"9px",padding:"8px 12px",color:T.text,fontSize:"13px",outline:"none",width:"100%",boxSizing:"border-box"};
const selS = {background:T.surface,border:`1.5px solid ${T.borderStrong}`,borderRadius:"9px",padding:"8px 12px",color:T.text,fontSize:"13px",outline:"none",width:"100%",boxSizing:"border-box"};
const inpDate = {background:T.surface,border:`1.5px solid ${T.borderStrong}`,borderRadius:"9px",padding:"8px 12px",color:T.text,fontSize:"13px",outline:"none",width:"100%",boxSizing:"border-box"};
const btnP = (col=T.purple) => ({padding:"9px 18px",borderRadius:"9px",border:"none",cursor:"pointer",background:col,color:"#fff",fontWeight:600,fontSize:"13px",boxShadow:`0 2px 8px ${col}40`,whiteSpace:"nowrap"});
const btnO = (col=T.purple) => ({padding:"8px 16px",borderRadius:"9px",border:`1.5px solid ${col}`,cursor:"pointer",background:"transparent",color:col,fontWeight:600,fontSize:"12px",whiteSpace:"nowrap"});
const btnG = {padding:"8px 14px",borderRadius:"9px",border:`1px solid ${T.border}`,cursor:"pointer",background:T.surface,color:T.textSub,fontWeight:600,fontSize:"12px"};
const remB = {background:T.redLight,border:`1px solid #FECACA`,color:T.red,borderRadius:"6px",cursor:"pointer",padding:"3px 8px",fontSize:"11px",fontWeight:600};
const editB = {background:T.indigoLight,border:`1px solid #C7D2FE`,color:T.indigo,borderRadius:"6px",cursor:"pointer",padding:"3px 8px",fontSize:"11px",fontWeight:600};
const itemRow = {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:"10px",marginBottom:"5px",background:T.surfaceAlt,border:`1px solid ${T.border}`};
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
  const CY = 2026, nowM = new Date().getMonth();
  const yrMs = Array.from({length:12},(_,i)=>i);

  // state
  const [data, setData] = useState(emptyYear());
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
  const [editUso, setEditUso] = useState(null); // for editing a credit card purchase
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
          const base = emptyYear();
          if(Array.isArray(row.data)&&row.data.length>0){
            row.data.forEach((m,i)=>{ if(i<12&&m) base[i]={month:i,receitas:Array.isArray(m.receitas)?m.receitas:[],despesas:Array.isArray(m.despesas)?m.despesas:[],investimentos:Array.isArray(m.investimentos)?m.investimentos:[],emprestimos:Array.isArray(m.emprestimos)?m.emprestimos:[]}; });
          }
          setData(base);
          if(row.cartoes&&Array.isArray(row.cartoes))setCartoes(row.cartoes);
          if(row.uso_cartoes&&Array.isArray(row.uso_cartoes))setUsoCartoes(row.uso_cartoes);
          if(row.pagamentos&&typeof row.pagamentos==="object")setPagamentos(row.pagamentos);
          if(row.sync_url)setSyncUrl(row.sync_url);
          if(row.cadastros&&typeof row.cadastros==="object")setCadastros({...emptyCadastros(),...row.cadastros});
        }
      } catch(e){console.error("Load error",e);}
    };
    load();
    const ch = supabase.channel("fin_rt")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"financas_compartilhadas",filter:`id=eq.${CASAL_ID}`},(payload)=>{
        const row = payload.new;
        const base = emptyYear();
        if(Array.isArray(row.data)&&row.data.length>0){
          row.data.forEach((m,i)=>{ if(i<12&&m) base[i]={month:i,receitas:Array.isArray(m.receitas)?m.receitas:[],despesas:Array.isArray(m.despesas)?m.despesas:[],investimentos:Array.isArray(m.investimentos)?m.investimentos:[],emprestimos:Array.isArray(m.emprestimos)?m.emprestimos:[]}; });
        }
        setData(base);
        if(row.cartoes&&Array.isArray(row.cartoes))setCartoes(row.cartoes);
        if(row.uso_cartoes&&Array.isArray(row.uso_cartoes))setUsoCartoes(row.uso_cartoes);
        if(row.pagamentos&&typeof row.pagamentos==="object")setPagamentos(row.pagamentos);
        if(row.cadastros&&typeof row.cadastros==="object")setCadastros({...emptyCadastros(),...row.cadastros});
        showToast("🔄 Atualizado!");
      }).subscribe();
    return()=>supabase.removeChannel(ch);
  },[]);

  const saveToSupa = async(payload) => {
    const supabase = createClient();
    const {error} = await supabase.from("financas_compartilhadas").upsert({
      id:CASAL_ID, updated_at:new Date().toISOString(),
      data:Array.isArray(payload.data)?payload.data:emptyYear(),
      cartoes:Array.isArray(payload.cartoes)?payload.cartoes:[],
      uso_cartoes:Array.isArray(payload.uso_cartoes)?payload.uso_cartoes:[],
      pagamentos:payload.pagamentos||{},
      sync_url:payload.sync_url||"",
      cadastros:payload.cadastros||emptyCadastros(),
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
  const togglePago=async(cid,y,m,dataPag)=>{
    const key=`${cid}_${y}_${m}`;
    const jaEhPago=!!pagamentos[key]?.pago||pagamentos[key]===true;
    const np={...pagamentos,[key]:jaEhPago?false:{pago:true,data:dataPag||today}};
    setPagamentos(np);
    try{await saveToSupa({data:safeData,cartoes,uso_cartoes:usoCartoes,pagamentos:np,sync_url:syncUrl,cadastros});}catch(_){}
  };
  const isFaturaPaga=(cid,y,m)=>{const v=pagamentos[`${cid}_${y}_${m}`];return v===true||v?.pago===true;};
  const getDataPagamento=(cid,y,m)=>{const v=pagamentos[`${cid}_${y}_${m}`];return v?.data||"";};

  const faturasMes=cartoes.reduce((s,c)=>s+getFat(c.id,CY,currentMonth),0);
  const faturasAbertas=faturasMes-cartoes.reduce((s,c)=>s+(isPago(c.id,CY,currentMonth)?getFat(c.id,CY,currentMonth):0),0);
  const saldoReal=saldo-faturasAbertas;
  const recConfirmado=sumArr(monthData.receitas.filter(x=>x.recebido));
  // Parcelados: provisão dos próximos meses
  const proximosParcelados=yrMs.filter(m=>m>currentMonth).map(m=>({
    month:m,
    despesas:sumArr(safeData[m].despesas.filter(x=>x.parcelaGroupId)),
    emprestimos:sumArr(safeData[m].emprestimos.filter(x=>x.parcelaGroupId)),
  })).filter(m=>m.despesas>0||m.emprestimos>0).slice(0,4);
  const despConfirmada=sumArr(monthData.despesas.filter(x=>x.pago));
  const invConfirmado=sumArr(monthData.investimentos.filter(x=>x.investido));
  const empConfirmado=sumArr(monthData.emprestimos.filter(x=>x.pago));
  const totalAtrasado=yrMs.slice(0,nowM).reduce((s,m)=>s+cartoes.reduce((ss,c)=>ss+(!isPago(c.id,CY,m)?getFat(c.id,CY,m):0),0),0);
  const totalAnualCartoes=yrMs.reduce((s,m)=>s+cartoes.reduce((ss,c)=>ss+getFat(c.id,CY,m),0),0);
  const totalAbertoPendente=yrMs.reduce((s,m)=>s+cartoes.reduce((ss,c)=>ss+(!isPago(c.id,CY,m)?getFat(c.id,CY,m):0),0),0);
  const proximasFaturas=yrMs.filter(m=>m>=nowM).map(m=>({month:m,total:cartoes.reduce((s,c)=>s+getFat(c.id,CY,m),0),pago:cartoes.every(c=>getFat(c.id,CY,m)===0||isPago(c.id,CY,m))})).filter(f=>f.total>0).slice(0,5);
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

      // ── PARCELADO: distribui nos meses seguintes ──────────────────
      if(f.formaPag==="parcelado"&&parcelas>1){
        const valorParcela=parseFloat((valorTotal/parcelas).toFixed(2));
        const startMonth=new Date(f.data+"T12:00:00").getMonth();
        const groupId=uid();
        const nd=safeData.map(m=>({...m,despesas:[...m.despesas]}));
        let criadas=0;
        for(let i=0;i<parcelas;i++){
          const targetMonth=startMonth+i;
          if(targetMonth>11) break; // só dentro do ano
          nd[targetMonth].despesas.push({
            id:uid(),
            desc:f.desc,
            valor:valorParcela,
            valorTotal,
            date:f.data,
            ref:f.ref,
            fornecedor:f.fornecedor,
            recorrente:false,
            formaPag:"parcelado",
            parcelas,
            parcelaNum:i+1,
            parcelaGroupId:groupId,
            meioPag:f.meioPag,
            pago:f.pago,
          });
          criadas++;
        }
        setData(nd);
        setDespForm(emptyDespForm(today));
        setShowModal(null);
        showToast(`✅ ${criadas} parcelas distribuídas (${MONTHS[startMonth]} a ${MONTHS[Math.min(startMonth+parcelas-1,11)]})`);
        return;
      }
      // ── À VISTA ───────────────────────────────────────────────────
      item={id:uid(),desc:f.desc,valor:valorTotal,date:f.data,ref:f.ref,fornecedor:f.fornecedor,recorrente:f.recorrente,formaPag:f.formaPag,parcelas:1,meioPag:f.meioPag,pago:f.pago};
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
        const nd=safeData.map(m=>({...m,emprestimos:[...m.emprestimos]}));
        let criadasEmp=0;
        for(let i=0;i<parcEmp;i++){
          const tm=startEmp+i;
          if(tm>11) break;
          nd[tm].emprestimos.push({id:uid(),desc:f.desc,valor:valParcEmp,valorTotal:valTotalEmp,date:f.data,ref:f.ref,parafem:f.parafem,parcelas:parcEmp,parcelaNum:i+1,parcelaGroupId:groupEmp,dataVenc1:f.dataVenc1,dataVencN:f.dataVencN,meioPag:f.meioPag,pago:f.pago});
          criadasEmp++;
        }
        setData(nd);
        setEmpForm(emptyEmpForm(today));
        setShowModal(null);
        showToast(`✅ ${criadasEmp} parcelas de empréstimo distribuídas!`);
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
    if(targetItem?.parcelaGroupId){
      const gid=targetItem.parcelaGroupId;
      const totalGrupo=safeData.reduce((s,m)=>s+m[key].filter(x=>x.parcelaGroupId===gid).length,0);
      if(totalGrupo>1){
        const choice=confirm(`Parcela ${targetItem.parcelaNum}/${targetItem.parcelas} de "${targetItem.desc}".

OK = Remover TODAS as parcelas
Cancelar = Remover só esta parcela`);
        if(choice){
          setData(d=>d.map(m=>({...m,[key]:m[key].filter(x=>x.parcelaGroupId!==gid)})));
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
    try{await saveToSupa({data:safeData,cartoes,uso_cartoes:usoCartoes,pagamentos,sync_url:syncUrl,cadastros});showToast("✅ Salvo! Lucas verá em instantes.");}
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
  const navItems=[{key:"dashboard",icon:"📊",label:"Dashboard"},{key:"lancamentos",icon:"✏️",label:"Lançamentos"},{key:"relatorio",icon:"📈",label:"Relatório"},{key:"cartoes",icon:"💳",label:"Cartões"},{key:"cadastros",icon:"🗂️",label:"Cadastros"},{key:"sincronizar",icon:"🔄",label:"Sincronizar"}];
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
          <div style={{width:"34px",height:"34px",borderRadius:"10px",flexShrink:0,background:"linear-gradient(135deg,#7C3AED,#0EA5E9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px"}}>💰</div>
          {sidebarOpen&&<div><div style={{fontSize:"14px",fontWeight:700,color:T.text}}>Planejamento</div><div style={{fontSize:"11px",color:T.textSub}}>Financeiro</div></div>}
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
              {{dashboard:"Dashboard",lancamentos:"Lançamentos",relatorio:"Relatório Anual",cartoes:"Cartões de Crédito",cadastros:"Cadastros",sincronizar:"Sincronizar com Google Sheets"}[activeSection]}
            </h1>
            <p style={{color:T.textSub,fontSize:"13px",margin:"2px 0 0"}}>Planejamento Financeiro Pessoal • {CY}</p>
          </div>
          {activeSection!=="cartoes"&&activeSection!=="cadastros"&&activeSection!=="sincronizar"&&(
            <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
              {!isMobile&&<div style={{display:"flex",background:T.surfaceAlt,borderRadius:"10px",padding:"3px",border:`1px solid ${T.border}`,gap:"2px"}}>
                {["mes","ano"].map(v=><button key={v} style={toggleB(view===v)} onClick={()=>setView(v)}>{v==="mes"?"Mês":"Ano"}</button>)}
              </div>}
              <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <button style={{...btnG,padding:"6px 10px"}} onClick={()=>setCurrentMonth(m=>Math.max(0,m-1))}>‹</button>
                <span style={{fontSize:"14px",fontWeight:600,color:T.text,minWidth:"120px",textAlign:"center"}}>{MONTHS[currentMonth]}</span>
                <button style={{...btnG,padding:"6px 10px"}} onClick={()=>setCurrentMonth(m=>Math.min(11,m+1))}>›</button>
              </div>
            </div>
          )}
        </div>

        {/* ── DASHBOARD ── */}
        {activeSection==="dashboard"&&(
          <div>
            {totalAtrasado>0&&<div style={{background:T.redLight,border:"1px solid #FECACA",borderRadius:"10px",padding:"12px 16px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{fontSize:"20px"}}>⚠️</span>
              <div><p style={{color:T.red,fontWeight:700,fontSize:"13px",margin:0}}>Faturas em atraso!</p><p style={{color:"#B91C1C",fontSize:"12px",margin:"2px 0 0"}}>Total não pago de meses anteriores: <strong>{fmt(totalAtrasado)}</strong></p></div>
            </div>}

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
                  const r=sumArr(safeData[i].receitas),d=sumArr(safeData[i].despesas),inv=sumArr(safeData[i].investimentos),emp=sumArr(safeData[i].emprestimos),cart=cartoes.reduce((s,c)=>s+getFat(c.id,CY,i),0);
                  const s=r-d-inv-emp-cartoes.reduce((s2,c)=>s2+(!isPago(c.id,CY,i)?getFat(c.id,CY,i):0),0);
                  return(
                    <div key={i} style={{background:i===currentMonth?T.purpleLight:T.surfaceAlt,border:i===currentMonth?`1.5px solid ${T.purple}`:`1px solid ${T.border}`,borderRadius:"10px",padding:"10px",cursor:"pointer",transition:"all 0.15s"}} onClick={()=>setCurrentMonth(i)}>
                      <p style={{fontSize:"11px",fontWeight:700,color:i===currentMonth?T.purple:T.textSub,marginBottom:"5px"}}>{m}</p>
                      <div style={{fontSize:"10px",display:"flex",flexDirection:"column",gap:"2px"}}>
                        {[["Rec",r,T.green],["Desp",d,T.red],["Cart",cart,T.amber],["Saldo",s,s>=0?T.purple:T.red]].map(([lbl,val,col])=>(
                          <div key={lbl} style={{display:"flex",justifyContent:"space-between"}}>
                            <span style={{color:T.textMuted}}>{lbl}</span>
                            <span style={{color:col,fontWeight:lbl==="Saldo"?700:400}}>{fmtK(val)}</span>
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
          </div>
        )}

        {/* ── CARTÕES ── */}
        {activeSection==="cartoes"&&(
          <div>
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
                      <p style={{fontSize:"13px",fontWeight:600,color:T.text,margin:0}}>📋 Histórico ({usoCartoes.length} compras)</p>
                      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                        <select style={{...selS,width:"auto",fontSize:"12px"}} value={faturaDetalhe?.cartaoId||""} onChange={e=>setFaturaDetalhe(e.target.value?{cartaoId:e.target.value,month:currentMonth,year:CY,faturaTab:"uso"}:null)}>
                          <option value="">Filtrar por cartão</option>
                          {cartoes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                        {faturaDetalhe?.cartaoId&&<button style={{...btnG,fontSize:"11px",padding:"4px 10px"}} onClick={()=>setFaturaDetalhe(null)}>✕ Limpar</button>}
                      </div>
                    </div>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                        <thead><tr>{["Cartão","Data","Descrição","Valor","Parcelas","Valor/Parc.",""].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",color:T.textSub,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
                        <tbody>{usoCartoes.map(u=>{const ci=cartoes.findIndex(c=>c.id===u.cartaoId);return(
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
                  <div style={{...card(),overflowX:"auto"}}>
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
                                  <button style={{background:pg?"#DCFCE7":"#FEE2E2",border:`1px solid ${pg?"#BBF7D0":"#FECACA"}`,color:pg?T.green:T.red,borderRadius:"5px",padding:"2px 8px",fontSize:"10px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>{
                                    if(pg){togglePago(c.id,CY,m);}
                                    else{const d=prompt(`Data de pagamento (${MONTHS[m]}):`,today);if(d!==null)togglePago(c.id,CY,m,d||today);}
                                  }}>{pg?`✓ ${getDataPagamento(c.id,CY,m)||"Pago"}`:fmt(v)}</button>
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
                <button style={btnP(T.green)} onClick={async()=>{try{await saveToSupa({data:safeData,cartoes,uso_cartoes:usoCartoes,pagamentos,sync_url:syncUrl,cadastros});showToast("URL salva!");}catch(_){showToast("Erro","error");}}}>Salvar</button>
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
          <button style={btnP(T.amber)} onClick={()=>{const b=new Blob([JSON.stringify({data:safeData,cartoes,usoCartoes,pagamentos,cadastros},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`financas_${CY}.json`;a.click();showToast("Exportado!");}}>📤 Exportar</button>
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
              <button style={btnP(T.purple)} onClick={()=>{try{const imp=JSON.parse(document.getElementById("importArea").value);if(imp.data&&Array.isArray(imp.data)){setData(imp.data);if(imp.cartoes)setCartoes(imp.cartoes);if(imp.usoCartoes)setUsoCartoes(imp.usoCartoes);if(imp.pagamentos)setPagamentos(imp.pagamentos);if(imp.cadastros)setCadastros({...emptyCadastros(),...imp.cadastros});setShowImport(false);showToast("Importado!");}else showToast("Formato inválido","error");}catch{showToast("JSON inválido","error");}}}>✓ Importar</button>
              <button style={btnG} onClick={()=>setShowImport(false)}>Cancelar</button>
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
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-around",padding:"8px 0 12px",boxShadow:"0 -2px 10px rgba(0,0,0,0.08)"}}>
          {[{key:"dashboard",icon:"📊",label:"Início"},{key:"lancamentos",icon:"✏️",label:"Lançar"},{key:"cartoes",icon:"💳",label:"Cartões"},{key:"cadastros",icon:"🗂️",label:"Cadastros"},{key:"sincronizar",icon:"🔄",label:"Sync"}].map(n=>(
            <div key={n.key} onClick={()=>setActiveSection(n.key)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",cursor:"pointer",minWidth:"56px"}}>
              <span style={{fontSize:"20px"}}>{n.icon}</span>
              <span style={{fontSize:"9px",fontWeight:600,color:activeSection===n.key?T.purple:T.textMuted}}>{n.label}</span>
              {activeSection===n.key&&<span style={{width:"4px",height:"4px",borderRadius:"50%",background:T.purple,display:"block"}}/>}
            </div>
          ))}
        </div>
      )}

      {/* TOAST */}
      {toast&&<div style={{position:"fixed",bottom:"20px",right:"20px",zIndex:9999,background:toast.type==="error"?T.red:T.green,borderRadius:"10px",padding:"12px 18px",color:"#fff",fontWeight:600,fontSize:"13px",boxShadow:shadowMd}}>{toast.msg}</div>}
    </div>
  );
}
