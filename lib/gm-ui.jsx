/* GREEN MIND — UI primitives: charts, rings, sparkline, pills. Exports to window. */

/* Animated number that counts up — initialised to the target value so it is
   always correct even if a throttled iframe freezes requestAnimationFrame. */
function useCountUp(value, dur = 700) {
  const [v, setV] = React.useState(value);
  const prev = React.useRef(value);
  React.useEffect(() => {
    const from = prev.current, to = value;
    if (from === to) return;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setV(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(tick); else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return v;
}

/* Donut / ring progress */
function Ring({ pct, size = 60, stroke = 7, color = '#22C55E', track = 'rgba(15,36,25,.10)', children, rounded = true }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap={rounded ? 'round' : 'butt'}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>}
    </div>
  );
}

/* Multi-segment donut (distribuição por categoria) */
function Donut({ data, size = 132, stroke = 20 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(15,36,25,.06)" strokeWidth={stroke} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const dash = `${c * frac} ${c * (1 - frac)}`;
        const off = -c * acc;
        acc += frac;
        return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={d.color}
          strokeWidth={stroke} strokeDasharray={dash} strokeDashoffset={off}
          style={{ transition: 'stroke-dasharray .9s cubic-bezier(.22,1,.36,1)' }} />;
      })}
    </svg>
  );
}

/* Area line chart — receitas vs despesas */
function AreaChart({ series, height = 150, pad = 8 }) {
  const W = 320, H = height;
  const all = series.flatMap(s => s.points);
  const max = Math.max(...all) * 1.12, min = 0;
  const n = series[0].points.length;
  const x = (i) => pad + (i * (W - pad * 2)) / (n - 1);
  const y = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2 - 10);
  const line = (pts) => pts.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const area = (pts) => `${line(pts)} L${x(n-1)},${H-pad} L${x(0)},${H-pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={s.fill ?? .22} />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0.25, 0.5, 0.75].map((g, i) => (
        <line key={i} x1={pad} x2={W-pad} y1={pad + g*(H-pad*2)} y2={pad + g*(H-pad*2)} stroke="rgba(15,36,25,.06)" strokeWidth="1" />
      ))}
      {series.map((s, i) => <path key={'a'+i} d={area(s.points)} fill={`url(#area-${i})`} />)}
      {series.map((s, i) => (
        <path key={'l'+i} d={line(s.points)} fill="none" stroke={s.color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 1000, strokeDashoffset: 0, animation: `draw .9s ${i*.12}s cubic-bezier(.4,0,.2,1) both` }} />
      ))}
      {series.map((s, i) => (
        <circle key={'d'+i} cx={x(n-1)} cy={y(s.points[n-1])} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2.5" />
      ))}
    </svg>
  );
}

/* Tiny sparkline */
function Spark({ points, color = '#22C55E', w = 64, h = 26 }) {
  const max = Math.max(...points), min = Math.min(...points);
  const x = (i) => (i * w) / (points.length - 1);
  const y = (v) => h - 2 - ((v - min) / ((max - min) || 1)) * (h - 4);
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  return (
    <svg width={w} height={h}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Category avatar bubble */
function CatAvatar({ cat, size = 44 }) {
  const c = CATEGORIES[cat];
  if (!c) return null;
  return (
    <div style={{ width: size, height: size, borderRadius: size * .32, display: 'grid', placeItems: 'center',
      background: c.color + '1A', color: c.color, flex: 'none' }}>
      <Icon name={c.icon} size={size * .5} stroke={2.1} />
    </div>
  );
}

Object.assign(window, { useCountUp, Ring, Donut, AreaChart, Spark, CatAvatar });
