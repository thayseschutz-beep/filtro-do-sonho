/* GREEN MIND — main app screens. Exports to window.
   Agora com: filtro por mês, provisões (efetivar / adiar), seleção em lote. */

/* 50/30/20 allocation bars — conta apenas despesas EFETIVADAS */
function Allocation({ tx, compact }) {
  const ef = tx.filter(t => (t.status || 'efetivado') === 'efetivado');
  const receitas = ef.filter(t => t.type === 'receita').reduce((s, t) => s + effAmt(t), 0) || 1;
  const sum = (b) => ef.filter(t => t.type === 'despesa' && CATEGORIES[t.cat]?.bucket === b).reduce((s, t) => s + effAmt(t), 0);
  const rows = Object.entries(BUCKETS).map(([k, b]) => ({ key: k, ...b, value: sum(k), pct: sum(k) / receitas * 100 }));
  return (
    <div className="alloc">
      {rows.map(r => {
        const over = r.pct > r.target;
        return (
          <div className="alloc-row" key={r.key}>
            <div className="alloc-top">
              <span className="alloc-label"><i style={{ background: r.color }} />{r.label}<small>meta {r.target}%</small></span>
              <span className={'alloc-val gm-num' + (over ? ' over' : '')}>{r.pct.toFixed(0)}%{!compact && ` · ${fmtShort(r.value)}`}</span>
            </div>
            <div className="alloc-bar">
              <span style={{ width: `${Math.min(100, r.pct / r.target * 100)}%`, background: r.color }} />
              <i className="alloc-target" style={{ left: '100%' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Month navigator pill */
function MonthNav({ ym, onNav, dark }) {
  return (
    <div className={'month-nav' + (dark ? ' on-dark' : '')}>
      <button onClick={() => onNav(-1)} aria-label="Mês anterior"><Icon name="arrowLeft" size={15} stroke={2.6} /></button>
      <b>{monthLabel(ym)}</b>
      <button onClick={() => onNav(1)} aria-label="Próximo mês"><Icon name="arrowRight" size={15} stroke={2.6} /></button>
    </div>
  );
}

/* ============ DASHBOARD (Início) ============ */
function Dashboard({ tx, ym, onNav, onAdd, onGoto, hideBal, setHideBal, theme, onToggleTheme }) {
  const month = tx.filter(t => ymOf(t.date) === ym);
  const ef = month.filter(t => (t.status || 'efetivado') === 'efetivado');
  const prev = month.filter(t => t.status === 'previsto');
  const receitas = ef.filter(t => t.type === 'receita').reduce((s, t) => s + effAmt(t), 0);
  const despesas = ef.filter(t => t.type === 'despesa').reduce((s, t) => s + effAmt(t), 0);
  const saldo = receitas - despesas;
  const taxa = receitas > 0 ? (saldo / receitas) * 100 : 0;
  const prevRec = prev.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const prevDes = prev.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  const animSaldo = useCountUp(saldo);
  const recent = [...ef].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const mask = (s) => hideBal ? '••••••' : s;

  return (
    <div className="scr scroll">
      <header className="topbar">
        <div className="hi">
          <div className="avatar">MA</div>
          <div>
            <span className="hi-sub">Bom dia,</span>
            <strong className="hi-name">Marina</strong>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={onToggleTheme} aria-label="Alternar tema">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
          </button>
          <button className="icon-btn" onClick={() => onGoto('relatorios')}><Icon name="chart" size={20} /></button>
          <button className="icon-btn"><Icon name="bell" size={20} /><i className="dot-badge" /></button>
        </div>
      </header>

      {/* Hero balance */}
      <section className="balance-hero">
        <div className="bh-grain" />
        <div className="bh-top">
          <MonthNav ym={ym} onNav={onNav} dark />
          <div className="bh-top-r">
            <span className="bh-rate-pill gm-num">{hideBal ? '••' : taxa.toFixed(0) + '%'} poupança</span>
            <button className="bh-eye" onClick={() => setHideBal(!hideBal)}><Icon name={hideBal ? 'eyeoff' : 'eye'} size={18} /></button>
          </div>
        </div>
        <div className="bh-amount gm-num">{hideBal ? 'R$ ••••••' : fmt(animSaldo)}</div>
        <div className="bh-split">
          <div className="bh-chip">
            <span className="bh-ic up"><Icon name="arrowUp" size={15} stroke={2.8} /></span>
            <div><small>Recebido</small><b className="gm-num">{mask(fmt(receitas))}</b></div>
          </div>
          <div className="bh-chip">
            <span className="bh-ic down"><Icon name="arrowDown" size={15} stroke={2.8} /></span>
            <div><small>Pago</small><b className="gm-num">{mask(fmt(despesas))}</b></div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="quick">
        {[
          { ic: 'plus', label: 'Adicionar', cb: onAdd, hot: true },
          { ic: 'card', label: 'Cartões', cb: () => onGoto('cartoes') },
          { ic: 'target', label: 'Metas', cb: () => onGoto('metas') },
          { ic: 'pie', label: 'Relatórios', cb: () => onGoto('relatorios') },
        ].map(q => (
          <button key={q.label} className={'quick-btn' + (q.hot ? ' hot' : '')} onClick={q.cb}>
            <span className="qb-ic"><Icon name={q.ic} size={21} stroke={2.2} /></span>
            <span>{q.label}</span>
          </button>
        ))}
      </section>

      {/* Provisões do mês */}
      {prev.length > 0 && (
        <button className="prov-banner" onClick={() => onGoto('orcamento')}>
          <span className="pb-ic"><Icon name="calendar" size={20} stroke={2.2} /></span>
          <div className="pb-txt">
            <b>{prev.length} provisõe{prev.length > 1 ? 's' : ''} prevista{prev.length > 1 ? 's' : ''}</b>
            <span>
              {prevRec > 0 && <em className="pos">+{fmtShort(prevRec)} a receber</em>}
              {prevRec > 0 && prevDes > 0 && ' · '}
              {prevDes > 0 && <em className="neg">−{fmtShort(prevDes)} a pagar</em>}
            </span>
          </div>
          <Icon name="chevR" size={20} />
        </button>
      )}

      {/* 50/30/20 */}
      <section className="card">
        <div className="card-head">
          <div><span className="eyebrow">Regra 50 / 30 / 20</span><h3>Alocação do mês</h3></div>
          <button className="link-btn" onClick={() => onGoto('orcamento')}>Orçamento</button>
        </div>
        <Allocation tx={month} />
      </section>

      {/* Evolution chart */}
      <section className="card">
        <div className="card-head">
          <div><span className="eyebrow">Evolução</span><h3>Receitas vs Despesas</h3></div>
          <span className="legend"><i style={{ background: '#22C55E' }} />Rec <i style={{ background: '#EF4444' }} />Desp</span>
        </div>
        <AreaChart series={[
          { points: EVOLUTION.map(e => e.rec), color: '#22C55E', fill: .20 },
          { points: EVOLUTION.map(e => e.des), color: '#EF4444', fill: .12 },
        ]} height={140} />
        <div className="x-axis">{EVOLUTION.map(e => <span key={e.m}>{e.m}</span>)}</div>
      </section>

      {/* Recent */}
      <section className="card flush">
        <div className="card-head pad">
          <div><span className="eyebrow">Atividade</span><h3>Últimos efetivados</h3></div>
          <button className="link-btn" onClick={() => onGoto('orcamento')}>Ver todos</button>
        </div>
        <ul className="tx-list">
          {recent.length ? recent.map(t => <TxRow key={t.id} t={t} />)
            : <li className="tx-empty">Nada efetivado em {monthLabelShort(ym)} ainda.</li>}
        </ul>
      </section>
      <div className="scroll-pad" />
    </div>
  );
}

/* A single transaction row (efetivado) — com modo seleção */
function TxRow({ t, onDel, selectMode, selected, onToggle }) {
  const c = CATEGORIES[t.cat];
  const pos = t.type === 'receita';
  const bucket = c.bucket ? BUCKETS[c.bucket] : null;
  const prev = t.status === 'previsto';
  return (
    <li className={'tx-row' + (selectMode ? ' selectable' : '') + (selected ? ' sel' : '')} onClick={selectMode ? () => onToggle(t.id) : undefined}>
      {selectMode && <span className={'tx-check' + (selected ? ' on' : '')}>{selected && <Icon name="check" size={14} stroke={3} />}</span>}
      <CatAvatar cat={t.cat} />
      <div className="tx-meta">
        <b>{t.title}{prev && <i className="tx-tag" style={{ background: 'var(--gm-amber-bg)', color: 'var(--gm-amber)' }}>previsto</i>}</b>
        <span>{c.label}{bucket && <i className="tx-tag" style={{ background: bucket.tint, color: bucket.color }}>{bucket.short}</i>} · {fmtDay(t.date)}{t.juros ? ' · +juros' : ''}</span>
      </div>
      <div className={'tx-amt gm-num ' + (pos ? 'pos' : 'neg')}>
        {pos ? '+' : '−'} {fmt(effAmt(t))}
      </div>
      {!selectMode && onDel && <button className="tx-del" onClick={(e) => { e.stopPropagation(); onDel(t.id); }}><Icon name="trash" size={17} /></button>}
    </li>
  );
}

/* Linha de PROVISÃO com ações: Efetivar / Adiar */
function ProvRow({ t, onEfetivar, onDefer, selectMode, selected, onToggle }) {
  const c = CATEGORIES[t.cat];
  const pos = t.type === 'receita';
  const late = isLate(t.date);
  return (
    <li className={'prov-row' + (late ? ' late' : '') + (selected ? ' sel' : '')}>
      <div className="prov-main" onClick={selectMode ? () => onToggle(t.id) : undefined}>
        {selectMode && <span className={'tx-check' + (selected ? ' on' : '')}>{selected && <Icon name="check" size={14} stroke={3} />}</span>}
        <CatAvatar cat={t.cat} />
        <div className="tx-meta">
          <b>{t.title}{t.recur === 'lote' && <i className="tx-tag parc">lote</i>}</b>
          <span>{c.label} · {late ? <em className="neg">venceu {fmtDay(t.date)}</em> : <>vence {fmtDay(t.date)}</>}</span>
        </div>
        <div className={'tx-amt gm-num ' + (pos ? 'pos' : 'neg')}>{pos ? '+' : '−'} {fmt(t.amount)}</div>
      </div>
      {!selectMode && (
        <div className="prov-actions">
          <button className="pa-btn primary" onClick={() => onEfetivar(t)}>
            <Icon name="checkCircle" size={16} stroke={2.3} /> {pos ? 'Recebi' : 'Paguei'}
          </button>
          <button className="pa-btn" onClick={() => onDefer(t.id)}>
            <Icon name="arrowRight" size={15} stroke={2.4} /> Adiar p/ {monthLabelShort(addMonths(ymOf(t.date), 1))}
          </button>
        </div>
      )}
    </li>
  );
}

/* ============ ORÇAMENTO ============ */
function Orcamento({ tx, ym, onNav, onAdd, api }) {
  const [tab, setTab] = React.useState('despesas');
  const [selMode, setSelMode] = React.useState(false);
  const [sel, setSel] = React.useState([]);
  React.useEffect(() => { setSelMode(false); setSel([]); }, [tab, ym]);

  const month = tx.filter(t => ymOf(t.date) === ym);
  const ef = month.filter(t => (t.status || 'efetivado') === 'efetivado');
  const prev = month.filter(t => t.status === 'previsto');
  const receitas = ef.filter(t => t.type === 'receita');
  const despesas = ef.filter(t => t.type === 'despesa');
  const totalR = receitas.reduce((s, t) => s + effAmt(t), 0);
  const totalD = despesas.reduce((s, t) => s + effAmt(t), 0);
  const saldo = totalR - totalD;

  const list = tab === 'receitas' ? receitas : tab === 'despesas' ? despesas
    : [...prev].sort((a, b) => a.date.localeCompare(b.date));
  const sorted = tab === 'provisoes' ? list : [...list].sort((a, b) => b.date.localeCompare(a.date));
  const selType = tab === 'receitas' ? 'receita' : tab === 'despesas' ? 'despesa' : null;

  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const exit = () => { setSelMode(false); setSel([]); };

  return (
    <div className="scr scroll">
      <header className="page-head">
        <div><span className="eyebrow">Orçamento mensal</span><h2 className="h-title">Orçamento</h2></div>
        <MonthNav ym={ym} onNav={onNav} />
      </header>

      <div className="summary-3">
        <div className="sum up"><span>Recebido</span><b className="gm-num">{fmtShort(totalR)}</b></div>
        <div className="sum down"><span>Pago</span><b className="gm-num">{fmtShort(totalD)}</b></div>
        <div className="sum bal"><span>Saldo</span><b className="gm-num">{fmtShort(saldo)}</b></div>
      </div>

      <section className="card">
        <div className="card-head"><div><span className="eyebrow">Regra 50 / 30 / 20</span><h3>Como você alocou</h3></div></div>
        <Allocation tx={ef} />
      </section>

      <div className="seg seg-page tri">
        <button className={tab === 'receitas' ? 'on pos' : ''} onClick={() => setTab('receitas')}>
          <Icon name="arrowUp" size={15} stroke={2.6} /> Receitas
        </button>
        <button className={tab === 'despesas' ? 'on neg' : ''} onClick={() => setTab('despesas')}>
          <Icon name="arrowDown" size={15} stroke={2.6} /> Despesas
        </button>
        <button className={tab === 'provisoes' ? 'on' : ''} onClick={() => setTab('provisoes')}>
          <Icon name="calendar" size={14} stroke={2.4} /> Provisões{prev.length ? ` (${prev.length})` : ''}
        </button>
      </div>

      <div className="list-toolbar">
        <span className="muted">{sorted.length} {tab === 'provisoes' ? 'previstas' : 'efetivadas'}</span>
        {sorted.length > 0 && (
          selMode
            ? <button className="link-btn" onClick={exit}>Concluir</button>
            : <button className="link-btn" onClick={() => setSelMode(true)}><Icon name="edit" size={15} stroke={2.2} /> Selecionar</button>
        )}
      </div>

      {tab === 'provisoes' ? (
        sorted.length ? (
          <ul className="prov-list">
            {sorted.map(t => <ProvRow key={t.id} t={t} selectMode={selMode} selected={sel.includes(t.id)} onToggle={toggle}
              onEfetivar={api.openEfetivar} onDefer={api.deferTx} />)}
          </ul>
        ) : <div className="empty-box"><Icon name="checkCircle" size={26} /><p>Sem provisões em {monthLabelShort(ym)}.</p></div>
      ) : (
        <ul className="tx-list card flush" style={{ marginTop: 12 }}>
          {sorted.length ? sorted.map(t => <TxRow key={t.id} t={t} onDel={api.delTx} selectMode={selMode} selected={sel.includes(t.id)} onToggle={toggle} />)
            : <li className="tx-empty">Nada efetivado em {monthLabelShort(ym)}.</li>}
        </ul>
      )}

      <button className="btn-ghost full" style={{ marginTop: 14 }} onClick={onAdd}>
        <Icon name="plus" size={18} stroke={2.6} style={{ color: 'var(--gm-green)' }} /> Novo lançamento
      </button>
      <div className="scroll-pad" />

      <BatchBar count={sel.length} showEfetivar={tab === 'provisoes'}
        onCancel={exit}
        onEfetivar={() => { api.batchEfetivar(sel); exit(); }}
        onCategoria={() => api.openPicker('categoria', selType, sel, () => exit())}
        onConta={() => api.openPicker('conta', selType, sel, () => exit())}
        onExcluir={() => { api.batchDel(sel); exit(); }} />
    </div>
  );
}

/* ============ CARTÕES ============ */
function Cartoes({ cards, cardTx, api }) {
  const [sel, setSel] = React.useState(cards[0]?.id);
  const [selMode, setSelMode] = React.useState(false);
  const [picked, setPicked] = React.useState([]);
  React.useEffect(() => { setSelMode(false); setPicked([]); }, [sel]);
  const card = cards.find(c => c.id === sel) || cards[0];
  const pct = card.used / card.limit;
  const purchases = cardTx.filter(t => t.card === sel);
  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const exit = () => { setSelMode(false); setPicked([]); };

  return (
    <div className="scr scroll">
      <header className="page-head">
        <div><span className="eyebrow">Faturas & limites</span><h2 className="h-title">Cartões</h2></div>
        <button className="icon-btn solid" onClick={() => api.openCardEdit({ id: 'new', name: 'Novo cartão', brand: 'Mastercard', last: '0000', grad: 'linear-gradient(135deg,#22C55E,#166534 90%)', limit: 5000, used: 0, due: 10, closing: 1 })}><Icon name="plus" size={20} stroke={2.4} /></button>
      </header>

      <div className="card-carousel">
        {cards.map(c => (
          <button key={c.id} className={'credit-card' + (c.id === sel ? ' on' : '')} style={{ background: c.grad }} onClick={() => setSel(c.id)}>
            <div className="cc-top"><span className="gm-wordmark on-dark" style={{ fontSize: 15 }}><span className="g">Green</span><span className="m">Mind</span></span><Icon name="wallet" size={22} /></div>
            <div className="cc-num gm-num">•••• •••• •••• {c.last}</div>
            <div className="cc-foot"><div><small>Fatura atual</small><b className="gm-num">{fmt(c.used)}</b></div><span className="cc-brand">{c.brand}</span></div>
          </button>
        ))}
      </div>

      <section className="card">
        <div className="card-head">
          <div><span className="eyebrow">{card.name}</span><h3>Limite disponível</h3></div>
          <button className="icon-btn" onClick={() => api.openCardEdit(card)} aria-label="Editar cartão"><Icon name="edit" size={18} stroke={2.2} /></button>
        </div>
        <div className="limit-row">
          <b className="gm-num big">{fmt(card.limit - card.used)}</b>
          <span className="muted">de {fmt(card.limit)}</span>
        </div>
        <div className="limit-bar"><span style={{ width: `${pct * 100}%`, background: card.grad }} /></div>
        <div className="limit-meta">
          <div><small>Fatura</small><b className="gm-num">{fmt(card.used)}</b></div>
          <div><small>Fecha dia</small><b>{card.closing}/06</b></div>
          <div><small>Vence dia</small><b>{card.due}/06</b></div>
        </div>
        <button className="btn-primary full" style={{ marginTop: 16 }}>Pagar fatura</button>
      </section>

      <section className="card flush">
        <div className="card-head pad">
          <h3>Compras da fatura</h3>
          {purchases.length > 0 && (
            selMode
              ? <button className="link-btn" onClick={exit}>Concluir</button>
              : <button className="link-btn" onClick={() => setSelMode(true)}><Icon name="edit" size={15} stroke={2.2} /> Selecionar</button>
          )}
        </div>
        <ul className="tx-list">
          {purchases.map(t => {
            const c = CATEGORIES[t.cat];
            const checked = picked.includes(t.id);
            return (
              <li className={'tx-row' + (selMode ? ' selectable' : '') + (checked ? ' sel' : '')} key={t.id} onClick={selMode ? () => toggle(t.id) : undefined}>
                {selMode && <span className={'tx-check' + (checked ? ' on' : '')}>{checked && <Icon name="check" size={14} stroke={3} />}</span>}
                <CatAvatar cat={t.cat} />
                <div className="tx-meta">
                  <b>{t.title}</b>
                  <span>{c.label} · {fmtDay(t.date)}{t.parcels > 1 && <i className="tx-tag parc">{t.parcels}/{t.of}x</i>}</span>
                </div>
                <div className="tx-amt gm-num neg">− {fmt(t.amount)}</div>
              </li>
            );
          })}
        </ul>
      </section>
      <div className="scroll-pad" />

      <BatchBar count={picked.length} showEfetivar={false}
        onCancel={exit}
        onCategoria={() => api.openPicker('categoria', 'despesa', picked.map(id => 'card:' + id), () => exit())}
        onConta={() => api.openPicker('conta', 'despesa', picked.map(id => 'card:' + id), () => exit())}
        onExcluir={() => { api.batchDelCard(picked); exit(); }} />
    </div>
  );
}

Object.assign(window, { Allocation, MonthNav, Dashboard, TxRow, ProvRow, Orcamento, Cartoes });
