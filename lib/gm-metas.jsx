/* GREEN MIND — Filtro do Sonho (Metas) + Relatórios. Exports to window. */

function daysLeft(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline + 'T12:00:00').getTime() - new Date('2026-06-08T12:00:00').getTime()) / 86400000);
}

/* ============ FILTRO DO SONHO (Metas) ============ */
function Metas() {
  const [open, setOpen] = React.useState(GOALS.find(g => !g.completed)?.id || null);
  const active = GOALS.filter(g => !g.completed);
  const done = GOALS.filter(g => g.completed);
  const totalSaved = active.reduce((s, g) => s + g.saved, 0);
  const totalTarget = active.reduce((s, g) => s + g.target, 0);

  return (
    <div className="scr scroll">
      <header className="page-head">
        <div><span className="eyebrow">{active.length} em andamento</span><h2 className="h-title">Metas <Icon name="target" size={20} style={{ color: 'var(--gm-green-600)' }} /></h2></div>
        <button className="icon-btn solid"><Icon name="plus" size={20} stroke={2.4} /></button>
      </header>

      <section className="goals-hero">
        <Ring pct={totalSaved / totalTarget} size={86} stroke={10} color="#fff" track="rgba(255,255,255,.25)">
          <div className="gh-ring"><b className="gm-num">{Math.round(totalSaved / totalTarget * 100)}%</b></div>
        </Ring>
        <div>
          <span>Você já guardou</span>
          <strong className="gm-num">{fmt(totalSaved)}</strong>
          <small className="gm-num">de {fmt(totalTarget)} nas suas metas</small>
        </div>
      </section>

      <div className="goal-stack">
        {active.map(g => {
          const pct = g.target ? Math.min(g.saved / g.target * 100, 100) : 0;
          const dl = daysLeft(g.deadline);
          const isOpen = open === g.id;
          return (
            <div className={'dream-card' + (isOpen ? ' open' : '')} key={g.id}>
              <button className="dc-head" onClick={() => setOpen(isOpen ? null : g.id)}>
                <span className="dc-ic" style={{ background: g.color + '1A', color: g.color }}><Icon name="target" size={20} /></span>
                <div className="dc-title">
                  <b>{g.title}</b>
                  <span>{GOAL_CATS[g.cat]}</span>
                </div>
                <Icon name="chevDown" size={18} stroke={2.4} style={{ color: 'var(--gm-slate-2)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: '.25s' }} />
              </button>

              <div className="dc-progress">
                <div className="dc-amts">
                  <b className="gm-num" style={{ color: g.color }}>{fmt(g.saved)}</b>
                  <span className="muted gm-num">/ {fmt(g.target)}</span>
                </div>
                <div className="dc-bar"><span style={{ width: `${pct}%`, background: g.color }} /></div>
                <div className="dc-sub">
                  <span className="gm-num">{pct.toFixed(0)}%</span>
                  {dl !== null && (
                    <span className={'dc-days' + (dl < 0 ? ' late' : dl < 60 ? ' soon' : '')}>
                      <Icon name="calendar" size={12} /> {dl < 0 ? `${Math.abs(dl)}d atrasada` : `${dl} dias restantes`}
                    </span>
                  )}
                </div>
              </div>

              {isOpen && (g.achieve || g.stop || g.how) && (
                <div className="method">
                  {g.achieve && <div className="method-col achieve"><span><Icon name="flag" size={13} stroke={2.4} /> Alcançar</span><p>{g.achieve}</p></div>}
                  {g.stop && <div className="method-col stop"><span><Icon name="stop" size={13} stroke={2.4} /> Parar</span><p>{g.stop}</p></div>}
                  {g.how && <div className="method-col how"><span><Icon name="rocket" size={13} stroke={2.4} /> Como</span><p>{g.how}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <div className="done-section">
          <span className="done-head"><Icon name="checkCircle" size={16} stroke={2.2} style={{ color: 'var(--gm-green)' }} /> {done.length} meta{done.length > 1 ? 's' : ''} concluída{done.length > 1 ? 's' : ''}</span>
          {done.map(g => (
            <div className="done-row" key={g.id}>
              <Icon name="checkCircle" size={18} stroke={2.2} style={{ color: 'var(--gm-green)' }} />
              <b>{g.title}</b>
              <span className="gm-num">{fmt(g.target)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="scroll-pad" />
    </div>
  );
}

/* ============ RELATÓRIOS ============ */
function Relatorios({ tx, onBack }) {
  const despesas = tx.filter(t => t.type === 'despesa');
  const total = despesas.reduce((s, t) => s + t.amount, 0);
  const byCat = {};
  despesas.forEach(t => { byCat[t.cat] = (byCat[t.cat] || 0) + t.amount; });
  const rows = Object.entries(byCat).map(([k, v]) => ({ cat: k, value: v })).sort((a, b) => b.value - a.value);
  const max = rows[0]?.value || 1;
  const donut = rows.slice(0, 6).map(r => ({ value: r.value, color: CATEGORIES[r.cat].color }));

  return (
    <div className="scr scroll">
      <header className="page-head">
        <button className="icon-btn ghost" onClick={onBack}><Icon name="arrowLeft" size={20} /></button>
        <div className="ph-center"><span className="eyebrow">Últimos 6 meses</span><h2 className="h-title">Relatórios</h2></div>
        <span style={{ width: 40 }} />
      </header>

      <section className="card">
        <span className="eyebrow">Total de gastos</span>
        <div className="rep-total gm-num">{fmt(total)}</div>
        <div className="rep-vs"><span className="pos gm-num">↓ 12%</span> vs. mês anterior</div>
        <AreaChart series={[{ points: EVOLUTION.map(e => e.des), color: '#EF4444', fill: .14 }]} height={120} />
        <div className="x-axis">{EVOLUTION.map(e => <span key={e.m}>{e.m}</span>)}</div>
      </section>

      <section className="card flush">
        <div className="card-head pad"><h3>Por categoria</h3></div>
        <ul className="rep-list">
          {rows.map(r => (
            <li key={r.cat}>
              <CatAvatar cat={r.cat} size={38} />
              <div className="rep-bar-wrap">
                <div className="rep-bar-top"><span>{CATEGORIES[r.cat].label}</span><b className="gm-num">{fmt(r.value)}</b></div>
                <div className="rep-bar"><span style={{ width: `${r.value / max * 100}%`, background: CATEGORIES[r.cat].color }} /></div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <div className="scroll-pad" />
    </div>
  );
}

Object.assign(window, { Metas, Relatorios });
