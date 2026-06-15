/* GREEN MIND — data layer, helpers, icon set. Exports to window.
   Faithful to the real product: 50/30/20 budgeting (essencial/pessoal/investimento),
   taxa de poupança, Filtro do Sonho goals w/ methodology, cartões com parcelas. */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt = (n) => BRL.format(n);
const fmtShort = (n) => 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/* ---- Date / month helpers (so a lançamento lands in the month of its real date) ---- */
const TODAY = '2026-06-15';                         // "hoje" do protótipo
const ymOf = (date) => (date || '').slice(0, 7);    // '2026-06-25' -> '2026-06'
function addMonths(ym, n) {
  let [y, m] = ym.split('-').map(Number);
  m = m - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}
function monthLabel(ym) { const [y, m] = ym.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; }
function monthLabelShort(ym) { const [y, m] = ym.split('-').map(Number); return `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}`; }
/* Same day-of-month, clamped, in a target year-month */
function sameDayIn(date, ym) {
  const day = Number(date.slice(8, 10));
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${ym}-${String(Math.min(day, last)).padStart(2, '0')}`;
}
const fmtDay = (date) => new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
const isLate = (date) => date < TODAY;
const effAmt = (t) => t.amount + (t.juros || 0);   // valor + juros/multa pagos

/* ---- Icon set: clean 24px stroke glyphs, currentColor ---- */
function Icon({ name, size = 24, stroke = 2, fill = 'none', style }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill, stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  const paths = {
    home:        <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9.5 20v-5h5v5"/></>,
    budget:      <><circle cx="12" cy="12" r="8.5"/><path d="M12 12 12 3.5"/><path d="M12 12l6 4.2"/></>,
    card:        <><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 9.5h19"/><path d="M6 15h4"/></>,
    target:      <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></>,
    plus:        <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    bell:        <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
    chart:       <><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 16l4-5 3 3 5-7"/></>,
    pie:         <><path d="M12 3v9l7 4"/><path d="M21 12a9 9 0 1 1-9-9"/></>,
    arrowUp:     <><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></>,
    arrowDown:   <><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></>,
    arrowRight:  <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    arrowLeft:   <><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></>,
    chevDown:    <><path d="M6 9l6 6 6-6"/></>,
    chevR:       <><path d="M9 6l6 6-6 6"/></>,
    check:       <><path d="M5 12.5l4.5 4.5L19 6.5"/></>,
    checkCircle: <><circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.5 2.5 4.5-5"/></>,
    trash:       <><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></>,
    edit:        <><path d="M5 19h3l9-9-3-3-9 9v3Z"/><path d="M14.5 6.5l3 3"/></>,
    eye:         <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    sun:         <><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></>,
    moon:        <><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/></>,
    eyeoff:      <><path d="M3 3l18 18"/><path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.3 3.9M6.2 6.2C3.6 7.8 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 3.9-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
    calendar:    <><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></>,
    sparkle:     <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M18 16l.7 2 2 .7-2 .7L18 21.5l-.7-2-2-.7 2-.7.7-2Z"/></>,
    flag:        <><path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/></>,
    stop:        <><circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7"/></>,
    rocket:      <><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M9 13c4-7 8-9 12-9 0 4-2 8-9 12l-3-3Z"/><circle cx="14.5" cy="9.5" r="1.4"/></>,
    /* category glyphs */
    salary:      <><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></>,
    food:        <><path d="M5 3v8a3 3 0 0 0 6 0V3"/><path d="M8 11v10"/><path d="M17 3c-1.7 0-3 2-3 5s1.3 4 3 4v9"/></>,
    transport:   <><path d="M5 16V9l1.5-4h11L19 9v7"/><rect x="3.5" y="14" width="17" height="4" rx="1.5"/><circle cx="7.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/><path d="M5 9h14"/></>,
    house:       <><path d="M4 11 12 5l8 6"/><path d="M6 10v9h12v-9"/><path d="M10 19v-4h4v4"/></>,
    shopping:    <><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></>,
    health:      <><path d="M12 21s-7-4.5-9-9.5C1.5 7 4 4 7 4c2 0 3.2 1.2 5 3.2C13.8 5.2 15 4 17 4c3 0 5.5 3 4 7.5-2 5-9 9.5-9 9.5Z"/></>,
    fun:         <><rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V6"/><circle cx="9" cy="12.5" r="1.3"/><circle cx="15" cy="12.5" r="1.3"/></>,
    invest:      <><path d="M4 18 9 12l3.5 3.5L20 6"/><path d="M15 6h5v5"/></>,
    education:   <><path d="M3 8.5 12 4l9 4.5L12 13 3 8.5Z"/><path d="M7 10.8V15c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.2"/><path d="M21 8.5V14"/></>,
    bills:       <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>,
    gift:        <><rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 13h17M12 9v11"/><path d="M12 9S10.5 4.5 8 5.5 9.5 9 12 9Zm0 0s1.5-4.5 4-3.5S14.5 9 12 9Z"/></>,
    wallet:      <><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="17" cy="13.5" r="1.3"/></>,
    services:    <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></>,
    piggy:       <><path d="M4 13a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-1Z"/><circle cx="15" cy="12" r="1"/><path d="M9 7V5M7 19v2M15 19v2M21 12h1"/></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ---- 50/30/20 buckets ---- */
const BUCKETS = {
  essencial:    { label: 'Essencial',    short: 'Essencial', target: 50, color: '#0EA5E9', tint: '#E0F2FE' },
  pessoal:      { label: 'Pessoal',      short: 'Pessoal',   target: 30, color: '#F59E0B', tint: '#FEF3C7' },
  investimento: { label: 'Investimento', short: 'Investir',  target: 20, color: '#22C55E', tint: '#DCFCE7' },
};

/* ---- Categories (mapped to buckets, real app structure) ---- */
const CATEGORIES = {
  // receitas
  salario:    { label: 'Salário',       icon: 'salary',    color: '#22C55E', kind: 'receita' },
  freela:     { label: 'Freelance',     icon: 'invest',    color: '#16A34A', kind: 'receita' },
  nf:         { label: 'Nota Fiscal',   icon: 'bills',     color: '#0EA5E9', kind: 'receita' },
  rendimento: { label: 'Rendimentos',   icon: 'chart',     color: '#3B82F6', kind: 'receita' },
  // essencial
  moradia:    { label: 'Moradia',       icon: 'house',     color: '#0EA5E9', kind: 'despesa', bucket: 'essencial' },
  alimentacao:{ label: 'Alimentação',   icon: 'food',      color: '#0EA5E9', kind: 'despesa', bucket: 'essencial' },
  transporte: { label: 'Transporte',    icon: 'transport', color: '#0EA5E9', kind: 'despesa', bucket: 'essencial' },
  saude:      { label: 'Saúde',         icon: 'health',    color: '#0EA5E9', kind: 'despesa', bucket: 'essencial' },
  servicos:   { label: 'Serviços',      icon: 'services',  color: '#0EA5E9', kind: 'despesa', bucket: 'essencial' },
  // pessoal
  lazer:      { label: 'Lazer',         icon: 'fun',       color: '#F59E0B', kind: 'despesa', bucket: 'pessoal' },
  compras:    { label: 'Roupas',        icon: 'shopping',  color: '#F59E0B', kind: 'despesa', bucket: 'pessoal' },
  restaurante:{ label: 'Restaurante',   icon: 'food',      color: '#F59E0B', kind: 'despesa', bucket: 'pessoal' },
  assinaturas:{ label: 'Assinaturas',   icon: 'bills',     color: '#F59E0B', kind: 'despesa', bucket: 'pessoal' },
  educacao:   { label: 'Educação',      icon: 'education', color: '#F59E0B', kind: 'despesa', bucket: 'pessoal' },
  // investimento
  reserva:    { label: 'Reserva',       icon: 'piggy',     color: '#22C55E', kind: 'despesa', bucket: 'investimento' },
  investir:   { label: 'Investimentos', icon: 'invest',    color: '#22C55E', kind: 'despesa', bucket: 'investimento' },
};

/* ---- Seed transactions (Junho 2026) ---- */
const SEED = [
  { id: 't1',  type: 'receita', cat: 'salario',    title: 'Salário — Mensal',           amount: 9800,   date: '2026-06-05', acct: 'Conta corrente' },
  { id: 't2',  type: 'receita', cat: 'freela',     title: 'Projeto de design',          amount: 2400,   date: '2026-06-12', acct: 'Conta corrente' },
  { id: 't3',  type: 'receita', cat: 'rendimento', title: 'Rendimento CDB',             amount: 1412.30,date: '2026-06-01', acct: 'Investimentos' },
  { id: 't4',  type: 'despesa', cat: 'moradia',    title: 'Aluguel',                    amount: 2100,   date: '2026-06-05', acct: 'Conta corrente' },
  { id: 't5',  type: 'despesa', cat: 'alimentacao',title: 'Supermercado',               amount: 487.90, date: '2026-06-13', acct: 'Cartão Verde' },
  { id: 't6',  type: 'despesa', cat: 'transporte', title: 'Combustível + Uber',         amount: 318.40, date: '2026-06-13', acct: 'Cartão Verde' },
  { id: 't7',  type: 'despesa', cat: 'saude',      title: 'Plano de saúde',             amount: 392.50, date: '2026-06-07', acct: 'Conta corrente' },
  { id: 't8',  type: 'despesa', cat: 'servicos',   title: 'Luz + Internet',             amount: 286.00, date: '2026-06-09', acct: 'Conta corrente' },
  { id: 't9',  type: 'despesa', cat: 'assinaturas',title: 'Netflix + Spotify',          amount: 76.80,  date: '2026-06-10', acct: 'Cartão Verde' },
  { id: 't10', type: 'despesa', cat: 'lazer',      title: 'Cinema + bar',               amount: 184.00, date: '2026-06-08', acct: 'Cartão Lima' },
  { id: 't11', type: 'despesa', cat: 'compras',    title: 'Loja de roupas',             amount: 219.90, date: '2026-06-06', acct: 'Cartão Lima' },
  { id: 't12', type: 'despesa', cat: 'restaurante',title: 'Almoços',                    amount: 142.00, date: '2026-06-11', acct: 'Cartão Lima' },
  { id: 't13', type: 'despesa', cat: 'reserva',    title: 'Reserva de emergência',      amount: 1000,   date: '2026-06-05', acct: 'Conta corrente' },
  { id: 't14', type: 'despesa', cat: 'investir',   title: 'Aporte Tesouro Direto',      amount: 800,    date: '2026-06-05', acct: 'Investimentos' },
  /* ---- Provisões (previstas, ainda não efetivadas) ---- */
  { id: 'p1', type: 'receita', cat: 'freela',  title: 'Freela — Landing Page',  amount: 1800, date: '2026-06-25', acct: 'Conta corrente', status: 'previsto' },
  { id: 'p2', type: 'despesa', cat: 'investir', title: 'Aporte programado CDB',   amount: 800,  date: '2026-06-20', acct: 'Investimentos',  status: 'previsto', recur: 'lote' },
  { id: 'p3', type: 'despesa', cat: 'moradia',  title: 'Condomínio',             amount: 540,  date: '2026-06-10', acct: 'Conta corrente', status: 'previsto' },
  { id: 'p4', type: 'receita', cat: 'salario',  title: 'Salário — Mensal',        amount: 9800, date: '2026-07-05', acct: 'Conta corrente', status: 'previsto', recur: 'lote' },
  { id: 'p5', type: 'despesa', cat: 'investir', title: 'Aporte programado CDB',   amount: 800,  date: '2026-07-20', acct: 'Investimentos',  status: 'previsto', recur: 'lote' },
];

/* ---- Cards (com parcelas) ---- */
const CARDS = [
  { id: 'c1', name: 'GreenMind Verde', bank: 'GreenBank', brand: 'Mastercard', last: '4412', grad: 'linear-gradient(135deg,#22C55E,#166534 90%)', limit: 8000, used: 3982.40, due: 15, closing: 8 },
  { id: 'c2', name: 'GreenMind Lima',  bank: 'GreenBank', brand: 'Visa',       last: '7781', grad: 'linear-gradient(135deg,#A3E635,#4D7C0F 90%)', limit: 5000, used: 2991.55, due: 10, closing: 3 },
];
const CARD_TX = [
  { id: 'k1', card: 'c1', title: 'Supermercado',      amount: 487.90, parcels: 1, of: 1, cat: 'alimentacao', date: '2026-06-13' },
  { id: 'k2', card: 'c1', title: 'Combustível',       amount: 318.40, parcels: 1, of: 1, cat: 'transporte',  date: '2026-06-13' },
  { id: 'k3', card: 'c1', title: 'Notebook Dell',     amount: 416.58, parcels: 3, of: 8, cat: 'compras',     date: '2026-04-02' },
  { id: 'k4', card: 'c2', title: 'Loja de roupas',    amount: 219.90, parcels: 1, of: 1, cat: 'compras',     date: '2026-06-06' },
  { id: 'k5', card: 'c2', title: 'Passagem aérea',    amount: 291.66, parcels: 2, of: 6, cat: 'lazer',       date: '2026-05-10' },
];

/* ---- Filtro do Sonho (Metas) — with methodology ---- */
const GOAL_CATS = {
  financeira: '💰 Financeira', viagem: '✈️ Viagem', profissional: '💼 Profissional',
  educacao: '📚 Educação', saude: '❤️ Saúde', pessoal: '🌟 Pessoal',
};
const GOALS = [
  { id: 'g1', title: 'Reserva de emergência', cat: 'financeira', target: 30000, saved: 19500, deadline: '2026-12-31', color: '#22C55E',
    achieve: '6 meses de custo de vida guardados num CDB de liquidez diária.',
    stop: 'Parar de gastar por impulso em apps de delivery toda semana.',
    how: 'Aporte automático de R$ 1.200 todo dia 5, logo após o salário.' },
  { id: 'g2', title: 'Viagem — Chile', cat: 'viagem', target: 12000, saved: 6840, deadline: '2027-03-15', color: '#3B82F6',
    achieve: '10 dias na Patagônia com tudo pago à vista.',
    stop: 'Reduzir restaurante de 8x para 3x ao mês.',
    how: 'Caixinha de viagem + cashback do cartão direcionados pra meta.' },
  { id: 'g3', title: 'Notebook novo', cat: 'profissional', target: 7500, saved: 5100, deadline: '2026-09-30', color: '#8B5CF6',
    achieve: 'MacBook pra acelerar os freelas de design.',
    stop: 'Pausar assinaturas que não uso (2 streamings).',
    how: 'Direcionar 100% da renda de freelance pra essa meta.' },
  { id: 'g4', title: 'Curso de UX', cat: 'educacao', target: 2400, saved: 2400, deadline: '2026-05-20', color: '#F59E0B',
    achieve: 'Certificação concluída pra subir de cargo.', stop: '', how: '', completed: true },
];

/* 6-month evolution (Jan–Jun) */
const EVOLUTION = [
  { m: 'Jan', rec: 11200, des: 7400 },
  { m: 'Fev', rec: 10800, des: 8100 },
  { m: 'Mar', rec: 12100, des: 6900 },
  { m: 'Abr', rec: 11600, des: 7200 },
  { m: 'Mai', rec: 12900, des: 6400 },
  { m: 'Jun', rec: 13612.30, des: 6906.40 },
];

Object.assign(window, { BRL, fmt, fmtShort, MONTHS, MONTHS_SHORT, TODAY, ymOf, addMonths, monthLabel, monthLabelShort, sameDayIn, fmtDay, isLate, effAmt, Icon, BUCKETS, CATEGORIES, SEED, CARDS, CARD_TX, GOAL_CATS, GOALS, EVOLUTION });
