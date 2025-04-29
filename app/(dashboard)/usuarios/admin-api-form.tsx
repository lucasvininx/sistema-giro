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

export function AdminApiForm({ onSuccess }: { onSuccess?: () => void }) {
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
      // Call the API route directly
      const response = await fetch("/api/users/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrorDetails(`API error: ${result.error || "Unknown error"}`)
        throw new Error(result.error || "Erro desconhecido ao criar usuário")
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
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Usuário (API)</CardTitle>
        <CardDescription>
          Este método usa a API Route diretamente para criar um usuário, sem Server Actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-nome">Nome</Label>
            <Input
              id="api-nome"
              name="nome"
              value={userData.nome}
              onChange={handleChange}
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-email">Email</Label>
            <Input
              id="api-email"
              name="email"
              type="email"
              value={userData.email}
              onChange={handleChange}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-password">Senha</Label>
            <Input
              id="api-password"
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
            <Label htmlFor="api-role">Tipo de Usuário</Label>
            <Select value={userData.role} onValueChange={handleRoleChange}>
              <SelectTrigger id="api-role">
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
