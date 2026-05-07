-- Executar no Supabase SQL Editor

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipo para categoria de despesa
CREATE TYPE expense_type AS ENUM ('essencial', 'pessoal', 'investimento');

-- Tabela de receitas
CREATE TABLE income_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de despesas
CREATE TABLE expense_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  type expense_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de metas (Filtro do Sonho)
CREATE TABLE goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount DECIMAL(12,2),
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  category TEXT,
  what_to_achieve TEXT,
  what_to_stop TEXT,
  how_to_accomplish TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (cada usuário só vê seus próprios dados)
CREATE POLICY "income_own" ON income_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "expense_own" ON expense_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "goals_own" ON goals FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_income_user_month ON income_entries(user_id, year, month);
CREATE INDEX idx_expense_user_month ON expense_entries(user_id, year, month);
CREATE INDEX idx_goals_user ON goals(user_id, completed);
