"use client"

import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, FileText, UserCircle, LogOut, Menu, X, Handshake } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { signOut, isMaster } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Operações",
      href: "/operacoes",
      icon: FileText,
      active: pathname.startsWith("/operacoes"),
    },
    {
      name: "Parceiros",
      href: "/parceiros",
      icon: Handshake,
      active: pathname.startsWith("/parceiros"),
    },
    {
      name: "Perfil",
      href: "/perfil",
      icon: UserCircle,
      active: pathname === "/perfil",
    },
  ]

  // Adicionar item de usuários apenas para master
  if (isMaster) {
    navItems.splice(3, 0, {
      name: "Usuários",
      href: "/usuarios",
      icon: Users,
      active: pathname.startsWith("/usuarios"),
    })
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white md:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-black text-white transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-center mb-2">
              <h1 className="text-2xl font-bold text-orange-500">
                Giro <span className="text-blue-600">Capital</span>
              </h1>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center p-3 rounded-md transition-colors",
                  item.active ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-800",
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={signOut}
              className="flex items-center w-full p-3 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
