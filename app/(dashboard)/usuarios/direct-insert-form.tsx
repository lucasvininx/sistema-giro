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

export function DirectInsertForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState({
    email: "",
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
      // Generate a UUID for the user
      const userId = uuidv4()

      // Insert directly into the profiles table
      const { error } = await supabase.from("profiles").insert({
        id: userId,
        email: userData.email,
        nome: userData.nome,
        role: userData.role,
        created_at: new Date().toISOString(),
      })

      if (error) {
        throw new Error(`Erro ao inserir perfil: ${error.message}`)
      }

      toast({
        title: "Perfil criado com sucesso!",
        description: "O perfil foi adicionado ao sistema. Nota: Este usuário não poderá fazer login.",
      })

      // Reset form
      setUserData({
        email: "",
        nome: "",
        role: "funcionario",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Erro ao criar perfil:", error)
      toast({
        title: "Erro ao criar perfil",
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
        <CardTitle>Inserção Direta no Banco</CardTitle>
        <CardDescription>
          Este método insere diretamente na tabela profiles usando o cliente Supabase. O usuário não poderá fazer login,
          mas aparecerá na lista de usuários.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="direct-nome">Nome</Label>
            <Input
              id="direct-nome"
              name="nome"
              value={userData.nome}
              onChange={handleChange}
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direct-email">Email</Label>
            <Input
              id="direct-email"
              name="email"
              type="email"
              value={userData.email}
              onChange={handleChange}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direct-role">Tipo de Usuário</Label>
            <Select value={userData.role} onValueChange={handleRoleChange}>
              <SelectTrigger id="direct-role">
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
            Inserir Diretamente
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
