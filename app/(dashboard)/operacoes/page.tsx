"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { formatarStatus, getStatusColor, supabase, type StatusOperacao } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MoreHorizontal, Plus, Search, Building, UserCircle } from "lucide-react"
import Link from "next/link"

export default function OperacoesPage() {
  const { profile } = useAuth()
  const [operacoes, setOperacoes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [tipoFilter, setTipoFilter] = useState("todos")

  useEffect(() => {
    fetchOperacoes()
  }, [profile])

  const fetchOperacoes = async () => {
    setIsLoading(true)

    const query = supabase
      .from("operacoes")
      .select(`
        *,
        profiles(nome)
      `)
      .order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar operações:", error)
    } else {
      setOperacoes(data || [])
    }

    setIsLoading(false)
  }

  const filteredOperacoes = operacoes.filter((op) => {
    // Filtro de busca
    const matchesSearch =
      searchTerm === "" ||
      (op.tipo_pessoa === "juridica" && op.cnpj_empresa?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (op.tipo_pessoa === "fisica" && op.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (op.tipo_pessoa === "fisica" && op.cpf?.includes(searchTerm))

    // Filtro de status
    const matchesStatus = statusFilter === "todos" || op.status === statusFilter

    // Filtro de tipo de pessoa
    const matchesTipo = tipoFilter === "todos" || op.tipo_pessoa === tipoFilter

    return matchesSearch && matchesStatus && matchesTipo
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Operações</h1>
        <Link href="/operacoes/nova">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Nova Operação
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Todas as Operações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou documento..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pre_analise">Pré-análise</SelectItem>
                  <SelectItem value="analise">Análise</SelectItem>
                  <SelectItem value="analise_credito">Análise de Crédito</SelectItem>
                  <SelectItem value="analise_juridica_laudo">Análise Jurídica e Laudo</SelectItem>
                  <SelectItem value="comite">Comitê</SelectItem>
                  <SelectItem value="credito_aprovado">Crédito Aprovado</SelectItem>
                  <SelectItem value="contrato_assinado">Contrato Assinado</SelectItem>
                  <SelectItem value="contrato_registrado">Contrato Registrado</SelectItem>
                  <SelectItem value="recusada">Recusada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo de Pessoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome/CNPJ</TableHead>
                    <TableHead>Criado por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperacoes.length > 0 ? (
                    filteredOperacoes.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell>
                          {op.tipo_pessoa === "juridica" ? (
                            <Building className="h-4 w-4 text-primary" />
                          ) : (
                            <UserCircle className="h-4 w-4 text-primary" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {op.tipo_pessoa === "juridica" ? op.cnpj_empresa : op.nome_cliente || "Cliente"}
                        </TableCell>
                        <TableCell>{op.profiles?.nome}</TableCell>
                        <TableCell>{new Date(op.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(op.status as StatusOperacao)}`}
                          >
                            {formatarStatus(op.status as StatusOperacao)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/operacoes/${op.id}`}>Ver detalhes</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/operacoes/${op.id}/editar`}>Editar</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Nenhuma operação encontrada
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
