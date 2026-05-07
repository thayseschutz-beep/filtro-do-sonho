"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Sparkles, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const router = useRouter()

  async function handleSubmit() {
    if (!email || !password) return
    setLoading(true); setError(""); setMessage("")
    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage("Conta criada! Verifique seu email para confirmar.")
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError("Email ou senha incorretos")
      else router.push("/dashboard")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-xl border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-green-500 rounded-2xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">Filtro do Sonho</h1>
            <p className="text-xs text-gray-400">Controle Financeiro Pessoal</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {isSignUp ? "Criar conta" : "Entrar"}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {isSignUp ? "Comece a organizar suas finanças hoje" : "Bem-vinda de volta! ✨"}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Senha</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all pr-12"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
          {message && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">{message}</div>}

          <button onClick={handleSubmit} disabled={loading || !email || !password}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-2">
            {loading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
          </button>
          <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage("") }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-1">
            {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar agora"}
          </button>
        </div>
      </div>
    </div>
  )
}
