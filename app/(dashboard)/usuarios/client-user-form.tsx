"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export function ClientUserForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    nome: "",
    role: "funcionario",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setUserData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorDetails(null)

    try {
      console.log("Attempting to create user with client-side Supabase client")

      // Method 1: Use the standard Auth API
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            nome: userData.nome,
            role: userData.role,
          },
        },
      })

      if (error) {
        console.error("Auth API error:", error)
        setErrorDetails(`Auth API error: ${error.message}`)
        throw new Error(`Erro na autenticação: ${error.message}`)
      }

      if (!data.user) {
        setErrorDetails("No user returned from Auth API")
        throw new Error("Nenhum usuário retornado")
      }

      console.log("User created successfully:", data.user.id)

      // Method 2: Update the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome: userData.nome,
          role: userData.role,
        })
        .eq("id", data.user.id)

      if (profileError) {
        console.error("Profile update error:", profileError)
        setErrorDetails(`Profile update error: ${profileError.message}`)
        // Continue anyway since the user was created
      } else {
        console.log("Profile updated successfully")
      }

      toast({
        title: "Usuário criado com sucesso!",
        description: "O usuário foi adicionado ao sistema.",
      })

      // Reset form
      setUserData({
        email: "",
        password: "",
        nome: "",
        role: "funcionario",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error creating user:", error)

      // Try fallback method - direct profile creation
      try {
        console.log("Attempting fallback: direct profile creation")
        const userId = uuidv4()

        const { error: insertError } = await supabase.from("profiles").insert({
          id: userId,
          email: userData.email,
          nome: userData.nome,
          role: userData.role,
          created_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error("Direct insert error:", insertError)
          setErrorDetails(`Direct insert error: ${insertError.message}`)
          toast({
            title: "Erro ao criar usuário",
            description: `Erro: ${error.message}\nFallback também falhou: ${insertError.message}`,
            variant: "destructive",
          })
        } else {
          console.log("Fallback successful: Profile created directly")
          toast({
            title: "Perfil criado com sucesso (fallback)!",
            description: "O perfil foi adicionado ao sistema, mas o usuário não poderá fazer login.",
          })

          // Reset form
          setUserData({
            email: "",
            password: "",
            nome: "",
            role: "funcionario",
          })

          if (onSuccess) {
            onSuccess()
          }
        }
      } catch (fallbackError: any) {
        console.error("Fallback error:", fallbackError)
        setErrorDetails(`Fallback error: ${fallbackError.message}`)
        toast({
          title: "Erro ao criar usuário",
          description: `Todos os métodos falharam. Erro original: ${error.message}`,
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Usuário (Cliente)</CardTitle>
        <CardDescription>
          Este método cria um usuário diretamente do navegador, sem usar Server Actions ou API Routes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-nome">Nome</Label>
            <Input
              id="client-nome"
              name="nome"
              value={userData.nome}
              onChange={handleChange}
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              name="email"
              type="email"
              value={userData.email}
              onChange={handleChange}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-password">Senha</Label>
            <Input
              id="client-password"
              name="password"
              type="password"
              value={userData.password}
              onChange={handleChange}
              placeholder="Senha"
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-role">Tipo de Usuário</Label>
            <Select value={userData.role} onValueChange={handleRoleChange}>
              <SelectTrigger id="client-role">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="funcionario">Funcionário</SelectItem>
                <SelectItem value="master">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {errorDetails && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
              <p className="font-medium">Detalhes do erro:</p>
              <p className="font-mono text-xs mt-1 whitespace-pre-wrap">{errorDetails}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Usuário
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
