"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./landing.css";

/* ---- small inline check icon for plan features ---- */
function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

type Cycle = "m" | "a";

type Plan = {
  name: string;
  desc: string;
  price: { m: string; a: string };
  billedA: string;
  feature?: boolean;
  badge?: string;
  feats: { text: string; lead?: boolean }[];
};

const PLANS: Plan[] = [
  {
    name: "Essencial",
    desc: "Pra quem quer organizar o próprio dinheiro e o MEI, sozinho.",
    price: { m: "29", a: "24" },
    billedA: "Cobrado R$ 290/ano",
    feats: [
      { text: "Lançamentos ilimitados" },
      { text: "Regra 50/30/20 automática" },
      { text: "1 cartão de crédito" },
      { text: "Controle de MEI" },
      { text: "Relatórios do mês" },
    ],
  },
  {
    name: "Pro",
    desc: "O completo: todos os recursos pra dominar suas finanças.",
    price: { m: "49", a: "41" },
    billedA: "Cobrado R$ 490/ano",
    feature: true,
    badge: "Mais popular",
    feats: [
      { text: "Tudo do Essencial, e mais:", lead: true },
      { text: "Cartões ilimitados" },
      { text: "Relatórios e comparativos completos" },
      { text: "Metas ilimitadas com método" },
      { text: "Exportação de dados" },
    ],
  },
  {
    name: "Família",
    desc: "Pra casais e famílias — dois MEIs e dados compartilhados.",
    price: { m: "69", a: "58" },
    billedA: "Cobrado R$ 690/ano",
    feats: [
      { text: "Tudo do Pro, e mais:", lead: true },
      { text: "2 MEIs no mesmo plano" },
      { text: "Compartilhamento em tempo real do casal" },
      { text: "Até 4 perfis" },
      { text: "Suporte prioritário" },
    ],
  },
];

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cycle, setCycle] = useState<Cycle>("m");

  useEffect(() => {
    const saved = (localStorage.getItem("gm_theme") as "light" | "dark") || "light";
    setTheme(saved);
  }, []);

  function toggleTheme() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("gm_theme", next);
      return next;
    });
  }

  return (
    <div className="gm-site" data-theme={theme === "dark" ? "dark" : undefined}>
      {/* NAV */}
      <nav>
        <div className="wrap nav-in">
          <div className="brand">
            <svg className="brand-mark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="100" height="100" rx="24" fill="#0F2419" />
              <path d="M50 28c-13 0-22 9-22 22 0 9 5 16 13 19-1-9 3-16 11-20-6 6-8 13-6 21 9-1 18-9 18-22 0-12-7-20-14-20Z" fill="#22C55E" />
            </svg>
            <div className="gm-wordmark"><span className="g">Green</span><span className="m">Mind</span></div>
          </div>
          <div className="nav-links">
            <a href="#recursos">Recursos</a>
            <a href="#regra">Regra 50/30/20</a>
            <a href="#sonho">Metas</a>
            <a href="#como">Como funciona</a>
            <a href="#precos">Preços</a>
          </div>
          <div className="nav-cta">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema claro/escuro">
              {theme === "dark" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z" /></svg>
              )}
            </button>
            <Link href="/login" className="btn btn-ghost">Entrar</Link>
            <Link href="/login" className="btn btn-primary">Criar conta</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <span className="pill"><i /> Controle financeiro pessoal · simples e seguro</span>
            <h1>Dinheiro que <span className="accent">cresce</span> com clareza.</h1>
            <p className="lead">Organize receitas e despesas, domine a regra 50/30/20 e veja seus sonhos saírem do papel — tudo num app simples, para todas as idades.</p>
            <div className="hero-actions">
              <Link href="/login" className="btn btn-primary btn-lg">Começar agora →</Link>
              <a href="#como" className="btn btn-ghost btn-lg">Ver como funciona</a>
            </div>
            <div className="stores">
              <span className="rate"><span className="stars">★★★★★</span> 4,9</span>
              <span>+120 mil pessoas organizando o dinheiro</span>
            </div>
          </div>
          <div className="hero-phone">
            <div className="device">
              <div className="device-screen">
                <div className="ds-status"><span className="num">9:41</span><span className="num">96%</span></div>
                <div className="ds-hero">
                  <div className="ds-hero-top"><span>Saldo do mês · Junho</span><span className="ds-rate num">56%</span></div>
                  <div className="ds-amount num">R$ 7.604,80</div>
                  <div className="ds-chips">
                    <div className="ds-chip"><small>Receitas</small><b className="num">R$ 13.612</b></div>
                    <div className="ds-chip"><small>Despesas</small><b className="num">R$ 6.007</b></div>
                  </div>
                </div>
                <div className="ds-card">
                  <div className="ds-card-h">REGRA 50 / 30 / 20</div>
                  <div className="ds-alloc">
                    <div className="ds-arow"><span className="ds-dot" style={{ background: "#38BDF8" }} /><span className="ds-lab">Essencial</span><span className="ds-bar"><i style={{ width: "54%", background: "#38BDF8" }} /></span></div>
                    <div className="ds-arow"><span className="ds-dot" style={{ background: "#FBBF24" }} /><span className="ds-lab">Pessoal</span><span className="ds-bar"><i style={{ width: "30%", background: "#FBBF24" }} /></span></div>
                    <div className="ds-arow"><span className="ds-dot" style={{ background: "#22C55E" }} /><span className="ds-lab">Investir</span><span className="ds-bar"><i style={{ width: "68%", background: "#22C55E" }} /></span></div>
                  </div>
                </div>
                <div className="ds-card ds-flush">
                  <div className="ds-tx"><span className="ds-tx-ic" style={{ background: "#DCFCE7", color: "#16A34A" }}>＋</span><div className="ds-tx-m"><b>Salário</b><span>Receita · 5 jun</span></div><span className="ds-tx-a pos num">+ R$ 9.800</span></div>
                  <div className="ds-tx"><span className="ds-tx-ic" style={{ background: "#E0F2FE", color: "#0EA5E9" }}>⌂</span><div className="ds-tx-m"><b>Aluguel</b><span>Essencial · 5 jun</span></div><span className="ds-tx-a neg num">− R$ 2.100</span></div>
                </div>
              </div>
            </div>
            <div className="float-card fc-1">
              <span className="fc-ic" style={{ background: "#DCFCE7", color: "#16A34A" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></svg></span>
              <div><small>Taxa de poupança</small><b className="num">56%</b></div>
            </div>
            <div className="float-card fc-2">
              <span className="fc-ic" style={{ background: "#FEF3C7", color: "#F59E0B" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></svg></span>
              <div><small>Meta · Reserva</small><b className="num">65% concluído</b></div>
            </div>
          </div>
        </div>
      </header>

      {/* TRUST */}
      <div className="trust">
        <div className="wrap trust-in">
          <div className="stat"><div className="big num">120 mil+</div><div className="lbl">pessoas usando</div></div>
          <div className="stat"><div className="big num">R$ 2,4 bi</div><div className="lbl">organizados no app</div></div>
          <div className="stat"><div className="big num">50/30/20</div><div className="lbl">orçamento guiado</div></div>
          <div className="stat"><div className="big num">4,9 ★</div><div className="lbl">nas lojas de apps</div></div>
        </div>
      </div>

      {/* RECURSOS */}
      <section className="block" id="recursos">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow2">Tudo num lugar</span>
            <h2>Seu dinheiro sob controle, sem esforço</h2>
            <p>Do salário ao sonho — o Green Mind acompanha cada real com a calma de quem sabe pra onde está indo.</p>
          </div>
          <div className="feat-grid">
            <div className="feat">
              <div className="f-ic" style={{ background: "var(--gm-grad-dark)", color: "#fff" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5" /><path d="M4 19h16" /><path d="M7 16l4-5 3 3 5-7" /></svg></div>
              <h3>Visão em tempo real</h3>
              <p>Saldo, receitas, despesas e taxa de poupança do mês — atualizados a cada lançamento.</p>
            </div>
            <div className="feat">
              <div className="f-ic" style={{ background: "#E0F2FE", color: "#0EA5E9" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 12V3.5" /><path d="M12 12l6 4.2" /></svg></div>
              <h3>Orçamento 50/30/20</h3>
              <p>Cada despesa entra em essencial, pessoal ou investimento — com metas e alertas automáticos.</p>
            </div>
            <div className="feat">
              <div className="f-ic" style={{ background: "#FEF3C7", color: "#F59E0B" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></svg></div>
              <h3>Metas</h3>
              <p>Metas com método: o que alcançar, o que parar e como fazer. Progresso e prazo sempre à vista.</p>
            </div>
            <div className="feat">
              <div className="f-ic" style={{ background: "#DCFCE7", color: "#16A34A" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M2.5 9.5h19" /><path d="M6 15h4" /></svg></div>
              <h3>Cartões &amp; faturas</h3>
              <p>Acompanhe limite, fatura e parcelas de cada cartão sem se perder no fim do mês.</p>
            </div>
            <div className="feat">
              <div className="f-ic" style={{ background: "#EDE9FE", color: "#8B5CF6" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v9l7 4" /><path d="M21 12a9 9 0 1 1-9-9" /></svg></div>
              <h3>Relatórios claros</h3>
              <p>Veja para onde foi cada categoria e compare meses sem precisar de planilha.</p>
            </div>
            <div className="feat">
              <div className="f-ic" style={{ background: "var(--gm-mint)", color: "var(--gm-forest)" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /><circle cx="17" cy="13.5" r="1.3" /></svg></div>
              <h3>Simples pra qualquer um</h3>
              <p>Linguagem sem jargão e telas grandes. Funciona pra você e pra sua família.</p>
            </div>
          </div>
        </div>
      </section>

      {/* REGRA 50/30/20 */}
      <section className="block" id="regra" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="showcase">
            <div className="showcase-in">
              <div>
                <span className="eyebrow2" style={{ color: "#86efac" }}>A regra que muda tudo</span>
                <h2 style={{ marginTop: 12 }}>50% essencial.<br />30% pessoal.<br />20% pro futuro.</h2>
                <p>O Green Mind classifica cada gasto automaticamente e mostra, em barras vivas, se você está dentro da meta. Sem culpa — só clareza pra ajustar a rota.</p>
                <Link href="/login" className="btn btn-primary btn-lg">Equilibrar meu orçamento →</Link>
              </div>
              <div className="alloc-demo">
                <div className="ad-row">
                  <div className="ad-top"><span className="lab"><i style={{ background: "#38BDF8" }} /> Essencial <small>meta 50%</small></span><span className="ad-val">47%</span></div>
                  <div className="ad-bar"><span style={{ width: "94%", background: "#38BDF8" }} /></div>
                </div>
                <div className="ad-row">
                  <div className="ad-top"><span className="lab"><i style={{ background: "#FBBF24" }} /> Pessoal <small>meta 30%</small></span><span className="ad-val">28%</span></div>
                  <div className="ad-bar"><span style={{ width: "93%", background: "#FBBF24" }} /></div>
                </div>
                <div className="ad-row">
                  <div className="ad-top"><span className="lab"><i style={{ background: "#4ADE80" }} /> Investimento <small>meta 20%</small></span><span className="ad-val">25%</span></div>
                  <div className="ad-bar"><span style={{ width: "100%", background: "#4ADE80" }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="block" id="como" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow2">Como funciona</span>
            <h2>Comece em três passos</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="n">1</div>
              <h3>Crie sua conta</h3>
              <p>Cadastro em menos de um minuto. Entre com biometria nas próximas vezes.</p>
            </div>
            <div className="step">
              <div className="n">2</div>
              <h3>Registre o mês</h3>
              <p>Adicione receitas e despesas em segundos. A categoria já cai na regra 50/30/20 sozinha.</p>
            </div>
            <div className="step">
              <div className="n">3</div>
              <h3>Realize seus sonhos</h3>
              <p>Defina suas metas e acompanhe o progresso até cada conquista.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section className="block" id="precos" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow2">Planos</span>
            <h2>Escolha o plano do seu momento</h2>
            <p>Comece com 7 dias grátis para testar. Sem fidelidade — cancele quando quiser.</p>
            <div className="price-toggle">
              <button className={cycle === "m" ? "on" : ""} onClick={() => setCycle("m")}>Mensal</button>
              <button className={cycle === "a" ? "on" : ""} onClick={() => setCycle("a")}>Anual <span className="save">2 meses grátis</span></button>
            </div>
          </div>
          <div className="plan-grid">
            {PLANS.map((p) => (
              <div className={"plan" + (p.feature ? " feature" : "")} key={p.name}>
                {p.badge && <span className="plan-badge">{p.badge}</span>}
                <div className="plan-name">{p.name}</div>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price"><span className="cur">R$</span><span className="val">{p.price[cycle]}</span><span className="per">/mês</span></div>
                <p className="plan-billed">{cycle === "a" ? p.billedA : ""}</p>
                <ul className="plan-feats">
                  {p.feats.map((f, i) => (
                    <li key={i} className={f.lead ? "lead" : ""}><Check />{f.text}</li>
                  ))}
                </ul>
                <Link href="/login" className={"btn " + (p.feature ? "btn-primary" : "btn-ghost btn-outline")}>Começar teste</Link>
              </div>
            ))}
          </div>
          <p className="price-note">Todos os planos incluem <b>7 dias grátis</b> · pagamento seguro · cancele quando quiser.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" id="sonho">
        <div className="wrap cta-in">
          <span className="eyebrow2">Metas</span>
          <h2>Todo sonho começa<br />com um plano.</h2>
          <p>Junte-se a quem já transformou o jeito de lidar com dinheiro.</p>
          <Link href="/login" className="btn btn-primary btn-lg">Criar minha conta →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-in">
            <div className="foot-brand">
              <div className="gm-wordmark on-dark"><span className="g">Green</span><span className="m">Mind</span></div>
              <p>O app de controle financeiro pessoal que faz seu dinheiro crescer com clareza.</p>
            </div>
            <div className="foot-cols">
              <div className="foot-col">
                <h4>Produto</h4>
                <a href="#recursos">Recursos</a>
                <a href="#regra">Regra 50/30/20</a>
                <a href="#precos">Preços</a>
                <Link href="/login">Abrir o app</Link>
              </div>
              <div className="foot-col">
                <h4>Empresa</h4>
                <a href="#">Sobre</a>
                <a href="#">Blog</a>
                <a href="#">Carreiras</a>
              </div>
              <div className="foot-col">
                <h4>Suporte</h4>
                <a href="#">Central de ajuda</a>
                <a href="#">Segurança</a>
                <a href="#">Contato</a>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 Green Mind. Todos os direitos reservados.</span>
            <span>Privacidade · Termos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
