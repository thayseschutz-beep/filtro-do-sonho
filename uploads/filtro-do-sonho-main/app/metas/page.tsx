"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/Navbar"
import { Plus, Trash2, CheckCircle, Target, Calendar, Edit2, X, Check } from "lucide-react"
import type { Goal } from "@/lib/types"

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

const CATS = [
  { value: "financeira", label: "💰 Financeira" },
  { value: "pessoal", label: "🌟 Pessoal" },
  { value: "profissional", label: "💼 Profissional" },
  { value: "saude", label: "❤️ Saúde" },
  { value: "relacionamento", label: "👫 Relacionamento" },
  { value: "educacao", label: "📚 Educação" },
  { value: "viagem", label: "✈️ Viagem" },
  { value: "outro", label: "✨ Outro" },
]

const emptyForm = () => ({
  title: "", targetAmt: "", currentAmt: "", deadline: "", category: "",
  whatToAchieve: "", whatToStop: "", howToAccomplish: "",
})

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newProgress, setNewProgress] = useState("")
  const [form, setForm] = useState(emptyForm())

  const supabase = createClient()

  const fetchGoals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    setGoals(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function addGoal() {
    if (!form.title) return
    setSaving(true)
    await supabase.from("goals").insert({
      user_id: userId, title: form.title,
      target_amount: form.targetAmt ? parseFloat(form.targetAmt.replace(",", ".")) : null,
      current_amount: form.currentAmt ? parseFloat(form.currentAmt.replace(",", ".")) : 0,
      deadline: form.deadline || null,
      category: form.category || null,
      what_to_achieve: form.whatToAchieve || null,
      what_to_stop: form.whatToStop || null,
      how_to_accomplish: form.howToAccomplish || null,
      completed: false,
    })
    setForm(emptyForm()); setShowForm(false); setSaving(false); fetchGoals()
  }

  async function delGoal(id: string) { await supabase.from("goals").delete().eq("id", id); fetchGoals() }
  async function toggleDone(g: Goal) { await supabase.from("goals").update({ completed: !g.completed }).eq("id", g.id); fetchGoals() }

  async function saveProgress(goalId: string) {
    const v = parseFloat(newProgress.replace(",", "."))
    if (isNaN(v)) return
    await supabase.from("goals").update({ current_amount: v }).eq("id", goalId)
    setEditingId(null); setNewProgress(""); fetchGoals()
  }

  const active = goals.filter(g => !g.completed)
  const done = goals.filter(g => g.completed)

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Filtro do Sonho ✨</h1>
              <p className="text-sm text-gray-500">{active.length} meta{active.length !== 1 ? "s" : ""} em andamento</p>
            </div>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cancelar" : "Nova Meta"}
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-8">
              <h3 className="font-semibold text-gray-900 mb-5">Nova Meta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Título *</label>
                  <input value={form.title} onChange={set("title")} placeholder="Ex: Reserva de emergência"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
                  <select value={form.category} onChange={set("category")}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                    <option value="">Selecione...</option>
                    {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor Meta (R$)</label>
                  <input value={form.targetAmt} onChange={set("targetAmt")} placeholder="Ex: 15000,00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valor Atual (R$)</label>
                  <input value={form.currentAmt} onChange={set("currentAmt")} placeholder="Ex: 3000,00"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prazo</label>
                  <input type="date" value={form.deadline} onChange={set("deadline")}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>

              {/* 3 Columns */}
              <p className="text-xs font-medium text-gray-500 mb-3">Metodologia de Metas (Leandro Branquinho)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <label className="block text-xs font-semibold text-green-700 mb-2">🎯 O que alcançar</label>
                  <textarea value={form.whatToAchieve} onChange={set("whatToAchieve")} placeholder="O que você quer conquistar..." rows={4}
                    className="w-full bg-white border border-green-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <label className="block text-xs font-semibold text-red-700 mb-2">🛑 O que parar</label>
                  <textarea value={form.whatToStop} onChange={set("whatToStop")} placeholder="O que precisa deixar de fazer..." rows={4}
                    className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <label className="block text-xs font-semibold text-blue-700 mb-2">🚀 Como vou fazer</label>
                  <textarea value={form.howToAccomplish} onChange={set("howToAccomplish")} placeholder="Quais passos você vai dar..." rows={4}
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>
              </div>

              <button onClick={addGoal} disabled={saving || !form.title}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />{saving ? "Salvando..." : "Salvar Meta"}
              </button>
            </div>
          )}

          {/* Active goals */}
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
          ) : active.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Target className="w-14 h-14 mx-auto mb-3 opacity-25" />
              <p className="font-medium">Nenhuma meta cadastrada ainda</p>
              <p className="text-xs mt-1">Clique em "Nova Meta" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {active.map(goal => {
                const progress = goal.target_amount
                  ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100) : 0
                const daysLeft = goal.deadline
                  ? Math.ceil((new Date(goal.deadline + "T12:00:00").getTime() - Date.now()) / 86400000) : null

                return (
                  <div key={goal.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        {goal.category && (
                          <span className="text-xs text-gray-400">{CATS.find(c => c.value === goal.category)?.label || goal.category}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleDone(goal)} title="Marcar concluída" className="text-gray-200 hover:text-green-500 transition-colors"><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => delGoal(goal.id)} className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {goal.target_amount && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div>
                            {editingId === goal.id ? (
                              <div className="flex items-center gap-1.5">
                                <input value={newProgress} onChange={e => setNewProgress(e.target.value)}
                                  placeholder={String(goal.current_amount)}
                                  className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400" />
                                <button onClick={() => saveProgress(goal.id)} className="text-green-600 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingId(goal.id); setNewProgress(String(goal.current_amount)) }}
                                className="flex items-center gap-1 text-gray-700 hover:text-green-600 transition-colors font-medium">
                                {fmt(Number(goal.current_amount))}<Edit2 className="w-3 h-3 opacity-40" />
                              </button>
                            )}
                          </div>
                          <span className="text-gray-400">{fmt(Number(goal.target_amount))}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-green-400"}`}
                            style={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-right text-xs text-gray-400 mt-0.5">{progress.toFixed(1)}%</div>
                      </div>
                    )}

                    {daysLeft !== null && (
                      <div className={`flex items-center gap-1 text-xs mb-3 ${daysLeft < 0 ? "text-red-500" : daysLeft < 30 ? "text-yellow-600" : "text-gray-400"}`}>
                        <Calendar className="w-3 h-3" />
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} dias atrasada` : daysLeft === 0 ? "Vence hoje!" : `${daysLeft} dias restantes`}
                        {" • "}{new Date(goal.deadline + "T12:00:00").toLocaleDateString("pt-BR")}
                      </div>
                    )}

                    {(goal.what_to_achieve || goal.what_to_stop || goal.how_to_accomplish) && (
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        {goal.what_to_achieve && (
                          <div className="bg-green-50 rounded-lg p-2">
                            <div className="text-xs font-semibold text-green-700 mb-0.5">🎯 Alcançar</div>
                            <div className="text-xs text-gray-600 line-clamp-3">{goal.what_to_achieve}</div>
                          </div>
                        )}
                        {goal.what_to_stop && (
                          <div className="bg-red-50 rounded-lg p-2">
                            <div className="text-xs font-semibold text-red-700 mb-0.5">🛑 Parar</div>
                            <div className="text-xs text-gray-600 line-clamp-3">{goal.what_to_stop}</div>
                          </div>
                        )}
                        {goal.how_to_accomplish && (
                          <div className="bg-blue-50 rounded-lg p-2">
                            <div className="text-xs font-semibold text-blue-700 mb-0.5">🚀 Como</div>
                            <div className="text-xs text-gray-600 line-clamp-3">{goal.how_to_accomplish}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {done.length > 0 && (
            <div>
              <button onClick={() => setShowDone(!showDone)}
                className="text-xs text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
                {done.length} meta{done.length !== 1 ? "s" : ""} concluída{done.length !== 1 ? "s" : ""}
                {showDone ? " (ocultar)" : " (ver)"}
              </button>
              {showDone && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {done.map(g => (
                    <div key={g.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 opacity-70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-500 line-through">{g.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleDone(g)} className="text-xs text-gray-400 hover:text-gray-600">Reabrir</button>
                          <button onClick={() => delGoal(g.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
