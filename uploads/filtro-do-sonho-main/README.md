# Filtro do Sonho — App de Controle Financeiro

App Next.js + Supabase com dashboard financeiro, controle de orçamento mensal (50/30/20) e Filtro do Sonho (metas).

## Stack

- **Next.js 14** (App Router + TypeScript)
- **Supabase** (banco de dados PostgreSQL + autenticação)
- **Tailwind CSS** (estilização)
- **Recharts** (gráficos)
- **Vercel** (deploy)

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Vercel](https://vercel.com) (gratuita)
- Conta no [GitHub](https://github.com)

---

## Configuração

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **SQL Editor** e execute o conteúdo de `supabase-schema.sql`
3. Vá em **Project Settings > API** e copie:
   - `Project URL`
   - `anon public` key

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo:
```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Instalar dependências e rodar localmente

```bash
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Deploy no Vercel

### Opção A: Via GitHub (recomendado)

1. Faça push do projeto para um repositório GitHub:
```bash
git init
git add .
git commit -m "feat: initial commit"
git remote add origin https://github.com/seu-usuario/filtro-do-sonho.git
git push -u origin main
```

2. Acesse [vercel.com](https://vercel.com) > **Add New Project**
3. Importe o repositório GitHub
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em **Deploy** — pronto!

### Opção B: Via Vercel CLI

```bash
npm i -g vercel
vercel
```

---

## Funcionalidades

### Dashboard
- Resumo do mês atual (renda, gastos, saldo, taxa de poupança)
- Gráfico de alocação 50/30/20
- Preview das metas em andamento

### Orçamento Mensal
- Navegar entre meses
- Registrar receitas (salário, freelance, NF)
- Registrar despesas com categorias (essencial/pessoal/investimento)
- Barras de progresso 50/30/20 em tempo real
- Excluir lançamentos

### Filtro do Sonho (Metas)
- Criar metas com valor alvo, prazo e categoria
- Metodologia 3 colunas: O que alcançar / O que parar / Como fazer
- Barra de progresso com atualização de valor atual
- Marcar metas como concluídas

---

## Estrutura do Projeto

```
filtro-do-sonho/
├── app/
│   ├── login/          # Tela de login/cadastro
│   ├── dashboard/      # Dashboard principal
│   ├── orcamento/      # Orçamento mensal
│   └── metas/          # Filtro do Sonho
├── components/
│   └── Navbar.tsx      # Navegação lateral
├── lib/
│   ├── supabase/       # Clientes Supabase
│   └── types.ts        # Tipos TypeScript
├── supabase-schema.sql # Schema do banco de dados
└── .env.local.example  # Modelo de variáveis de ambiente
```
