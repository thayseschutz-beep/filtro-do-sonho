/* GREEN MIND — Add transaction bottom sheet.
   Now supports: real date (mês segue a data), situação Efetivado/Provisão,
   e recorrência em lote (provisões mensais). Exports <AddSheet/> to window. */

function AddSheet({ open, onClose, onSave }) {
  const [type, setType] = React.useState('despesa');
  const [raw, setRaw] = React.useState('0');     // cents as string
  const [cat, setCat] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [acct, setAcct] = React.useState('Conta corrente');
  const [date, setDate] = React.useState(TODAY);
  const [situ, setSitu] = React.useState('efetivado');  // efetivado | previsto
  const [repeat, setRepeat] = React.useState(false);
  const [months, setMonths] = React.useState(6);
  const [step, setStep] = React.useState('value'); // value | details
  const cents = parseInt(raw || '0', 10);
  const value = cents / 100;

  React.useEffect(() => {
    if (open) {
      setType('despesa'); setRaw('0'); setCat(null); setTitle('');
      setAcct('Conta corrente'); setDate(TODAY); setSitu('efetivado');
      setRepeat(false); setMonths(6); setStep('value');
    }
  }, [open]);

  // Repetir em lote sempre gera provisões (só efetivam quando recebido/pago)
  const lote = repeat && months > 1;
  React.useEffect(() => { if (lote) setSitu('previsto'); }, [lote]);

  const press = (k) => {
    setRaw(r => {
      if (k === 'del') return r.length <= 1 ? '0' : r.slice(0, -1);
      if (r === '0') r = '';
      if (r.length >= 9) return r;
      return r + k;
    });
  };

  const cats = Object.entries(CATEGORIES).filter(([, c]) => c.kind === type);
  const bucket = cat ? CATEGORIES[cat].bucket : null;
  const canSave = value > 0 && cat && date;

  const save = () => {
    const base = {
      type, cat, amount: value,
      title: title.trim() || CATEGORIES[cat].label, acct,
    };
    if (lote) {
      const rid = 'r' + Date.now();
      const startYm = ymOf(date);
      const batch = Array.from({ length: months }, (_, i) => ({
        ...base,
        id: 't' + Date.now() + '_' + i,
        date: sameDayIn(date, addMonths(startYm, i)),
        status: 'previsto', recur: 'lote', recurId: rid,
      }));
      onSave(batch);
    } else {
      onSave({ ...base, id: 't' + Date.now(), date, status: situ });
    }
    onClose();
  };

  const display = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lastDate = lote ? sameDayIn(date, addMonths(ymOf(date), months - 1)) : date;

  return (
    <div className={'sheet-wrap' + (open ? ' open' : '')}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button className="link-btn" onClick={onClose}>Cancelar</button>
          <strong>{lote ? 'Lançamento em lote' : 'Novo lançamento'}</strong>
          <button className="link-btn strong" disabled={!canSave} onClick={save}>Salvar</button>
        </div>

        <div className="seg">
          <button className={type === 'despesa' ? 'on neg' : ''} onClick={() => { setType('despesa'); setCat(null); }}>Despesa</button>
          <button className={type === 'receita' ? 'on pos' : ''} onClick={() => { setType('receita'); setCat(null); }}>Receita</button>
        </div>

        {step === 'value' ? (
          <>
            <div className="amount-display">
              <span className={'ad-sign ' + (type === 'receita' ? 'pos' : 'neg')}>{type === 'receita' ? '+' : '−'}</span>
              <span className="ad-cur">R$</span>
              <span className="ad-val gm-num">{display}</span>
            </div>
            <div className="keypad">
              {['1','2','3','4','5','6','7','8','9','00','0','del'].map(k => (
                <button key={k} className={'key' + (k === 'del' ? ' del' : '')} onClick={() => press(k)}>
                  {k === 'del' ? <Icon name="arrowLeft" size={22} /> : k}
                </button>
              ))}
            </div>
            <button className="btn-primary big full" disabled={value <= 0} onClick={() => setStep('details')}>
              Continuar <Icon name="arrowRight" size={18} stroke={2.6} />
            </button>
          </>
        ) : (
          <div className="details scroll">
            <div className="det-amount">
              <span className="muted">Valor</span>
              <b className={'gm-num ' + (type === 'receita' ? 'pos' : 'neg')} onClick={() => setStep('value')}>{type === 'receita' ? '+' : '−'} R$ {display}</b>
            </div>

            <label className="field"><span>Descrição</span>
              <input placeholder={'Ex.: ' + (type === 'receita' ? 'Salário' : 'Mercado')} value={title} onChange={e => setTitle(e.target.value)} />
            </label>

            {/* Data — define o mês do lançamento */}
            <label className="field"><span>{type === 'receita' ? 'Data de recebimento' : 'Data de pagamento'}</span>
              <div className="date-field">
                <Icon name="calendar" size={18} stroke={2.2} />
                <input type="date" value={date} min="2020-01-01" max="2030-12-31" onChange={e => setDate(e.target.value || TODAY)} />
                <span className="date-month gm-num">{monthLabel(ymOf(date))}</span>
              </div>
            </label>

            {/* Situação */}
            <span className="field-label">Situação</span>
            <div className="seg situ">
              <button className={situ === 'efetivado' ? 'on pos' : ''} disabled={lote} onClick={() => setSitu('efetivado')}>
                <Icon name="checkCircle" size={16} stroke={2.4} /> {type === 'receita' ? 'Recebido' : 'Pago'}
              </button>
              <button className={situ === 'previsto' ? 'on' : ''} onClick={() => setSitu('previsto')}>
                <Icon name="calendar" size={15} stroke={2.2} /> Provisão
              </button>
            </div>
            <p className="situ-note">
              {situ === 'efetivado'
                ? `Entra no saldo já efetivado de ${monthLabelShort(ymOf(date))}.`
                : 'Fica como previsto — só entra no saldo quando você efetivar.'}
            </p>

            {/* Recorrência / Lote */}
            <button className={'repeat-row' + (repeat ? ' on' : '')} onClick={() => setRepeat(r => !r)}>
              <span className="rr-ic"><Icon name="calendar" size={17} stroke={2.2} /></span>
              <div className="rr-txt">
                <b>Repetir todo mês</b>
                <span>{type === 'receita' ? 'Receita' : 'Despesa'} recorrente em lote (provisões)</span>
              </div>
              <i className={'rr-switch' + (repeat ? ' on' : '')}><i /></i>
            </button>
            {repeat && (
              <div className="lote-box">
                <div className="lote-step">
                  <span>Por quantos meses?</span>
                  <div className="stepper">
                    <button onClick={() => setMonths(m => Math.max(2, m - 1))} disabled={months <= 2}><Icon name="arrowLeft" size={16} stroke={2.6} /></button>
                    <b className="gm-num">{months}</b>
                    <button onClick={() => setMonths(m => Math.min(36, m + 1))} disabled={months >= 36}><Icon name="arrowRight" size={16} stroke={2.6} /></button>
                  </div>
                </div>
                <div className="lote-hint">
                  <Icon name="sparkle" size={15} /> {months} provisões de <b>R$ {display}</b> · {monthLabelShort(ymOf(date))} → {monthLabelShort(ymOf(lastDate))}
                </div>
              </div>
            )}

            <span className="field-label">Categoria</span>
            <div className="cat-grid">
              {cats.map(([k, c]) => (
                <button key={k} className={'cat-pick' + (cat === k ? ' on' : '')} onClick={() => setCat(k)}
                  style={cat === k ? { borderColor: c.color, background: c.color + '12' } : {}}>
                  <span className="cp-ic" style={{ background: c.color + '1A', color: c.color }}><Icon name={c.icon} size={20} /></span>
                  <small>{c.label}</small>
                </button>
              ))}
            </div>

            {type === 'despesa' && bucket && (
              <div className="bucket-hint" style={{ background: BUCKETS[bucket].tint, color: BUCKETS[bucket].color }}>
                <Icon name="budget" size={15} stroke={2.4} /> Conta na regra <b>{BUCKETS[bucket].label}</b> · meta {BUCKETS[bucket].target}%
              </div>
            )}

            <span className="field-label">Conta</span>
            <div className="acct-row">
              {['Conta corrente', 'Cartão Verde', 'Cartão Lima', 'Investimentos'].map(a => (
                <button key={a} className={'chip' + (acct === a ? ' on' : '')} onClick={() => setAcct(a)}>{a}</button>
              ))}
            </div>

            <button className="btn-primary big full" disabled={!canSave} onClick={save} style={{ marginTop: 18 }}>
              <Icon name="check" size={18} stroke={2.8} /> {lote ? `Lançar ${months} provisões` : 'Salvar lançamento'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { AddSheet });
