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

export function ManualUserForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
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

    try {
      // Try to create the user with the standard auth API
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
        throw new Error(`Erro na autenticação: ${error.message}`)
      }

      if (!data.user) {
        throw new Error("Nenhum usuário retornado")
      }

      // Update the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome: userData.nome,
          role: userData.role,
        })
        .eq("id", data.user.id)

      if (profileError) {
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`)
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
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error)
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
        <CardTitle>Adicionar Usuário Manualmente</CardTitle>
        <CardDescription>
          Use este formulário para adicionar um usuário diretamente, sem usar o Server Action ou API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-nome">Nome</Label>
            <Input
              id="manual-nome"
              name="nome"
              value={userData.nome}
              onChange={handleChange}
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-email">Email</Label>
            <Input
              id="manual-email"
              name="email"
              type="email"
              value={userData.email}
              onChange={handleChange}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-password">Senha</Label>
            <Input
              id="manual-password"
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
            <Label htmlFor="manual-role">Tipo de Usuário</Label>
            <Select value={userData.role} onValueChange={handleRoleChange}>
              <SelectTrigger id="manual-role">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="funcionario">Funcionário</SelectItem>
                <SelectItem value="master">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar Usuário
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
