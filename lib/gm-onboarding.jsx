/* GREEN MIND — Onboarding + Auth flow. Exports <Onboarding/> to window. */

const INTRO = [
  {
    art: 'balance',
    eyebrow: 'Visão geral',
    title: 'Todo o seu dinheiro,\num só lugar',
    body: 'Receitas, despesas, cartões e saldo real — atualizados em tempo real, sem planilha.',
  },
  {
    art: 'insight',
    eyebrow: 'Inteligência',
    title: 'Saiba para onde\nvai cada real',
    body: 'Relatórios claros e categorias automáticas mostram seus hábitos e onde economizar.',
  },
  {
    art: 'goals',
    eyebrow: 'Liberdade',
    title: 'Conquiste suas\nmetas mais rápido',
    body: 'Defina objetivos, acompanhe o progresso e deixe seu dinheiro crescer com você.',
  },
];

function IntroArt({ kind }) {
  if (kind === 'balance') {
    return (
      <div className="intro-art">
        <div className="ia-card ia-hero">
          <span className="ia-label">Saldo do mês</span>
          <strong className="gm-num">R$ 7.442,21</strong>
          <div className="ia-pills">
            <span className="ia-pill up"><Icon name="arrowUp" size={13} stroke={2.6}/> 13.612</span>
            <span className="ia-pill down"><Icon name="arrowDown" size={13} stroke={2.6}/> 6.170</span>
          </div>
        </div>
        <div className="ia-card ia-mini ia-f1"><CatAvatar cat="salario" size={34}/><div><b>Salário</b><span>+ R$ 9.800</span></div></div>
        <div className="ia-card ia-mini ia-f2"><CatAvatar cat="mercado" size={34}/><div><b>Mercado</b><span>− R$ 487</span></div></div>
      </div>
    );
  }
  if (kind === 'insight') {
    const segs = [{v:42,color:'#22C55E'},{v:26,color:'#F59E0B'},{v:18,color:'#3B82F6'},{v:14,color:'#8B5CF6'}];
    return (
      <div className="intro-art">
        <div className="ia-card ia-donut">
          <Donut data={segs.map(s=>({value:s.v,color:s.color}))} size={150} stroke={22}/>
          <div className="ia-donut-c"><b className="gm-num">62%</b><span>saudável</span></div>
        </div>
        <div className="ia-card ia-mini ia-f1"><div className="ia-dot" style={{background:'#22C55E'}}></div><div><b>Moradia</b><span>42%</span></div></div>
        <div className="ia-card ia-mini ia-f2"><div className="ia-dot" style={{background:'#F59E0B'}}></div><div><b>Mercado</b><span>26%</span></div></div>
      </div>
    );
  }
  return (
    <div className="intro-art">
      <div className="ia-card ia-goal">
        <Ring pct={0.65} size={108} stroke={11} color="#22C55E"><div className="ia-ring-c"><b className="gm-num">65%</b></div></Ring>
        <div className="ia-goal-meta"><b>Reserva</b><span className="gm-num">R$ 19.500 / 30.000</span></div>
      </div>
      <div className="ia-card ia-mini ia-f1"><div className="ia-dot" style={{background:'#3B82F6'}}></div><div><b>Viagem</b><span>57%</span></div></div>
      <div className="ia-card ia-mini ia-f2"><Icon name="check" size={16} stroke={3} style={{color:'#22C55E'}}/><div><b>Curso UX</b><span>Concluída</span></div></div>
    </div>
  );
}

function Onboarding({ onDone, setDark }) {
  const [stage, setStage] = React.useState('splash'); // splash | intro | auth
  const [step, setStep] = React.useState(0);
  const [mode, setMode] = React.useState('login'); // login | signup
  const [show, setShow] = React.useState(false);

  React.useEffect(() => { setDark && setDark(stage === 'splash'); }, [stage]);

  React.useEffect(() => {
    if (stage !== 'splash') return;
    const t = setTimeout(() => setStage('intro'), 2100);
    return () => clearTimeout(t);
  }, [stage]);

  /* ---------- SPLASH ---------- */
  if (stage === 'splash') {
    return (
      <div className="ob splash">
        <div className="splash-glow"></div>
        <div className="splash-mark">
          <img src="assets/logo-mark.png" alt="GreenMind" />
          <div className="gm-wordmark on-dark" style={{ fontSize: 34 }}><span className="g">Green</span><span className="m">Mind</span></div>
          <span className="splash-tag">Cresça com inteligência.</span>
        </div>
        <div className="splash-loader"><span></span></div>
      </div>
    );
  }

  /* ---------- INTRO SLIDES ---------- */
  if (stage === 'intro') {
    const s = INTRO[step];
    const last = step === INTRO.length - 1;
    return (
      <div className="ob intro">
        <div className="intro-top">
          <div className="gm-wordmark" style={{ fontSize: 20 }}><span className="g">Green</span><span className="m">Mind</span></div>
          <button className="link-btn" onClick={() => setStage('auth')}>Pular</button>
        </div>
        <div className="intro-stage" key={step}>
          <IntroArt kind={s.art} />
          <div className="intro-copy">
            <span className="eyebrow">{s.eyebrow}</span>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </div>
        </div>
        <div className="intro-foot">
          <div className="dots">
            {INTRO.map((_, i) => <span key={i} className={'dot' + (i === step ? ' on' : '')} onClick={() => setStep(i)} />)}
          </div>
          <button className="btn-primary big" onClick={() => last ? setStage('auth') : setStep(step + 1)}>
            {last ? 'Começar agora' : 'Avançar'} <Icon name="arrowRight" size={18} stroke={2.6} />
          </button>
        </div>
      </div>
    );
  }

  /* ---------- AUTH ---------- */
  return (
    <div className="ob auth">
      <div className="auth-head">
        <div className="auth-mark"><img src="assets/logo-mark.png" alt="" /></div>
        <h2>{mode === 'login' ? 'Bem-vinda de volta' : 'Crie sua conta'}</h2>
        <p>{mode === 'login' ? 'Entre para continuar cuidando do seu dinheiro.' : 'Leva menos de um minuto para começar.'}</p>
      </div>

      <div className="auth-form">
        {mode === 'signup' && (
          <label className="field"><span>Nome completo</span><input defaultValue="Marina Alves" /></label>
        )}
        <label className="field"><span>E-mail</span><input type="email" defaultValue="marina@greenmind.app" /></label>
        <label className="field"><span>Senha</span>
          <div className="field-pw">
            <input type={show ? 'text' : 'password'} defaultValue="senha1234" />
            <button onClick={() => setShow(!show)} aria-label="mostrar senha"><Icon name={show ? 'eyeoff' : 'eye'} size={20} /></button>
          </div>
        </label>
        {mode === 'login' && <button className="link-btn right">Esqueci minha senha</button>}

        <button className="btn-primary big full" onClick={onDone}>
          {mode === 'login' ? 'Entrar' : 'Criar conta'} <Icon name="arrowRight" size={18} stroke={2.6} />
        </button>

        <div className="auth-or"><span>ou</span></div>
        <button className="btn-ghost full" onClick={onDone}><Icon name="check" size={18} stroke={2.6} style={{color:'var(--gm-green)'}}/> Entrar com biometria</button>
      </div>

      <p className="auth-switch">
        {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
        <button className="link-btn" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Criar agora' : 'Entrar'}
        </button>
      </p>
    </div>
  );
}

Object.assign(window, { Onboarding });
