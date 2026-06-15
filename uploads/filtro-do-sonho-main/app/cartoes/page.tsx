"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/Navbar"
import {
  CreditCard, Plus, Trash2, ChevronLeft, ChevronRight,
  CheckCircle, Clock, X, Edit2, ShoppingBag, AlertCircle
} from "lucide-react"
import type { CreditCard as CreditCardType, CardTransaction, CardBill } from "@/lib/types"

// ── helpers ──────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

const CARD_COLORS: Record<string, { bg: string; text: string; bar: string; badge: string }> = {
  slate:  { bg: "from-slate-700 to-slate-900",   text: "text-slate-700",   bar: "bg-slate-500",   badge: "bg-slate-100 text-slate-700" },
  violet: { bg: "from-violet-600 to-purple-800",  text: "text-violet-700",  bar: "bg-violet-500",  badge: "bg-violet-100 text-violet-700" },
  blue:   { bg: "from-blue-600 to-blue-900",      text: "text-blue-700",    bar: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  green:  { bg: "from-green-600 to-emerald-800",  text: "text-green-700",   bar: "bg-green-500",   badge: "bg-green-100 text-green-700" },
  rose:   { bg: "from-rose-500 to-rose-800",      text: "text-rose-700",    bar: "bg-rose-500",    badge: "bg-rose-100 text-rose-700" },
  amber:  { bg: "from-amber-500 to-orange-700",   text: "text-amber-700",   bar: "bg-amber-500",   badge: "bg-amber-100 text-amber-700" },
}

const TX_CATS = ["Alimentação","Supermercado","Gasolina","Transporte","Saúde","Farmácia","Vestuário","Lazer","Assinatura","Viagem","Educação","Casa","Outro"]

// ── how billing month works ───────────────────────────────────────
// A purchase on date D belongs to bill month M if:
//   purchase_date is AFTER closing_day of M-1  AND  ≤ closing_day of M
// We simplify: the "bill month" for a transaction is derived from purchase_date + closing_day offset
function getBillMonth(purchaseDate: string, closingDay: number): { year: number; month: number } {
  const d = new Date(purchaseDate + "T12:00:00")
  // If purchase day > closing_day, it goes to next month's bill
  if (d.getDate() > closingDay) {
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    return { year: next.getFullYear(), month: next.getMonth() + 1 }
  }
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

// For an installment purchase, return all bill months it affects
function getInstallmentMonths(purchaseDate: string, installments: number, closingDay: number) {
  const base = getBillMonth(purchaseDate, closingDay)
  const months = []
  for (let i = 0; i < installments; i++) {
    const d = new Date(base.year, base.month - 1 + i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, installment: i + 1 })
  }
  return months
}

// ── component ─────────────────────────────────────────────────────
export default function CartoesPage() {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  const [cards, setCards] = useState<CreditCardType[]>([])
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [bills, setBills] = useState<CardBill[]>([])
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(true)

  // add-card form
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardForm, setCardForm] = useState({ name: "", bank: "", last_digits: "", credit_limit: "", due_day: "10", closing_day: "3", color: "slate" })

  // add-transaction form
  const [showTxForm, setShowTxForm] = useState(false)
  const [txForm, setTxForm] = useState({ card_id: "", description: "", total_amount: "", installments: "1", purchase_date: now.toISOString().split("T")[0], category: "Outro" })

  const [savingCard, setSavingCard] = useState(false)
  const [savingTx, setSavingTx] = useState(false)

  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [cr, tr, br] = await Promise.all([
      supabase.from("credit_cards").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("card_transactions").select("*").eq("user_id", user.id).order("purchase_date", { ascending: false }),
      supabase.from("card_bills").select("*").eq("user_id", user.id),
    ])
    setCards(cr.data || [])
    setTransactions(tr.data || [])
    setBills(br.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── bill amount for a card in a given month ──
  function billAmount(card: CreditCardType, year: number, month: number): number {
    return transactions
      .filter(tx => tx.card_id === card.id)
      .reduce((sum, tx) => {
        const installMonths = getInstallmentMonths(tx.purchase_date, tx.installments, card.closing_day)
        const hit = installMonths.find(m => m.year === year && m.month === month)
        if (!hit) return sum
        return sum + Number(tx.total_amount) / tx.installments
      }, 0)
  }

  // ── total used limit (all open installments) ──
  function usedLimit(card: CreditCardType): number {
    return transactions
      .filter(tx => tx.card_id === card.id)
      .reduce((sum, tx) => {
        const installMonths = getInstallmentMonths(tx.purchase_date, tx.installments, card.closing_day)
        // installments still in the future from today
        const future = installMonths.filter(m => {
          const d = new Date(m.year, m.month - 1, 1)
          const today = new Date(now.getFullYear(), now.getMonth(), 1)
          return d >= today
        })
        return sum + (Number(tx.total_amount) / tx.installments) * future.length
      }, 0)
  }

  // ── transactions visible for selected card + month ──
  function visibleTransactions() {
    if (!selectedCard) return []
    const card = cards.find(c => c.id === selectedCard)
    if (!card) return []
    return transactions
      .filter(tx => tx.card_id === selectedCard)
      .filter(tx => {
        const months = getInstallmentMonths(tx.purchase_date, tx.installments, card.closing_day)
        return months.some(m => m.year === viewYear && m.month === viewMonth)
      })
      .map(tx => {
        const months = getInstallmentMonths(tx.purchase_date, tx.installments, card.closing_day)
        const hit = months.find(m => m.year === viewYear && m.month === viewMonth)!
        return { ...tx, currentInstallment: hit.installment, installmentAmount: Number(tx.total_amount) / tx.installments }
      })
  }

  function isBillPaid(cardId: string, year: number, month: number) {
    return bills.some(b => b.card_id === cardId && b.year === year && b.month === month && b.paid)
  }

  async function toggleBillPaid(card: CreditCardType) {
    const paid = isBillPaid(card.id, viewYear, viewMonth)
    if (paid) {
      await supabase.from("card_bills").update({ paid: false, paid_at: null })
        .eq("card_id", card.id).eq("year", viewYear).eq("month", viewMonth)
    } else {
      await supabase.from("card_bills").upsert({
        user_id: userId, card_id: card.id, year: viewYear, month: viewMonth,
        paid: true, paid_at: new Date().toISOString(),
      }, { onConflict: "card_id,year,month" })
    }
    fetchAll()
  }

  async function addCard() {
    if (!cardForm.name || !cardForm.credit_limit) return
    setSavingCard(true)
    await supabase.from("credit_cards").insert({
      user_id: userId,
      name: cardForm.name,
      bank: cardForm.bank || null,
      last_digits: cardForm.last_digits || null,
      credit_limit: parseFloat(cardForm.credit_limit.replace(",", ".")),
      due_day: parseInt(cardForm.due_day),
      closing_day: parseInt(cardForm.closing_day),
      color: cardForm.color,
    })
    setCardForm({ name: "", bank: "", last_digits: "", credit_limit: "", due_day: "10", closing_day: "3", color: "slate" })
    setShowCardForm(false); setSavingCard(false); fetchAll()
  }

  async function addTransaction() {
    if (!txForm.card_id || !txForm.description || !txForm.total_amount) return
    setSavingTx(true)
    await supabase.from("card_transactions").insert({
      user_id: userId,
      card_id: txForm.card_id,
      description: txForm.description,
      total_amount: parseFloat(txForm.total_amount.replace(",", ".")),
      installments: parseInt(txForm.installments) || 1,
      purchase_date: txForm.purchase_date,
      category: txForm.category,
    })
    setTxForm({ card_id: txForm.card_id, description: "", total_amount: "", installments: "1", purchase_date: now.toISOString().split("T")[0], category: "Outro" })
    setShowTxForm(false); setSavingTx(false); fetchAll()
  }

  async function deleteCard(id: string) {
    await supabase.from("credit_cards").delete().eq("id", id)
    if (selectedCard === id) setSelectedCard(null)
    fetchAll()
  }

  async function deleteTransaction(id: string) {
    await supabase.from("card_transactions").delete().eq("id", id)
    fetchAll()
  }

  function prevMonth() {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const selectedCardObj = cards.find(c => c.id === selectedCard)
  const visibleTx = visibleTransactions()
  const totalBill = selectedCardObj ? billAmount(selectedCardObj, viewYear, viewMonth) : 0
  const totalAllCards = cards.reduce((s, c) => s + billAmount(c, viewYear, viewMonth), 0)
  const isPaid = selectedCardObj ? isBillPaid(selectedCardObj.id, viewYear, viewMonth) : false

  const setCardF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCardForm(f => ({ ...f, [k]: e.target.value }))
  const setTxF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setTxForm(f => ({ ...f, [k]: e.target.value }))

  // ── render ──
  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cartões de Crédito</h1>
              <p className="text-sm text-gray-500">Total de {MONTHS[viewMonth-1]}: <span className="font-semibold text-gray-700">{fmt(totalAllCards)}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                <span className="font-semibold text-gray-900 text-sm min-w-[120px] text-center">{MONTHS[viewMonth-1]} {viewYear}</span>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
              </div>
              <button onClick={() => { setShowTxForm(!showTxForm); setShowCardForm(false) }}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-sm">
                <ShoppingBag className="w-4 h-4" />Nova Compra
              </button>
              <button onClick={() => { setShowCardForm(!showCardForm); setShowTxForm(false) }}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm">
                <Plus className="w-4 h-4" />Novo Cartão
              </button>
            </div>
          </div>

          {/* Add card form */}
          {showCardForm && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Novo Cartão</h3>
                <button onClick={() => setShowCardForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Nome do cartão *</label>
                  <input value={cardForm.name} onChange={setCardF("name")} placeholder="Ex: Nubank, Inter Gold"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Banco / Operadora</label>
                  <input value={cardForm.bank} onChange={setCardF("bank")} placeholder="Ex: Nubank, Itaú, XP"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Últimos 4 dígitos</label>
                  <input value={cardForm.last_digits} onChange={setCardF("last_digits")} placeholder="1234" maxLength={4}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Limite (R$) *</label>
                  <input value={cardForm.credit_limit} onChange={setCardF("credit_limit")} placeholder="Ex: 5000,00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Dia fechamento</label>
                  <input type="number" min={1} max={31} value={cardForm.closing_day} onChange={setCardF("closing_day")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Dia vencimento</label>
                  <input type="number" min={1} max={31} value={cardForm.due_day} onChange={setCardF("due_day")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>
              {/* Color picker */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 block mb-2">Cor do cartão</label>
                <div className="flex gap-2">
                  {Object.entries(CARD_COLORS).map(([key, val]) => (
                    <button key={key} onClick={() => setCardForm(f => ({ ...f, color: key }))}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${val.bg} transition-all ${cardForm.color === key ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "opacity-60 hover:opacity-90"}`} />
                  ))}
                </div>
              </div>
              <button onClick={addCard} disabled={savingCard || !cardForm.name || !cardForm.credit_limit}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />{savingCard ? "Salvando..." : "Salvar Cartão"}
              </button>
            </div>
          )}

          {/* Add transaction form */}
          {showTxForm && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Nova Compra</h3>
                <button onClick={() => setShowTxForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              {cards.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">Cadastre um cartão primeiro.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Descrição *</label>
                    <input value={txForm.description} onChange={setTxF("description")} placeholder="Ex: Amazon, Farmácia, Netflix"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Cartão *</label>
                    <select value={txForm.card_id} onChange={setTxF("card_id")}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                      <option value="">Selecione...</option>
                      {cards.map(c => <option key={c.id} value={c.id}>{c.name}{c.last_digits ? ` ••${c.last_digits}` : ""}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Valor total (R$) *</label>
                    <input value={txForm.total_amount} onChange={setTxF("total_amount")} placeholder="Ex: 299,90"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Parcelas</label>
                    <select value={txForm.installments} onChange={setTxF("installments")}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                      {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}x {txForm.total_amount ? `(${fmt(parseFloat(txForm.total_amount.replace(",","."))/n)}/mês)` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Data da compra</label>
                    <input type="date" value={txForm.purchase_date} onChange={setTxF("purchase_date")}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Categoria</label>
                    <select value={txForm.category} onChange={setTxF("category")}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                      {TX_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <button onClick={addTransaction} disabled={savingTx || !txForm.card_id || !txForm.description || !txForm.total_amount}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors">
                      <Plus className="w-4 h-4" />{savingTx ? "Salvando..." : "Registrar Compra"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cards grid */}
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
          ) : cards.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CreditCard className="w-14 h-14 mx-auto mb-3 opacity-25" />
              <p className="font-medium">Nenhum cartão cadastrado</p>
              <p className="text-xs mt-1">Clique em "Novo Cartão" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {cards.map(card => {
                const colors = CARD_COLORS[card.color] || CARD_COLORS.slate
                const bill = billAmount(card, viewYear, viewMonth)
                const used = usedLimit(card)
                const limit = Number(card.credit_limit)
                const pctUsed = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
                const pctBill = limit > 0 ? Math.min((bill / limit) * 100, 100) : 0
                const paid = isBillPaid(card.id, viewYear, viewMonth)
                const isSelected = selectedCard === card.id

                return (
                  <div key={card.id}
                    onClick={() => setSelectedCard(isSelected ? null : card.id)}
                    className={`cursor-pointer rounded-2xl overflow-hidden shadow-sm border-2 transition-all ${isSelected ? "border-green-400 shadow-md scale-[1.01]" : "border-transparent hover:border-gray-200"}`}>

                    {/* Card visual */}
                    <div className={`bg-gradient-to-br ${colors.bg} p-5 text-white relative`}>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <div className="text-sm font-medium opacity-75">{card.bank || "Cartão"}</div>
                          <div className="text-lg font-bold">{card.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {paid ? <CheckCircle className="w-5 h-5 text-green-300" /> : <Clock className="w-5 h-5 opacity-50" />}
                          <button onClick={e => { e.stopPropagation(); deleteCard(card.id) }}
                            className="opacity-40 hover:opacity-80 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs opacity-60">Fatura {MONTHS[viewMonth-1]}</div>
                          <div className={`text-2xl font-bold ${paid ? "line-through opacity-60" : ""}`}>{fmt(bill)}</div>
                        </div>
                        {card.last_digits && (
                          <div className="text-sm opacity-50 font-mono">•••• {card.last_digits}</div>
                        )}
                      </div>
                    </div>

                    {/* Card info */}
                    <div className="bg-white p-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Limite utilizado</span>
                        <span className={`font-semibold ${pctUsed > 80 ? "text-red-600" : colors.text}`}>
                          {fmt(used)} / {fmt(limit)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                        <div className={`h-2 rounded-full ${pctUsed > 80 ? "bg-red-500" : colors.bar}`}
                          style={{ width: `${pctUsed}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Vence dia {card.due_day} • Fecha dia {card.closing_day}</span>
                        <button
                          onClick={e => { e.stopPropagation(); toggleBillPaid(card) }}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-xs ${
                            paid
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}>
                          {paid ? "✓ Paga" : "Marcar paga"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Selected card transactions */}
          {selectedCardObj && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedCardObj.name} — Fatura {MONTHS[viewMonth-1]} {viewYear}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Fecha dia {selectedCardObj.closing_day} • Vence dia {selectedCardObj.due_day} •
                    {isPaid
                      ? <span className="text-green-600 font-medium"> ✓ Fatura paga</span>
                      : <span className="text-yellow-600 font-medium"> Pendente</span>
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">{visibleTx.length} lançamento{visibleTx.length !== 1 ? "s" : ""}</div>
                  <div className="text-xl font-bold text-gray-900">{fmt(totalBill)}</div>
                </div>
              </div>

              {visibleTx.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-25" />
                  <p className="text-sm">Nenhuma compra nesta fatura</p>
                  <button onClick={() => { setTxForm(f => ({ ...f, card_id: selectedCardObj.id })); setShowTxForm(true) }}
                    className="text-blue-600 text-xs mt-1 hover:underline">Adicionar compra →</button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {visibleTx.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{tx.description}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{tx.category}</span>
                            <span className="text-gray-200">•</span>
                            <span className="text-xs text-gray-400">
                              {new Date(tx.purchase_date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </span>
                            {tx.installments > 1 && (
                              <>
                                <span className="text-gray-200">•</span>
                                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-medium">
                                  {tx.currentInstallment}/{tx.installments}x
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 text-sm">{fmt(tx.installmentAmount)}</div>
                          {tx.installments > 1 && (
                            <div className="text-xs text-gray-400">de {fmt(Number(tx.total_amount))}</div>
                          )}
                        </div>
                        <button onClick={() => deleteTransaction(tx.id)}
                          className="text-gray-200 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer: categories summary */}
              {visibleTx.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-2">Por categoria</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(
                      visibleTx.reduce((acc, tx) => {
                        acc[tx.category] = (acc[tx.category] || 0) + tx.installmentAmount
                        return acc
                      }, {} as Record<string, number>)
                    ).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                      <span key={cat} className="bg-white border border-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-lg">
                        {cat}: <span className="font-semibold">{fmt(val)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info banner */}
          {!selectedCard && cards.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-gray-400 mt-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Clique em um cartão para ver os lançamentos da fatura de {MONTHS[viewMonth-1]}.</span>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
