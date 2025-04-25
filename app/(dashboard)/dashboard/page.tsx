"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, TrendingUp, FileText, CheckCircle, XCircle, Clock, BarChart2 } from "lucide-react"

interface OperacaoStats {
  total: number
  aprovadas: number
  recusadas: number
  pendentes: number
  em_andamento: number
  valor_total: number
}

interface FuncionarioStats {
  id: string
  nome: string
  total_operacoes: number
  operacoes_sucesso: number
  operacoes_falha: number
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
  const [funcionariosStats, setFuncionariosStats] = useState<FuncionarioStats[]>([])
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

    // Buscar estatísticas por funcionário
    const { data: profiles } = await supabase.from("profiles").select("*").eq("role", "funcionario")

    if (profiles) {
      const funcionariosPromises = profiles.map(async (func) => {
        const { data: funcOperacoes } = await supabase.from("operacoes").select("*").eq("created_by", func.id)

        return {
          id: func.id,
          nome: func.nome,
          total_operacoes: funcOperacoes?.length || 0,
          operacoes_sucesso:
            funcOperacoes?.filter(
              (op) =>
                op.status === "credito_aprovado" ||
                op.status === "contrato_assinado" ||
                op.status === "contrato_registrado",
            ).length || 0,
          operacoes_falha: funcOperacoes?.filter((op) => op.status === "recusada").length || 0,
          valor_total: funcOperacoes?.reduce((sum, op) => sum + (op.valor || 0), 0) || 0,
        }
      })

      const funcionariosData = await Promise.all(funcionariosPromises)
      setFuncionariosStats(funcionariosData)
    }

    // Buscar operações recentes
    const { data: recentes } = await supabase
      .from("operacoes")
      .select(`
        *,
        profiles(nome)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

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
      .limit(3)

    if (recentes) {
      setOperacoesRecentes(recentes)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // Dados para o gráfico de status
  const statusData = [
    { name: "Aprovadas", value: operacaoStats.aprovadas },
    { name: "Recusadas", value: operacaoStats.recusadas },
    { name: "Pendentes", value: operacaoStats.pendentes },
    { name: "Em Andamento", value: operacaoStats.em_andamento },
  ]

  const COLORS = ["#4CAF50", "#F44336", "#FFC107", "#2196F3"]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{isMaster ? "Dashboard Administrativo" : "Meu Dashboard"}</h1>

      {/* Cards de estatísticas com design melhorado */}
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

        <Card className="overflow-hidden border-t-4 border-t-orange-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-orange-50 dark:bg-orange-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">Valor Total</CardTitle>
              <BarChart2 className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-orange-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              }).format(operacaoStats.valor_total)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Valor total das operações</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pendentes</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-yellow-600">{operacaoStats.pendentes}</div>
            <p className="text-sm text-muted-foreground mt-1">Operações em fase inicial (Pré-análise, Análise)</p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{
                  width: `${operacaoStats.total > 0 ? (operacaoStats.pendentes / operacaoStats.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Em Andamento</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600">{operacaoStats.em_andamento}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Operações em fase de análise detalhada (Análise de Crédito, Jurídica, Comitê)
            </p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${operacaoStats.total > 0 ? (operacaoStats.em_andamento / operacaoStats.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo específico para Master */}
      {isMaster ? (
        <Tabs defaultValue="graficos">
          <TabsList className="mb-4">
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          </TabsList>

          <TabsContent value="graficos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status das Operações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {operacoesRecentes.map((op) => (
                      <div
                        key={op.id}
                        className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium">{op.cnpj_empresa}</h3>
                          <p className="text-sm text-muted-foreground">Por: {op.profiles?.nome}</p>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              op.status === "credito_aprovado" ||
                              op.status === "contrato_assinado" ||
                              op.status === "contrato_registrado"
                                ? "bg-green-100 text-green-800"
                                : op.status === "recusada"
                                  ? "bg-red-100 text-red-800"
                                  : op.status === "pre_analise" || op.status === "analise"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="funcionarios">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho dos Funcionários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funcionariosStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_operacoes" name="Total de Operações" fill="#FF9800" />
                      <Bar dataKey="operacoes_sucesso" name="Operações Aprovadas" fill="#4CAF50" />
                      <Bar dataKey="operacoes_falha" name="Operações Recusadas" fill="#F44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left">Funcionário</th>
                        <th className="p-2 text-right">Total Operações</th>
                        <th className="p-2 text-right">Aprovadas</th>
                        <th className="p-2 text-right">Recusadas</th>
                        <th className="p-2 text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funcionariosStats.map((func) => (
                        <tr key={func.id} className="border-t">
                          <td className="p-2">{func.nome}</td>
                          <td className="p-2 text-right">{func.total_operacoes}</td>
                          <td className="p-2 text-right text-green-600">{func.operacoes_sucesso}</td>
                          <td className="p-2 text-right text-red-600">{func.operacoes_falha}</td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(func.valor_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Dashboard do Funcionário
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progresso de Metas</CardTitle>
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
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-orange-500 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (operacaoStats.total / (profile?.meta_operacoes || 10)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {operacoesRecentes.length > 0 ? (
                  operacoesRecentes.map((op) => (
                    <div
                      key={op.id}
                      className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{op.cnpj_empresa}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(op.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            op.status === "credito_aprovado" ||
                            op.status === "contrato_assinado" ||
                            op.status === "contrato_registrado"
                              ? "bg-green-100 text-green-800"
                              : op.status === "recusada"
                                ? "bg-red-100 text-red-800"
                                : op.status === "pre_analise" || op.status === "analise"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
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
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">Nenhuma operação recente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
