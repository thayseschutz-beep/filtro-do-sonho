"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/Navbar"
import { Plus, Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react"
import type { IncomeEntry, ExpenseEntry } from "@/lib/types"

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const CATS = {
  essencial: ["Moradia/Aluguel","Alimentação","Transporte","Saúde","Educação","Serviços básicos","MEI/Impostos","Outro"],
  pessoal: ["Lazer","Roupas/Beleza","Restaurante","Assinaturas","Presentes","Viagem","Outro"],
  investimento: ["Poupança","Investimentos","Reserva emergência","Negócio/MEI","Outro"],
}
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
const today = () => new Date().toISOString().split("T")[0]

export default function OrcamentoPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [incomes, setIncomes] = useState<IncomeEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [tab, setTab] = useState<"receitas" | "despesas">("receitas")

  const [iDesc, setIDesc] = useState("")
  const [iAmt, setIAmt] = useState("")
  const [iDate, setIDate] = useState(today())
  const [savingI, setSavingI] = useState(false)

  const [eDesc, setEDesc] = useState("")
  const [eAmt, setEAmt] = useState("")
  const [eDate, setEDate] = useState(today())
  const [eType, setEType] = useState<"essencial"|"pessoal"|"investimento">("essencial")
  const [eCat, setECat] = useState("")
  const [savingE, setSavingE] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const [ir, er] = await Promise.all([
      supabase.from("income_entries").select("*").eq("user_id", user.id).eq("year", year).eq("month", month).order("date", { ascending: false }),
      supabase.from("expense_entries").select("*").eq("user_id", user.id).eq("year", year).eq("month", month).order("date", { ascending: false }),
    ])
    setIncomes(ir.data || [])
    setExpenses(er.data || [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchData() }, [fetchData])

  async function addIncome() {
    if (!iDesc || !iAmt) return
    setSavingI(true)
    await supabase.from("income_entries").insert({ user_id: userId, year, month, description: iDesc, amount: parseFloat(iAmt.replace(",", ".")), date: iDate })
    setIDesc(""); setIAmt("")
    setSavingI(false); fetchData()
  }

  async function addExpense() {
    if (!eDesc || !eAmt || !eCat) return
    setSavingE(true)
    await supabase.from("expense_entries").insert({ user_id: userId, year, month, description: eDesc, amount: parseFloat(eAmt.replace(",", ".")), date: eDate, type: eType, category: eCat })
    setEDesc(""); setEAmt(""); setECat("")
    setSavingE(false); fetchData()
  }

  async function delIncome(id: string) { await supabase.from("income_entries").delete().eq("id", id); fetchData() }
  async function delExpense(id: string) { await supabase.from("expense_entries").delete().eq("id", id); fetchData() }

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const totalI = incomes.reduce((s, e) => s + Number(e.amount), 0)
  const totalE = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const balance = totalI - totalE
  const essencial = expenses.filter(e => e.type === "essencial").reduce((s, e) => s + Number(e.amount), 0)
  const pessoal = expenses.filter(e => e.type === "pessoal").reduce((s, e) => s + Number(e.amount), 0)
  const investimento = expenses.filter(e => e.type === "investimento").reduce((s, e) => s + Number(e.amount), 0)
  const pct = (v: number) => totalI > 0 ? ((v / totalI) * 100).toFixed(1) : "0"

  const typeStyle: Record<string,string> = { essencial: "text-red-600 bg-red-50 border-red-100", pessoal: "text-yellow-600 bg-yellow-50 border-yellow-100", investimento: "text-green-700 bg-green-50 border-green-100" }
  const typeLabel: Record<string,string> = { essencial: "Essencial", pessoal: "Pessoal", investimento: "Investimento" }

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orçamento Mensal</h1>
              <p className="text-sm text-gray-500">Registre receitas e despesas</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
              <span className="font-semibold text-gray-900 text-sm min-w-[130px] text-center">{MONTHS[month-1]} {year}</span>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
              <div className="text-xs text-gray-500 mb-1">Total Receitas</div>
              <div className="text-xl font-bold text-green-700">{fmt(totalI)}</div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <div className="text-xs text-gray-500 mb-1">Total Despesas</div>
              <div className="text-xl font-bold text-red-700">{fmt(totalE)}</div>
            </div>
            <div className={`${balance >= 0 ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100"} border rounded-2xl p-5`}>
              <div className="text-xs text-gray-500 mb-1">Saldo</div>
              <div className={`text-xl font-bold ${balance >= 0 ? "text-blue-700" : "text-red-700"}`}>{fmt(balance)}</div>
            </div>
          </div>

          {/* 50/30/20 bars */}
          {totalI > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Alocação 50/30/20</h3>
              <div className="space-y-3">
                {[
                  { label: "Essencial", v: essencial, t: 50, c: "bg-red-400" },
                  { label: "Pessoal", v: pessoal, t: 30, c: "bg-yellow-400" },
                  { label: "Investimento", v: investimento, t: 20, c: "bg-green-500" },
                ].map(({ label, v, t, c }) => {
                  const a = parseFloat(pct(v)); const over = a > t
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{label} <span className="text-gray-400">meta: {t}%</span></span>
                        <span className={over ? "text-red-600 font-semibold" : "text-gray-600"}>{pct(v)}% • {fmt(v)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${c}`} style={{ width: `${Math.min(a/t*100, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setTab("receitas")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "receitas" ? "bg-green-500 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
              <TrendingUp className="w-4 h-4" />Receitas ({incomes.length})
            </button>
            <button onClick={() => setTab("despesas")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "despesas" ? "bg-red-500 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
              <TrendingDown className="w-4 h-4" />Despesas ({expenses.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Form */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">
                {tab === "receitas" ? "+ Nova Receita" : "+ Nova Despesa"}
              </h3>
              {tab === "receitas" ? (
                <div className="space-y-3">
                  <input value={iDesc} onChange={e => setIDesc(e.target.value)} placeholder="Descrição (ex: Salário, Freelance, NF)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  <input value={iAmt} onChange={e => setIAmt(e.target.value)} placeholder="Valor (ex: 3500,00)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  <input type="date" value={iDate} onChange={e => setIDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  <button onClick={addIncome} disabled={savingI || !iDesc || !iAmt}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />{savingI ? "Salvando..." : "Adicionar Receita"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="Descrição (ex: Aluguel, Mercado)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                  <input value={eAmt} onChange={e => setEAmt(e.target.value)} placeholder="Valor (ex: 1200,00)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                  <input type="date" value={eDate} onChange={e => setEDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                  <select value={eType} onChange={e => { setEType(e.target.value as "essencial"|"pessoal"|"investimento"); setECat("") }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white">
                    <option value="essencial">Essencial (meta: 50%)</option>
                    <option value="pessoal">Pessoal (meta: 30%)</option>
                    <option value="investimento">Investimento (meta: 20%)</option>
                  </select>
                  <select value={eCat} onChange={e => setECat(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white">
                    <option value="">Selecione a categoria...</option>
                    {CATS[eType].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={addExpense} disabled={savingE || !eDesc || !eAmt || !eCat}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />{savingE ? "Salvando..." : "Adicionar Despesa"}
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">
                {tab === "receitas" ? `Receitas — ${fmt(totalI)}` : `Despesas — ${fmt(totalE)}`}
              </h3>
              {loading ? <div className="text-center py-8 text-gray-400 text-sm">Carregando...</div> : (
                tab === "receitas" ? (
                  incomes.length === 0
                    ? <div className="text-center py-10 text-gray-400 text-sm">Nenhuma receita registrada</div>
                    : <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {incomes.map(i => (
                          <div key={i.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{i.description}</div>
                              <div className="text-xs text-gray-400">{new Date(i.date + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-green-700 text-sm">{fmt(Number(i.amount))}</span>
                              <button onClick={() => delIncome(i.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                ) : (
                  expenses.length === 0
                    ? <div className="text-center py-10 text-gray-400 text-sm">Nenhuma despesa registrada</div>
                    : <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {expenses.map(e => (
                          <div key={e.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{e.description}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${typeStyle[e.type]}`}>{typeLabel[e.type]}</span>
                                <span className="text-xs text-gray-400">{e.category}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-red-700 text-sm">{fmt(Number(e.amount))}</span>
                              <button onClick={() => delExpense(e.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
