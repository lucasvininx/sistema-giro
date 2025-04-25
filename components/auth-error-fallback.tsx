"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function AuthErrorFallback() {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4 text-amber-500">
            <AlertTriangle size={48} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Erro de Autenticação</CardTitle>
          <CardDescription className="text-center">
            Ocorreu um erro ao carregar seu perfil de usuário. Isso pode ser devido a um problema temporário ou a uma
            configuração incorreta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <p>Possíveis causas:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Políticas de segurança (RLS) configuradas incorretamente</li>
              <li>Problema temporário com o banco de dados</li>
              <li>Seu perfil de usuário pode estar incompleto ou corrompido</li>
            </ul>
            <p>Você pode tentar novamente ou fazer logout e login novamente.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleRetry}>
            Tentar Novamente
          </Button>
          <Button variant="destructive" onClick={handleSignOut}>
            Sair
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
