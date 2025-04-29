"use client"

import { useAuth } from "@/contexts/auth-context"
import { Bell, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"

export function Header() {
  const { profile, signOut } = useAuth()

  return (
    <header className="bg-background border-b border-border h-16 flex items-center px-4 md:px-6">
      <div className="md:hidden flex items-center">
        <h1 className="text-xl font-bold">
          <span className="text-orange-500">Giro</span> <span className="text-blue-600">Capital</span>
        </h1>
      </div>
      <div className="flex-1 flex justify-end items-center space-x-4">
        <ThemeToggle />

        <button className="p-2 rounded-full hover:bg-accent">
          <Bell className="h-5 w-5 text-foreground" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt={profile.nome || "Usuário"}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
                  <User className="h-5 w-5" />
                </div>
              )}
              <span className="font-medium hidden md:inline-block">{profile?.nome || "Usuário"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/perfil">Meu Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
