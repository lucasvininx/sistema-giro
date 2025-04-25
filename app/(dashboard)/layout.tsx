"use client"

import type React from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { AuthErrorFallback } from "@/components/auth-error-fallback"
import { Loader2 } from "lucide-react"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isLoading, profile, user } = useAuth()

  // Mostrar loader enquanto carrega
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // Se o usuário está autenticado mas não tem perfil, mostrar fallback
  if (user && !profile) {
    return <AuthErrorFallback />
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
