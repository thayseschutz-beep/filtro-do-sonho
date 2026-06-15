"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/Navbar"
import { RefreshCw, Download, Check, X, AlertCircle, ExternalLink, Wifi, ChevronLeft, ChevronRight } from "lucide-react"

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

interface SheetEntry { date: string | null; description: string; amount: number; status?: string }
interface SheetData { sheet?: string; income: SheetEntry[]; expenses: SheetEntry[]; error?: string }

function guessType(desc: string): "essencial" | "pessoal" | "investimento" {
  const d = desc.toLowerCase()
  if (d.includes("invest") || d.includes("poupança") || d.includes("reserva") || d.includes("aplicaç")) return "investimento"
  if (d.includes("lazer") || d.includes("restaurante") || d.includes("roupa") || d.includes("beleza") || d.includes("viagem")) return "pessoal"
  return "essencial"
}

function guessCategory(desc: string): string {
  const d = desc.toLowerCase()
  if (d.includes("cartão") || d.includes("cartao")) return "Outro"
  if (d.includes("aluguel") || d.includes("apto") || d.includes("condomínio") || d.includes("condominio")) return "Moradia/Aluguel"
  if (d.includes("internet") || d.includes("celesc") || d.includes("energia") || d.includes("claro")) return "Serviços básicos"
  if (d.includes("faculdade") || d.includes("colégio") || d.includes("colegio") || d.includes("escola")) return "Educação"
  if (d.includes("unimed") || d.includes("médico") || d.includes("medico") || d.includes("remédio") || d.includes("farmácia")) return "Saúde"
  if (d.includes("mei")) return "MEI/Impostos"
  if (d.includes("mercado") || d.includes("alimentação") || d.includes("ifood")) return "Alimentação"
  if (d.includes("gasolina") || d.includes("combustível") || d.includes("uber")) return "Transporte"
  if (d.includes("seguro")) return "Outro"
  return "Outro"
}

export default function SincronizarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [scriptUrl, setScriptUrl] = useState("")
  const [savedUrl, setSavedUrl] = useState("")
  const [testing, setTesting] = useState(false)
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null)

  const [loading, setLoading] = useState(false)
  const [sheetData, setSheetData] = useState<SheetData | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState("")
  const [userId, setUserId] = useState("")

  const supabase = createClient()

  useEffect(() => {
    const url = localStorage.getItem("sheets_script_url") || ""
    setScriptUrl(url); setSavedUrl(url)
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id) })
  }, [])

  function saveUrl() {
    localStorage.setItem("sheets_script_url", scriptUrl)
    setSavedUrl(scriptUrl); setConnectionOk(null)
  }

  async function testConnection() {
    if (!savedUrl) return
    setTesting(true); setConnectionOk(null)
    try {
      const res = await fetch(`${savedUrl}?action=test`)
      const data = await res.json()
      setConnectionOk(data.ok === true)
    } catch { setConnectionOk(false) }
    setTesting(false)
  }

  async function loadFromSheets() {
    if (!savedUrl) return
    setLoading(true); setSheetData(null); setImportResult("")
    try {
      const res = await fetch(`${savedUrl}?action=read&month=${month}&year=${year}`)
      const data = await res.json()
      setSheetData(data)
    } catch {
      setSheetData({ income: [], expenses: [], error: "Erro ao conectar. Verifique a URL e tente novamente." })
    }
    setLoading(false)
  }

  async function importToSupabase() {
    if (!sheetData || !userId) return
    setImporting(true); setImportResult("")
    let count = 0; let skipped = 0

    for (const e of sheetData.income) {
      const { error } = await supabase.from("income_entries").upsert({
        user_id: userId, year, month,
        description: e.description,
        amount: e.amount,
        date: e.date || `${year}-${String(month).padStart(2,"0")}-01`,
      }, { onConflict: "user_id,year,month,description", ignoreDuplicates: true })
      if (error) skipped++; else count++
    }

    for (const e of sheetData.expenses) {
      const { error } = await supabase.from("expense_entries").upsert({
        user_id: userId, year, month,
        description: e.description,
        amount: e.amount,
        date: e.date || `${year}-${String(month).padStart(2,"0")}-01`,
        type: guessType(e.description),
        category: guessCategory(e.description),
      }, { onConflict: "user_id,year,month,description", ignoreDuplicates: true })
      if (error) skipped++; else count++
    }

    setImportResult(`✅ ${count} lançamentos importados!${skipped > 0 ? ` (${skipped} já existiam)` : ""}`)
    setImporting(false)
  }

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y-1) } else setMonth(m => m-1); setSheetData(null); setImportResult("") }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y+1) } else setMonth(m => m+1); setSheetData(null); setImportResult("") }

  const totalIncome = sheetData?.income.reduce((s, e) => s + e.amount, 0) || 0
  const totalExpenses = sheetData?.expenses.reduce((s, e) => s + e.amount, 0) || 0

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Sincronizar com Google Sheets</h1>
            <p className="text-sm text-gray-500">Importe sua planilha para o app e mantenha tudo atualizado</p>
          </div>

          {/* Step 1: URL */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
              <h2 className="font-semibold text-gray-900">URL do Apps Script</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4 ml-8">
              Cole o arquivo <strong>google-apps-script.js</strong> no Google Apps Script da sua planilha e implante como App da Web.
            </p>
            <div className="flex gap-2 ml-8">
              <input value={scriptUrl} onChange={e => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              <button onClick={saveUrl} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                Salvar
              </button>
            </div>
            {savedUrl && (
              <button onClick={testConnection} disabled={testing}
                className="mt-3 ml-8 flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-xl transition-colors bg-gray-50 hover:bg-gray-100">
                <Wifi className="w-4 h-4" />
                {testing ? "Testando..." : "Testar conexão"}
                {connectionOk === true && <><Check className="w-4 h-4 text-green-500" /><span className="text-green-600 font-medium">Conectado!</span></>}
                {connectionOk === false && <><X className="w-4 h-4 text-red-500" /><span className="text-red-600">Falhou</span></>}
              </button>
            )}
          </div>

          {/* Step 2: Import */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-5 ${!savedUrl ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
              <h2 className="font-semibold text-gray-900">Importar mês da planilha</h2>
            </div>

            <div className="flex items-center gap-3 mb-5 ml-8">
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                <span className="font-semibold text-gray-900 text-sm min-w-[130px] text-center">{MONTHS[month-1]} {year}</span>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
              </div>
              <button onClick={loadFromSheets} disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Lendo planilha..." : "Ler da planilha"}
              </button>
            </div>

            {sheetData?.error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2 ml-8">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{sheetData.error}
              </div>
            )}

            {sheetData && !sheetData.error && (
              <div className="ml-8 space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="text-xs font-semibold text-green-700 mb-2">
                      📈 Receitas — {sheetData.income.length} lançamentos
                    </div>
                    <div className="text-lg font-bold text-green-700 mb-2">{fmt(totalIncome)}</div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {sheetData.income.map((e, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-700">
                          <span className="truncate flex-1 mr-2">{e.description}</span>
                          <span className="font-medium text-green-700 whitespace-nowrap">{fmt(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                    <div className="text-xs font-semibold text-red-700 mb-2">
                      📉 Despesas — {sheetData.expenses.length} lançamentos
                    </div>
                    <div className="text-lg font-bold text-red-700 mb-2">{fmt(totalExpenses)}</div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {sheetData.expenses.map((e, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-700">
                          <span className="truncate flex-1 mr-2">{e.description}</span>
                          <span className="font-medium text-red-700 whitespace-nowrap">{fmt(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {importResult ? (
                  <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-xl font-medium">
                    {importResult}
                  </div>
                ) : (
                  <button onClick={importToSupabase} disabled={importing || sheetData.income.length + sheetData.expenses.length === 0}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                    <Download className="w-4 h-4" />
                    {importing ? "Importando..." : `Importar ${sheetData.income.length + sheetData.expenses.length} lançamentos → App`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-3">📋 Passo a passo: como configurar o Apps Script</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li><span className="font-bold">1.</span> Abra sua planilha no Google Sheets</li>
              <li><span className="font-bold">2.</span> No menu: <strong>Extensões → Apps Script</strong></li>
              <li><span className="font-bold">3.</span> Apague o código existente e cole o conteúdo do arquivo <strong>google-apps-script.js</strong> (está na pasta do projeto)</li>
              <li><span className="font-bold">4.</span> Salve com Ctrl+S</li>
              <li><span className="font-bold">5.</span> Clique em <strong>Implantar → Nova implantação</strong></li>
              <li><span className="font-bold">6.</span> Tipo: <strong>App da Web</strong> → Executar como: <strong>Eu mesmo</strong> → Quem tem acesso: <strong>Qualquer pessoa</strong></li>
              <li><span className="font-bold">7.</span> Autorize o acesso quando solicitado</li>
              <li><span className="font-bold">8.</span> Copie a URL que aparece e cole no campo acima</li>
            </ol>
            <p className="text-xs text-blue-600 mt-3">💡 Sempre que importar, os dados da planilha entram no app automaticamente com as categorias já classificadas.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
