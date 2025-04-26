"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, FileText, CheckCircle, XCircle, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface OperacaoStats {
  total: number
  aprovadas: number
  recusadas: number
  pendentes: number
  em_andamento: number
  valor_total: number
}

export default function DashboardPage() {
  const { isMaster, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [operacaoStats, setOperacaoStats] = useState<OperacaoStats>({
    total: 0,
    aprovadas: 0,
    recusadas: 0,
    pendentes: 0,
    em_andamento: 0,
    valor_total: 0,
  })
  const [operacoesRecentes, setOperacoesRecentes] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      if (isMaster) {
        await fetchMasterData()
      } else {
        await fetchFuncionarioData()
      }

      setIsLoading(false)
    }

    fetchData()
  }, [isMaster, profile])

  const fetchMasterData = async () => {
    // Buscar estatísticas gerais de operações
    const { data: operacoes } = await supabase.from("operacoes").select("*")

    if (operacoes) {
      const stats: OperacaoStats = {
        total: operacoes.length,
        aprovadas: operacoes.filter(
          (op) =>
            op.status === "credito_aprovado" ||
            op.status === "contrato_assinado" ||
            op.status === "contrato_registrado",
        ).length,
        recusadas: operacoes.filter((op) => op.status === "recusada").length,
        pendentes: operacoes.filter((op) => op.status === "pre_analise" || op.status === "analise").length,
        em_andamento: operacoes.filter(
          (op) => op.status === "analise_credito" || op.status === "analise_juridica_laudo" || op.status === "comite",
        ).length,
        valor_total: operacoes.reduce((sum, op) => sum + (op.valor || 0), 0),
      }

      setOperacaoStats(stats)
    }

    // Buscar operações recentes
    const { data: recentes } = await supabase
      .from("operacoes")
      .select(`
        *,
        profiles(nome)
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    if (recentes) {
      setOperacoesRecentes(recentes)
    }
  }

  const fetchFuncionarioData = async () => {
    if (!profile) return

    // Buscar operações do funcionário
    const { data: operacoes } = await supabase.from("operacoes").select("*").eq("created_by", profile.id)

    if (operacoes) {
      const stats: OperacaoStats = {
        total: operacoes.length,
        aprovadas: operacoes.filter(
          (op) =>
            op.status === "credito_aprovado" ||
            op.status === "contrato_assinado" ||
            op.status === "contrato_registrado",
        ).length,
        recusadas: operacoes.filter((op) => op.status === "recusada").length,
        pendentes: operacoes.filter((op) => op.status === "pre_analise" || op.status === "analise").length,
        em_andamento: operacoes.filter(
          (op) => op.status === "analise_credito" || op.status === "analise_juridica_laudo" || op.status === "comite",
        ).length,
        valor_total: operacoes.reduce((sum, op) => sum + (op.valor || 0), 0),
      }

      setOperacaoStats(stats)
    }

    // Buscar operações recentes
    const { data: recentes } = await supabase
      .from("operacoes")
      .select("*")
      .eq("created_by", profile.id)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentes) {
      setOperacoesRecentes(recentes)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{isMaster ? "Dashboard Administrativo" : "Meu Dashboard"}</h1>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/operacoes/nova">Nova Operação</Link>
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-t-4 border-t-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Operações</CardTitle>
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{operacaoStats.total}</div>
            <p className="text-sm text-muted-foreground mt-1">Operações registradas</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-t-4 border-t-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-green-50 dark:bg-green-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                Operações Aprovadas
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-600">{operacaoStats.aprovadas}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {operacaoStats.total > 0
                ? `${Math.round((operacaoStats.aprovadas / operacaoStats.total) * 100)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-t-4 border-t-red-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-red-50 dark:bg-red-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Operações Recusadas</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-red-600">{operacaoStats.recusadas}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {operacaoStats.total > 0
                ? `${Math.round((operacaoStats.recusadas / operacaoStats.total) * 100)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-t-4 border-t-yellow-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Em Andamento</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-yellow-600">
              {operacaoStats.pendentes + operacaoStats.em_andamento}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Operações em processamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Operações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Operações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {operacoesRecentes.length > 0 ? (
            <div className="space-y-4">
              {operacoesRecentes.map((op) => (
                <Link
                  key={op.id}
                  href={`/operacoes/${op.id}`}
                  className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {op.tipo_pessoa === "juridica" ? op.cnpj_empresa : op.nome_cliente || "Cliente"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(op.created_at).toLocaleDateString("pt-BR")} - {op.profiles?.nome}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        op.status === "credito_aprovado" ||
                        op.status === "contrato_assinado" ||
                        op.status === "contrato_registrado"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : op.status === "recusada"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : op.status === "pre_analise" || op.status === "analise"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      {op.status === "credito_aprovado" ||
                      op.status === "contrato_assinado" ||
                      op.status === "contrato_registrado"
                        ? "Aprovada"
                        : op.status === "recusada"
                          ? "Recusada"
                          : op.status === "pre_analise" || op.status === "analise"
                            ? "Pendente"
                            : "Em Andamento"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma operação encontrada</p>
              <Button asChild className="mt-4 bg-primary hover:bg-primary/90">
                <Link href="/operacoes/nova">Criar Nova Operação</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção específica para administradores */}
      {isMaster && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Valor Total das Operações</h3>
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    }).format(operacaoStats.valor_total)}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/operacoes">Ver Todas</Link>
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Gerenciar Usuários</h3>
                  <p className="text-sm text-muted-foreground">Adicionar ou editar usuários do sistema</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/usuarios">Gerenciar</Link>
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Gerenciar Parceiros</h3>
                  <p className="text-sm text-muted-foreground">Adicionar ou editar parceiros</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/parceiros">Gerenciar</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção específica para funcionários */}
      {!isMaster && profile?.meta_operacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Meu Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Operações Realizadas</span>
                  <span className="text-sm font-medium">
                    {operacaoStats.total} / {profile?.meta_operacoes || 10}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(100, (operacaoStats.total / (profile?.meta_operacoes || 10)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Valor Total das Minhas Operações</h3>
                <p className="text-lg font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0,
                  }).format(operacaoStats.valor_total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
