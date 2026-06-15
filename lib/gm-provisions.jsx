/* GREEN MIND — Provisões, efetivação (juros/multa), edição de cartão e edição em lote.
   Exports to window. */

/* ===== Efetivar uma provisão (receita recebida / despesa paga / aporte investido) ===== */
function EfetivarSheet({ tx, onClose, onConfirm }) {
  const open = !!tx;
  const [paidDate, setPaidDate] = React.useState(TODAY);
  const [jurosRaw, setJurosRaw] = React.useState('');
  React.useEffect(() => { if (tx) { setPaidDate(TODAY); setJurosRaw(''); } }, [tx && tx.id]);
  if (!tx) return <div className="sheet-wrap" />;

  const isRec = tx.type === 'receita';
  const verb = isRec ? 'Recebido' : (tx.acct === 'Investimentos' || tx.cat === 'investir' || tx.cat === 'reserva') ? 'Investido' : 'Pago';
  const juros = Math.round(parseFloat((jurosRaw || '0').replace(',', '.')) * 100) / 100 || 0;
  const total = tx.amount + juros;
  const late = isLate(tx.date);

  return (
    <div className={'sheet-wrap' + (open ? ' open' : '')}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button className="link-btn" onClick={onClose}>Cancelar</button>
          <strong>Efetivar lançamento</strong>
          <span style={{ width: 56 }} />
        </div>

        <div className="efx-card">
          <CatAvatar cat={tx.cat} />
          <div className="tx-meta"><b>{tx.title}</b><span>{CATEGORIES[tx.cat].label} · previsto {fmtDay(tx.date)}</span></div>
          <div className={'tx-amt gm-num ' + (isRec ? 'pos' : 'neg')}>{isRec ? '+' : '−'} {fmt(tx.amount)}</div>
        </div>

        {late && <div className="efx-late"><Icon name="bell" size={15} /> <span>Estava em atraso ({fmtDay(tx.date)}). Informe juros / multa, se houver.</span></div>}

        <label className="field"><span>Data em que foi {verb.toLowerCase()}</span>
          <div className="date-field">
            <Icon name="calendar" size={18} stroke={2.2} />
            <input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value || TODAY)} />
            <span className="date-month gm-num">{monthLabel(ymOf(paidDate))}</span>
          </div>
        </label>

        <label className="field"><span>{isRec ? 'Juros / acréscimo recebido' : 'Juros / multa pagos'} (opcional)</span>
          <div className="date-field">
            <span className="ad-cur" style={{ fontSize: 15 }}>R$</span>
            <input inputMode="decimal" placeholder="0,00" value={jurosRaw} onChange={e => setJurosRaw(e.target.value.replace(/[^\d.,]/g, ''))} style={{ flex: 1, fontFamily: 'var(--gm-num)' }} />
          </div>
        </label>

        <div className="efx-total">
          <span>Total {isRec ? 'recebido' : 'pago'}</span>
          <b className={'gm-num ' + (isRec ? 'pos' : 'neg')}>{isRec ? '+' : '−'} {fmt(total)}</b>
        </div>

        <button className="btn-primary big full" onClick={() => onConfirm(tx.id, { paidDate, juros })} style={{ marginTop: 6 }}>
          <Icon name="checkCircle" size={18} stroke={2.4} /> Confirmar — {verb.toLowerCase()}
        </button>
      </div>
    </div>
  );
}

/* ===== Editar cadastro do cartão ===== */
function CardEditSheet({ card, onClose, onSave }) {
  const open = !!card;
  const [f, setF] = React.useState({ name: '', limit: 0, closing: 1, due: 10, last: '' });
  React.useEffect(() => { if (card) setF({ name: card.name, limit: card.limit, closing: card.closing, due: card.due, last: card.last }); }, [card && card.id]);
  if (!card) return <div className="sheet-wrap" />;
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div className={'sheet-wrap' + (open ? ' open' : '')}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button className="link-btn" onClick={onClose}>Cancelar</button>
          <strong>Editar cartão</strong>
          <button className="link-btn strong" onClick={() => { onSave(card.id, { name: f.name.trim() || card.name, limit: Number(f.limit) || card.limit, closing: Number(f.closing), due: Number(f.due), last: (f.last || card.last).slice(-4) }); }}>Salvar</button>
        </div>

        <div className="credit-card on" style={{ background: card.grad, width: '100%', marginBottom: 6 }}>
          <div className="cc-top"><span className="gm-wordmark on-dark" style={{ fontSize: 15 }}><span className="g">Green</span><span className="m">Mind</span></span><Icon name="wallet" size={22} /></div>
          <div className="cc-num gm-num">•••• •••• •••• {(f.last || card.last).slice(-4)}</div>
          <div className="cc-foot"><div><small>{f.name}</small></div><span className="cc-brand">{card.brand}</span></div>
        </div>

        <div className="details" style={{ overflow: 'visible' }}>
          <label className="field"><span>Nome do cartão</span>
            <input value={f.name} onChange={e => set('name', e.target.value)} />
          </label>
          <div className="grid-2">
            <label className="field"><span>Limite (R$)</span>
              <input inputMode="numeric" value={f.limit} onChange={e => set('limit', e.target.value.replace(/[^\d]/g, ''))} className="gm-num" />
            </label>
            <label className="field"><span>Final (4 díg.)</span>
              <input inputMode="numeric" maxLength={4} value={f.last} onChange={e => set('last', e.target.value.replace(/[^\d]/g, ''))} className="gm-num" />
            </label>
          </div>
          <div className="grid-2">
            <label className="field"><span>Fecha dia</span>
              <input inputMode="numeric" maxLength={2} value={f.closing} onChange={e => set('closing', e.target.value.replace(/[^\d]/g, '').slice(0,2))} className="gm-num" />
            </label>
            <label className="field"><span>Vence dia</span>
              <input inputMode="numeric" maxLength={2} value={f.due} onChange={e => set('due', e.target.value.replace(/[^\d]/g, '').slice(0,2))} className="gm-num" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Barra de edição em lote (seleção de vários) ===== */
function BatchBar({ count, onEfetivar, onCategoria, onConta, onExcluir, onCancel, showEfetivar }) {
  if (count === 0) return null;
  return (
    <div className="batch-bar">
      <button className="bb-x" onClick={onCancel}><Icon name="arrowLeft" size={18} stroke={2.4} /></button>
      <b className="gm-num">{count} selecionado{count > 1 ? 's' : ''}</b>
      <div className="bb-actions">
        {showEfetivar && <button onClick={onEfetivar}><Icon name="checkCircle" size={19} stroke={2.2} /><span>Efetivar</span></button>}
        <button onClick={onCategoria}><Icon name="edit" size={18} stroke={2.2} /><span>Categoria</span></button>
        <button onClick={onConta}><Icon name="wallet" size={18} stroke={2.2} /><span>Conta</span></button>
        <button className="danger" onClick={onExcluir}><Icon name="trash" size={18} stroke={2.2} /><span>Excluir</span></button>
      </div>
    </div>
  );
}

/* ===== Picker genérico (categoria / conta) para edição em lote ===== */
function PickerSheet({ kind, type, onClose, onPick }) {
  const open = !!kind;
  if (!kind) return <div className="sheet-wrap" />;
  const isCat = kind === 'categoria';
  const cats = Object.entries(CATEGORIES).filter(([, c]) => !type || c.kind === type);
  const accts = ['Conta corrente', 'Cartão Verde', 'Cartão Lima', 'Investimentos'];
  return (
    <div className={'sheet-wrap' + (open ? ' open' : '')}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button className="link-btn" onClick={onClose}>Cancelar</button>
          <strong>{isCat ? 'Mudar categoria' : 'Mudar conta'}</strong>
          <span style={{ width: 56 }} />
        </div>
        {isCat ? (
          <div className="cat-grid" style={{ paddingTop: 6 }}>
            {cats.map(([k, c]) => (
              <button key={k} className="cat-pick" onClick={() => onPick({ cat: k })}>
                <span className="cp-ic" style={{ background: c.color + '1A', color: c.color }}><Icon name={c.icon} size={20} /></span>
                <small>{c.label}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="acct-row" style={{ paddingTop: 6 }}>
            {accts.map(a => <button key={a} className="chip" onClick={() => onPick({ acct: a })}>{a}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { EfetivarSheet, CardEditSheet, BatchBar, PickerSheet });
