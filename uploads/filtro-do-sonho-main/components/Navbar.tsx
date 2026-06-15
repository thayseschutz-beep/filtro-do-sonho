"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Wallet, Target, CreditCard, RefreshCw, LogOut, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orcamento", label: "Orçamento", icon: Wallet },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/metas", label: "Filtro do Sonho", icon: Target },
  { href: "/sincronizar", label: "Sincronizar", icon: RefreshCw },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <nav className="w-60 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">Filtro do Sonho</div>
            <div className="text-xs text-gray-400">Controle Financeiro</div>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </div>
      <div className="p-4 border-t border-gray-100">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-all">
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </nav>
  )
}
