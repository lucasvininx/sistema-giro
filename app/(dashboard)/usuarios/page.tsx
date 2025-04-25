"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MoreHorizontal, Plus, Search } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { GuiaAdmin } from "./guia-admin"

export default function UsuariosPage() {
  const { isMaster } = useAuth()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    nome: "",
    role: "funcionario",
  })

  useEffect(() => {
    if (!isMaster) {
      router.push("/dashboard")
      return
    }

    fetchUsuarios()
  }, [isMaster, router])

  const fetchUsuarios = async () => {
    setIsLoading(true)

    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar usuários:", error)
    } else {
      setUsuarios(data || [])
    }

    setIsLoading(false)
  }

  const filteredUsuarios = usuarios.filter((usuario) => {
    return (
      searchTerm === "" ||
      usuario.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setNewUser((prev) => ({ ...prev, role: value }))
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.nome) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
      })

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`)
      }

      if (authData.user) {
        // Atualizar o perfil do usuário
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            nome: newUser.nome,
            role: newUser.role,
          })
          .eq("id", authData.user.id)

        if (profileError) {
          throw new Error(`Erro ao atualizar perfil: ${profileError.message}`)
        }

        toast({
          title: "Usuário criado com sucesso!",
          description: `O novo usuário foi adicionado ao sistema como ${newUser.role === "master" ? "Administrador" : "Funcionário"}.`,
        })

        setIsDialogOpen(false)
        setNewUser({
          email: "",
          password: "",
          nome: "",
          role: "funcionario",
        })

        fetchUsuarios()
      }
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

  const formatRole = (role: string) => {
    return role === "master" ? "Administrador" : "Funcionário"
  }

  if (!isMaster) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>Preencha os dados para adicionar um novo usuário ao sistema.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={newUser.nome}
                  onChange={handleInputChange}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  placeholder="Senha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuário</Label>
                <Select value={newUser.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="master">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleCreateUser} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <GuiaAdmin />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Todos os Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.length > 0 ? (
                    filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome || "Sem nome"}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              usuario.role === "master" ? "bg-black text-white" : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {formatRole(usuario.role)}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(usuario.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Desativar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
