export interface IncomeEntry {
  id: string
  user_id: string
  year: number
  month: number
  description: string
  amount: number
  date: string
  created_at: string
}

export interface ExpenseEntry {
  id: string
  user_id: string
  year: number
  month: number
  category: string
  description: string
  amount: number
  date: string
  type: "essencial" | "pessoal" | "investimento"
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number | null
  current_amount: number
  deadline: string | null
  category: string | null
  what_to_achieve: string | null
  what_to_stop: string | null
  how_to_accomplish: string | null
  completed: boolean
  created_at: string
}

export interface CreditCard {
  id: string
  user_id: string
  name: string
  bank: string | null
  last_digits: string | null
  credit_limit: number
  due_day: number
  closing_day: number
  color: string
  created_at: string
}

export interface CardTransaction {
  id: string
  user_id: string
  card_id: string
  description: string
  total_amount: number
  installments: number
  purchase_date: string
  category: string
  created_at: string
}

export interface CardBill {
  id: string
  user_id: string
  card_id: string
  year: number
  month: number
  paid: boolean
  paid_at: string | null
}
