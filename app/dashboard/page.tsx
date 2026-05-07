"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, ArrowRight } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { IncomeEntry, ExpenseEntry, Goal } from "@/lib/types"

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

export default function DashboardPage() {
  const [incomes, setIncomes] = useState<IncomeEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState("")

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthName = MONTHS[now.getMonth()]

  useEffect(() => {
    const supabase = createClient()
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email || "")
      const [ir, er, gr] = await Promise.all([
        supabase.from("income_entries").select("*").eq("user_id", user.id).eq("year", year).eq("month", month),
        supabase.from("expense_entries").select("*").eq("user_id", user.id).eq("year", year).eq("month", month),
        supabase.from("goals").select("*").eq("user_id", user.id).eq("completed", false).order("created_at", { ascending: false }).limit(4),
      ])
      setIncomes(ir.data || [])
      setExpenses(er.data || [])
      setGoals(gr.data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const totalIncome = incomes.reduce((s, e) => s + Number(e.amount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : "0"

  const essencial = expenses.filter(e => e.type === "essencial").reduce((s, e) => s + Number(e.amount), 0)
  const pessoal = expenses.filter(e => e.type === "pessoal").reduce((s, e) => s + Number(e.amount), 0)
  const investimento = expenses.filter(e => e.type === "investimento").reduce((s, e) => s + Number(e.amount), 0)
  const pct = (v: number) => totalIncome > 0 ? ((v / totalIncome) * 100).toFixed(1) : "0"

  const chartData = [
    { name: "Essencial", value: essencial, color: "#ef4444" },
    { name: "Pessoal", value: pessoal, color: "#f59e0b" },
    { name: "Investimento", value: investimento, color: "#22c55e" },
  ].filter(d => d.value > 0)

  if (loading) return (
    <div className="flex h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-gray-400">Carregando...</div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">{monthName} {year} • {userEmail}</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { title: "Renda Total", value: fmt(totalIncome), icon: <TrendingUp className="w-4 h-4 text-green-600" />, bg: "bg-green-50 border-green-100" },
              { title: "Gastos Totais", value: fmt(totalExpenses), icon: <TrendingDown className="w-4 h-4 text-red-600" />, bg: "bg-red-50 border-red-100" },
              { title: "Saldo", value: fmt(balance), icon: <Wallet className="w-4 h-4 text-blue-600" />, bg: balance >= 0 ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100" },
              { title: "Taxa Poupança", value: `${savingsRate}%`, icon: <PiggyBank className="w-4 h-4 text-purple-600" />, bg: "bg-purple-50 border-purple-100" },
            ].map(card => (
              <div key={card.title} className={`rounded-2xl p-5 border shadow-sm ${card.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">{card.title}</span>
                  {card.icon}
                </div>
                <div className="text-xl font-bold text-gray-900">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 50/30/20 Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-0.5">Alocação 50/30/20</h2>
              <p className="text-xs text-gray-400 mb-4">Distribuição dos gastos de {monthName}</p>
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(Number(v))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {[
                      { label: "Essencial", value: essencial, target: 50, color: "bg-red-400" },
                      { label: "Pessoal", value: pessoal, target: 30, color: "bg-yellow-400" },
                      { label: "Investimento", value: investimento, target: 20, color: "bg-green-500" },
                    ].map(({ label, value, target, color }) => {
                      const actual = parseFloat(pct(value))
                      const over = actual > target
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-gray-600">{label} <span className="text-gray-400">({target}%)</span></span>
                            <span className={over ? "text-red-600 font-medium" : "text-gray-600"}>{pct(value)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(actual / target * 100, 100)}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                  <TrendingDown className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhum gasto registrado</p>
                  <Link href="/orcamento" className="text-green-600 text-xs mt-1 hover:underline">Adicionar gastos →</Link>
                </div>
              )}
            </div>

            {/* Goals */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Filtro do Sonho ✨</h2>
                  <p className="text-xs text-gray-400">Suas metas em andamento</p>
                </div>
                <Link href="/metas" className="text-green-600 text-xs flex items-center gap-1 hover:underline">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.map(goal => {
                    const progress = goal.target_amount
                      ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100) : 0
                    return (
                      <div key={goal.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-gray-900 text-sm">{goal.title}</span>
                          <span className="text-xs text-gray-400">{progress.toFixed(0)}%</span>
                        </div>
                        {goal.target_amount && (
                          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                            <span>{fmt(Number(goal.current_amount))}</span>
                            <span>{fmt(Number(goal.target_amount))}</span>
                          </div>
                        )}
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                  <Target className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma meta cadastrada</p>
                  <Link href="/metas" className="text-green-600 text-xs mt-1 hover:underline">Criar primeira meta →</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
