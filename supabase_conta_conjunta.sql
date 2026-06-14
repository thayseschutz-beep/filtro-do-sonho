-- ============================================================================
-- GREEN MIND — Conta conjunta funcional + membros editáveis
-- Rode no Supabase → SQL Editor.  (Pode rodar tudo de uma vez.)
-- Pré-requisito: você já rodou o primeiro SQL (user_accounts + isolamento).
-- ============================================================================


-- ─── 1. Colunas de exibição (nome/e-mail) no vínculo ────────────────────────
alter table public.user_accounts add column if not exists email text;
alter table public.user_accounts add column if not exists name  text;


-- ─── 2. Helper: as contas a que o usuário logado pertence ───────────────────
-- SECURITY DEFINER evita recursão de RLS quando uma policy consulta user_accounts.
create or replace function public.my_account_ids()
returns setof text
language sql
security definer
stable
set search_path = public
as $$
  select account_id from public.user_accounts where user_id = auth.uid()
$$;


-- ─── 3. Policies do user_accounts (membros se enxergam; admin edita) ────────
alter table public.user_accounts enable row level security;

drop policy if exists "ua_self"            on public.user_accounts;
drop policy if exists "ua_select_members"  on public.user_accounts;
drop policy if exists "ua_insert_self"     on public.user_accounts;
drop policy if exists "ua_update_member"   on public.user_accounts;

-- LER: todos os membros da(s) minha(s) conta(s)
create policy "ua_select_members" on public.user_accounts
  for select using ( account_id in (select public.my_account_ids()) );

-- INSERIR: só a minha própria linha
create policy "ua_insert_self" on public.user_accounts
  for insert with check ( auth.uid() = user_id );

-- ATUALIZAR: qualquer membro de uma conta a que eu pertenço (admin corrige nome/permissão)
create policy "ua_update_member" on public.user_accounts
  for update using ( account_id in (select public.my_account_ids()) )
  with check ( account_id in (select public.my_account_ids()) );


-- ─── 4. Dados financeiros: usa o helper (evita recursão) ────────────────────
alter table public.financas_compartilhadas enable row level security;

drop policy if exists "fin_account_members" on public.financas_compartilhadas;
create policy "fin_account_members" on public.financas_compartilhadas
  for all
  using ( id in (select public.my_account_ids()) )
  with check ( id in (select public.my_account_ids()) );


-- ─── 5. Tabela de convites ──────────────────────────────────────────────────
create table if not exists public.convites (
  id          uuid primary key default gen_random_uuid(),
  account_id  text not null,
  email       text not null,
  role        text not null default 'editar',   -- admin | editar | ver
  status      text not null default 'pending',  -- pending | accepted | canceled
  created_by  uuid,
  created_at  timestamptz not null default now()
);
create index if not exists convites_email_idx on public.convites(lower(email));

alter table public.convites enable row level security;

drop policy if exists "conv_account" on public.convites;
drop policy if exists "conv_invitee" on public.convites;

-- quem é da conta pode criar / ver / cancelar convites daquela conta
create policy "conv_account" on public.convites
  for all
  using ( account_id in (select public.my_account_ids()) )
  with check ( account_id in (select public.my_account_ids()) );

-- o convidado pode ver convites destinados ao próprio e-mail
create policy "conv_invitee" on public.convites
  for select using ( lower(email) = lower(coalesce(auth.jwt()->>'email','')) );


-- ─── 6. Função: aceitar convite pendente (chamada no login) ─────────────────
create or replace function public.accept_pending_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  inv   record;
  myemail text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if myemail = '' then return null; end if;

  select * into inv
    from public.convites
    where lower(email) = myemail and status = 'pending'
    order by created_at desc
    limit 1;

  if not found then return null; end if;

  -- entra na conta convidada
  update public.user_accounts
     set account_id = inv.account_id, role = inv.role
   where user_id = auth.uid();

  if not found then
    insert into public.user_accounts (user_id, account_id, role, email)
    values (auth.uid(), inv.account_id, inv.role, myemail);
  end if;

  update public.convites set status = 'accepted' where id = inv.id;
  return inv.account_id;
end;
$$;

grant execute on function public.accept_pending_invite() to authenticated;
grant execute on function public.my_account_ids() to authenticated;


-- ─── PRONTO ─────────────────────────────────────────────────────────────────
-- Como funciona agora:
--   • No Perfil → Conta conjunta, você digita o e-mail + permissão e clica "Criar convite".
--   • Quando essa pessoa criar a conta (ou logar) com esse MESMO e-mail, ela entra
--     automaticamente na sua conta, com a permissão escolhida.
--   • Você pode editar nome/e-mail e a permissão de cada membro ali mesmo.
-- (O e-mail automático de aviso é um passo extra de backend, para depois.)
-- ============================================================================
