-- ============================================================================
-- GREEN MIND — Isolamento de contas por usuário  (rode no Supabase → SQL Editor)
-- ----------------------------------------------------------------------------
-- O QUE ISSO FAZ:
--   • Cria a tabela "user_accounts": liga cada usuário a uma "conta" (household).
--   • Cada pessoa nova => conta própria e ISOLADA (não vê dados de ninguém).
--   • Você + Lucas => ligados à conta "casal" (mantêm os dados e a sincronia).
--   • Ativa RLS (Row Level Security): o banco PROÍBE ler/gravar conta de outro.
--
-- COMO USAR:
--   1) Rode os PASSOS 1, 2 e 3 abaixo.
--   2) No PASSO 4, troque os UUIDs pelos IDs reais (veja instrução lá).
--   3) Só DEPOIS faça o git push do código novo.
-- ============================================================================


-- ─── PASSO 1 — Tabela de vínculo usuário → conta ────────────────────────────
create table if not exists public.user_accounts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  account_id text not null,
  role       text not null default 'admin',   -- admin | editar | ver
  created_at timestamptz not null default now()
);

create index if not exists user_accounts_account_idx on public.user_accounts(account_id);


-- ─── PASSO 2 — Segurança da tabela user_accounts ────────────────────────────
alter table public.user_accounts enable row level security;

-- cada um enxerga/gerencia só o PRÓPRIO vínculo
drop policy if exists "ua_self" on public.user_accounts;
create policy "ua_self" on public.user_accounts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── PASSO 3 — Segurança dos dados financeiros ──────────────────────────────
-- (a sua tabela de dados; o app usa "financas_compartilhadas")
alter table public.financas_compartilhadas enable row level security;

-- só acessa a linha cujo id == account_id do usuário logado
drop policy if exists "fin_account_members" on public.financas_compartilhadas;
create policy "fin_account_members" on public.financas_compartilhadas
  for all
  using (
    id in (select account_id from public.user_accounts where user_id = auth.uid())
  )
  with check (
    id in (select account_id from public.user_accounts where user_id = auth.uid())
  );


-- ─── PASSO 4 — Ligar VOCÊ e o LUCAS à conta "casal" ─────────────────────────
-- Pegue os UUIDs em:  Supabase → Authentication → Users  (coluna "UID")
-- Copie o UID da Thayse e o do Lucas e cole abaixo, no lugar dos textos.

insert into public.user_accounts (user_id, account_id, role) values
  ('COLE_AQUI_O_UID_DA_THAYSE', 'casal', 'admin'),
  ('COLE_AQUI_O_UID_DO_LUCAS',  'casal', 'admin')
on conflict (user_id) do update set account_id = excluded.account_id, role = excluded.role;


-- ─── PRONTO ─────────────────────────────────────────────────────────────────
-- Confira com:
--   select * from public.user_accounts;
-- Você deve ver 2 linhas (Thayse e Lucas) com account_id = 'casal'.
-- Qualquer pessoa nova que criar conta vai gerar a própria linha automaticamente.
-- ============================================================================
