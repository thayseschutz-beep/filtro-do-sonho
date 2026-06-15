-- EXECUTE NO SUPABASE SQL EDITOR (depois do supabase-schema.sql)

-- Tabela de cartões de crédito
CREATE TABLE credit_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  bank TEXT,
  last_digits TEXT,
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL DEFAULT 10,
  closing_day INTEGER NOT NULL DEFAULT 3,
  color TEXT DEFAULT 'slate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações (compras) do cartão
CREATE TABLE card_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1,
  purchase_date DATE NOT NULL,
  category TEXT DEFAULT 'Outro',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de faturas pagas
CREATE TABLE card_bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  UNIQUE(card_id, year, month)
);

-- RLS
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cards_own" ON credit_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "card_tx_own" ON card_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "card_bills_own" ON card_bills FOR ALL USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_card_tx_card ON card_transactions(card_id, purchase_date);
CREATE INDEX idx_card_bills_card ON card_bills(card_id, year, month);
