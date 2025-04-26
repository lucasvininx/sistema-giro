"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { formatarStatus, getStatusColor, supabase, type StatusOperacao } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Calendar, File, Loader2, User, Building, UserCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const tiposImovel = [
  { id: "casa_rua", label: "Casa de rua" },
  { id: "casa_condominio", label: "Casa de condomínio" },
  { id: "terreno_condominio", label: "Terreno de condomínio" },
  { id: "comercial", label: "Comercial" },
  { id: "chacara", label: "Chácara" },
  { id: "apartamento", label: "Apartamento" },
  { id: "imovel_rural_produtivo", label: "Imóvel rural produtivo" },
  { id: "imovel_nao_averbado", label: "Imóvel não averbado" },
  { id: "imovel_misto", label: "Imóvel misto" },
  { id: "multi_familiar", label: "Multi familiar" },
]

export default function OperacaoDetalhesPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile, isMaster } = useAuth()
  const [operacao, setOperacao] = useState<any | null>(null)
  const [parceiro, setParceiro] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imagens, setImagens] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<any[]>([])
  const [socios, setSocios] = useState<any[]>([])
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Verificar se o ID é "nova" e redirecionar
  useEffect(() => {
    if (id === "nova") {
      router.push("/operacoes/nova")
      return
    }

    fetchOperacao()
  }, [id, router])

  const fetchOperacao = async () => {
    // Se o ID for "nova", não tente buscar detalhes
    if (id === "nova") return

    setIsLoading(true)

    try {
      // Buscar operação
      const { data: operacaoData, error: operacaoError } = await supabase
        .from("operacoes")
        .select(`
          *,
          profiles(nome)
        `)
        .eq("id", id)
        .single()

      if (operacaoError) throw operacaoError

      setOperacao(operacaoData)

      // Se a operação tiver um parceiro_id, buscar os detalhes do parceiro
      if (operacaoData.parceiro_id) {
        const { data: parceiroData, error: parceiroError } = await supabase
          .from("parceiros")
          .select("id, nome, documento")
          .eq("id", operacaoData.parceiro_id)
          .single()

        if (!parceiroError && parceiroData) {
          setParceiro(parceiroData)
        }
      }

      // Buscar imagens
      const { data: imagensData } = await supabase
        .from("imagens_imovel")
        .select("*")
        .eq("operacao_id", id)
        .order("is_capa", { ascending: false })

      setImagens(imagensData || [])

      // Buscar documentos
      const { data: documentosData } = await supabase
        .from("documentos")
        .select("*")
        .eq("operacao_id", id)
        .order("created_at", { ascending: false })

      setDocumentos(documentosData || [])

      // Buscar sócios (apenas se for pessoa jurídica)
      if (operacaoData.tipo_pessoa === "juridica") {
        const { data: sociosData } = await supabase.from("socios").select("*").eq("operacao_id", id)
        setSocios(sociosData || [])
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes da operação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da operação.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (novoStatus: StatusOperacao) => {
    if (!isMaster) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem alterar o status da operação.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingStatus(true)

    try {
      const { error } = await supabase.from("operacoes").update({ status: novoStatus }).eq("id", id)

      if (error) throw error

      setOperacao((prev: any) => ({ ...prev, status: novoStatus }))

      toast({
        title: "Status atualizado",
        description: `O status da operação foi alterado para ${formatarStatus(novoStatus)}.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da operação.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (id === "nova") {
    return null // Retornar null para evitar renderização, já que o useEffect irá redirecionar
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!operacao) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold">Operação não encontrada</h2>
        <p className="text-muted-foreground mt-2">
          A operação solicitada não existe ou você não tem permissão para visualizá-la.
        </p>
        <Button className="mt-4" onClick={() => router.push("/operacoes")}>
          Voltar para Operações
        </Button>
      </div>
    )
  }

  const imagemCapa = imagens.find((img) => img.is_capa) || imagens[0]
  const isPessoaJuridica = operacao.tipo_pessoa === "juridica"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/operacoes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detalhes da Operação</h1>
        </div>

        {isMaster && (
          <div className="flex items-center gap-2">
            <Select value={operacao.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status da operação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_analise">Pré-análise</SelectItem>
                <SelectItem value="analise">Análise</SelectItem>
                <SelectItem value="analise_credito">Análise de Crédito</SelectItem>
                <SelectItem value="analise_juridica_laudo">Análise Jurídica e Laudo de Engenharia</SelectItem>
                <SelectItem value="comite">Comitê</SelectItem>
                <SelectItem value="credito_aprovado">Crédito Aprovado</SelectItem>
                <SelectItem value="contrato_assinado">Contrato Assinado</SelectItem>
                <SelectItem value="contrato_registrado">Contrato Registrado</SelectItem>
                <SelectItem value="recusada">Recusada</SelectItem>
              </SelectContent>
            </Select>

            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href={`/operacoes/${id}/editar`}>Editar</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle>Informações da Operação</CardTitle>
                  {isPessoaJuridica ? (
                    <Building className="h-5 w-5 text-primary" />
                  ) : (
                    <UserCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(operacao.status as StatusOperacao)}`}>
                  {formatarStatus(operacao.status as StatusOperacao)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="geral">
                <TabsList className="mb-4">
                  <TabsTrigger value="geral">Geral</TabsTrigger>
                  <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                  <TabsTrigger value="imovel">Imóvel</TabsTrigger>
                  {isPessoaJuridica && <TabsTrigger value="socios">Sócios</TabsTrigger>}
                </TabsList>

                <TabsContent value="geral" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Tipo de Pessoa</h3>
                      <p className="text-base capitalize">{isPessoaJuridica ? "Pessoa Jurídica" : "Pessoa Física"}</p>
                    </div>

                    {isPessoaJuridica ? (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">CNPJ da Empresa</h3>
                        <p className="text-base">{operacao.cnpj_empresa}</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Nome do Cliente</h3>
                          <p className="text-base">{operacao.nome_cliente}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">CPF</h3>
                          <p className="text-base">{operacao.cpf}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                          <p className="text-base">{operacao.email_cliente}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Telefone</h3>
                          <p className="text-base">{operacao.telefone_cliente}</p>
                        </div>
                      </>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Estado Civil</h3>
                      <p className="text-base capitalize">{operacao.estado_civil}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Criado por</h3>
                      <p className="text-base">{operacao.profiles?.nome}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                      <p className="text-base">{new Date(operacao.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    {operacao.parceiro_id && parceiro && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Parceiro Indicador</h3>
                        <p className="text-base">{parceiro.nome || "Não informado"}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="financeiro" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Faturamento</h3>
                      <p className="text-base">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(operacao.faturamento)}
                        {operacao.periodo_faturamento === "mensal" ? " / mês" : " / ano"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Quantidade de Funcionários</h3>
                      <p className="text-base">{operacao.quantidade_funcionarios}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Dívidas</h3>
                    {operacao.possui_dividas ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs text-muted-foreground">Valor das Dívidas</h4>
                          <p className="text-base">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(operacao.valor_dividas || 0)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs text-muted-foreground">Instituição Financeira</h4>
                          <p className="text-base">{operacao.instituicao_financeira || "Não informado"}</p>
                        </div>
                        <div className="md:col-span-2">
                          <h4 className="text-xs text-muted-foreground">Dívidas ou Processos</h4>
                          <p className="text-base">{operacao.dividas_processos || "Não informado"}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base">Não possui dívidas</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="imovel" className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Tipos de Imóvel</h3>
                    <div className="flex flex-wrap gap-2">
                      {operacao.tipos_imovel?.map((tipo: string) => (
                        <span key={tipo} className="px-2 py-1 bg-accent text-accent-foreground rounded-md text-xs">
                          {tiposImovel.find((t) => t.id === tipo)?.label || tipo}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Aluguel</h3>
                    {operacao.imovel_alugado ? (
                      <div>
                        <h4 className="text-xs text-muted-foreground">Valor do Aluguel</h4>
                        <p className="text-base">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(operacao.valor_aluguel || 0)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-base">Imóvel não é alugado</p>
                    )}
                  </div>
                </TabsContent>

                {isPessoaJuridica && (
                  <TabsContent value="socios" className="space-y-4">
                    {socios.length > 0 ? (
                      socios.map((socio) => (
                        <div key={socio.id} className="border rounded-md p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">{socio.nome}</h3>
                              <p className="text-sm text-muted-foreground">
                                {socio.percentual_participacao}% de participação
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">CPF:</span> {socio.cpf}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span> {socio.email}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Telefone:</span> {socio.telefone}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Estado Civil:</span>{" "}
                              <span className="capitalize">{socio.estado_civil}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Nenhum sócio cadastrado</p>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {documentos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentos.map((documento) => (
                    <a
                      key={documento.id}
                      href={documento.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                        <File className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{documento.nome}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(documento.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum documento anexado</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imagens do Imóvel</CardTitle>
            </CardHeader>
            <CardContent>
              {imagens.length > 0 ? (
                <div className="space-y-4">
                  {imagemCapa && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                      <Image
                        src={imagemCapa.url || "/placeholder.svg"}
                        alt="Imagem principal do imóvel"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {imagens
                      .filter((img) => !img.is_capa)
                      .map((imagem) => (
                        <div key={imagem.id} className="relative aspect-square overflow-hidden rounded-md border">
                          <Image
                            src={imagem.url || "/placeholder.svg"}
                            alt="Imagem do imóvel"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhuma imagem disponível</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Criado por</h3>
                  <p>{operacao.profiles?.nome}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Data de criação</h3>
                  <p>{new Date(operacao.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
