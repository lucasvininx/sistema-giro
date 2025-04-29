"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Loader2, MoreHorizontal, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { GuiaAdmin } from "./guia-admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientUserForm } from "./client-user-form"
import { AdminApiForm } from "./admin-api-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function UsuariosPage() {
  const { isMaster } = useAuth()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!isMaster) {
      router.push("/dashboard")
      return
    }

    fetchUsuarios()
  }, [isMaster, router])

  const fetchUsuarios = async () => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar usuários:", error)
      } else {
        setUsuarios(data || [])
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsuarios = usuarios.filter((usuario) => {
    return (
      searchTerm === "" ||
      usuario.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

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
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Problemas com a criação de usuários</AlertTitle>
        <AlertDescription>
          Devido a problemas com a API de autenticação do Supabase, estamos oferecendo métodos alternativos para criar
          usuários. Tente os diferentes métodos abaixo para ver qual funciona melhor no seu caso.
        </AlertDescription>
      </Alert>

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
                              usuario.role === "master"
                                ? "bg-black text-white dark:bg-gray-700"
                                : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
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

      <div className="mt-8">
        <Tabs defaultValue="client">
          <TabsList className="mb-4">
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>
          <TabsContent value="client">
            <ClientUserForm onSuccess={fetchUsuarios} />
          </TabsContent>
          <TabsContent value="api">
            <AdminApiForm onSuccess={fetchUsuarios} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
