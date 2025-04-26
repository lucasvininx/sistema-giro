"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"

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

export default function EditarOperacaoPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [parceiros, setParceiros] = useState<any[]>([])
  const [socios, setSocios] = useState<any[]>([])
  const [tipoPessoa, setTipoPessoa] = useState<"fisica" | "juridica">("juridica")

  // Formulário
  const [formData, setFormData] = useState({
    // Dados gerais
    tipo_pessoa: "juridica" as "fisica" | "juridica",
    cnpj_empresa: "",
    nome_cliente: "",
    cpf: "",
    email_cliente: "",
    telefone_cliente: "",
    estado_civil: "solteiro",
    parceiro_id: "",

    // Dados financeiros
    faturamento: 0,
    periodo_faturamento: "mensal",
    quantidade_funcionarios: 0,
    possui_dividas: false,
    valor_dividas: 0,
    instituicao_financeira: "",
    dividas_processos: "",

    // Dados do imóvel
    tipos_imovel: [] as string[],
    imovel_alugado: false,
    valor_aluguel: 0,
  })

  // Buscar dados da operação
  useEffect(() => {
    const fetchOperacao = async () => {
      setIsLoading(true)
      try {
        // Buscar operação
        const { data: operacao, error } = await supabase.from("operacoes").select("*").eq("id", id).single()

        if (error) throw error

        // Atualizar formulário com dados da operação
        setFormData({
          ...formData,
          ...operacao,
        })

        setTipoPessoa(operacao.tipo_pessoa || "juridica")

        // Buscar sócios se for pessoa jurídica
        if (operacao.tipo_pessoa === "juridica") {
          const { data: sociosData } = await supabase.from("socios").select("*").eq("operacao_id", id)

          setSocios(sociosData || [])
        }

        // Buscar parceiros para o select
        const { data: parceirosData } = await supabase.from("parceiros").select("id, nome").order("nome")

        setParceiros(parceirosData || [])
      } catch (error) {
        console.error("Erro ao buscar operação:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da operação.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOperacao()
  }, [id])

  // Adicionar novo sócio
  const adicionarSocio = () => {
    setSocios([
      ...socios,
      {
        id: `temp-${Date.now()}`,
        nome: "",
        cpf: "",
        email: "",
        telefone: "",
        estado_civil: "solteiro",
        percentual_participacao: 0,
        isNew: true,
      },
    ])
  }

  // Atualizar dados de um sócio
  const atualizarSocio = (index: number, campo: string, valor: any) => {
    const novosSocios = [...socios]
    novosSocios[index] = {
      ...novosSocios[index],
      [campo]: valor,
    }
    setSocios(novosSocios)
  }

  // Remover sócio
  const removerSocio = (index: number) => {
    const novosSocios = [...socios]
    novosSocios.splice(index, 1)
    setSocios(novosSocios)
  }

  // Atualizar tipos de imóvel selecionados
  const toggleTipoImovel = (tipo: string) => {
    if (formData.tipos_imovel.includes(tipo)) {
      setFormData({
        ...formData,
        tipos_imovel: formData.tipos_imovel.filter((t) => t !== tipo),
      })
    } else {
      setFormData({
        ...formData,
        tipos_imovel: [...formData.tipos_imovel, tipo],
      })
    }
  }

  // Salvar operação
  const salvarOperacao = async () => {
    setIsSaving(true)

    try {
      // Validar dados
      if (tipoPessoa === "juridica" && !formData.cnpj_empresa) {
        toast({
          title: "Erro",
          description: "O CNPJ da empresa é obrigatório.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      if (tipoPessoa === "fisica" && (!formData.nome_cliente || !formData.cpf)) {
        toast({
          title: "Erro",
          description: "Nome e CPF são obrigatórios para pessoa física.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      // Atualizar operação
      const { error } = await supabase
        .from("operacoes")
        .update({
          ...formData,
          tipo_pessoa: tipoPessoa,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // Atualizar sócios (apenas para pessoa jurídica)
      if (tipoPessoa === "juridica") {
        // Para cada sócio
        for (const socio of socios) {
          if (socio.isNew) {
            // Criar novo sócio
            const { error: socioError } = await supabase.from("socios").insert({
              ...socio,
              operacao_id: id,
              isNew: undefined, // Remover campo temporário
            })
            if (socioError) throw socioError
          } else {
            // Atualizar sócio existente
            const { error: socioError } = await supabase
              .from("socios")
              .update({
                ...socio,
                isNew: undefined, // Remover campo temporário
              })
              .eq("id", socio.id)
            if (socioError) throw socioError
          }
        }
      }

      toast({
        title: "Sucesso",
        description: "Operação atualizada com sucesso.",
      })

      // Redirecionar para a página de detalhes
      router.push(`/operacoes/${id}`)
    } catch (error) {
      console.error("Erro ao salvar operação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a operação.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/operacoes/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Editar Operação</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/operacoes/${id}`)}>
            Cancelar
          </Button>
          <Button onClick={salvarOperacao} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Salvar Alterações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="mb-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="imovel">Imóvel</TabsTrigger>
          {tipoPessoa === "juridica" && <TabsTrigger value="socios">Sócios</TabsTrigger>}
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tipo de Pessoa</Label>
                <RadioGroup
                  value={tipoPessoa}
                  onValueChange={(value) => setTipoPessoa(value as "fisica" | "juridica")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="juridica" id="juridica" />
                    <Label htmlFor="juridica">Pessoa Jurídica</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fisica" id="fisica" />
                    <Label htmlFor="fisica">Pessoa Física</Label>
                  </div>
                </RadioGroup>
              </div>

              {tipoPessoa === "juridica" ? (
                <div className="space-y-2">
                  <Label htmlFor="cnpj_empresa">CNPJ da Empresa</Label>
                  <Input
                    id="cnpj_empresa"
                    value={formData.cnpj_empresa}
                    onChange={(e) => setFormData({ ...formData, cnpj_empresa: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome_cliente">Nome do Cliente</Label>
                    <Input
                      id="nome_cliente"
                      value={formData.nome_cliente}
                      onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_cliente">Email</Label>
                    <Input
                      id="email_cliente"
                      type="email"
                      value={formData.email_cliente}
                      onChange={(e) => setFormData({ ...formData, email_cliente: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone_cliente">Telefone</Label>
                    <Input
                      id="telefone_cliente"
                      value={formData.telefone_cliente}
                      onChange={(e) => setFormData({ ...formData, telefone_cliente: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="estado_civil">Estado Civil</Label>
                <Select
                  value={formData.estado_civil}
                  onValueChange={(value) => setFormData({ ...formData, estado_civil: value })}
                >
                  <SelectTrigger id="estado_civil">
                    <SelectValue placeholder="Selecione o estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União Estável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parceiro_id">Parceiro Indicador</Label>
                <Select
                  value={formData.parceiro_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, parceiro_id: value })}
                >
                  <SelectTrigger id="parceiro_id">
                    <SelectValue placeholder="Selecione um parceiro (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {parceiros.map((parceiro) => (
                      <SelectItem key={parceiro.id} value={parceiro.id}>
                        {parceiro.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle>Informações Financeiras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faturamento">Faturamento</Label>
                  <Input
                    id="faturamento"
                    type="number"
                    value={formData.faturamento}
                    onChange={(e) => setFormData({ ...formData, faturamento: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodo_faturamento">Período</Label>
                  <Select
                    value={formData.periodo_faturamento}
                    onValueChange={(value) => setFormData({ ...formData, periodo_faturamento: value })}
                  >
                    <SelectTrigger id="periodo_faturamento">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade_funcionarios">Quantidade de Funcionários</Label>
                  <Input
                    id="quantidade_funcionarios"
                    type="number"
                    value={formData.quantidade_funcionarios}
                    onChange={(e) => setFormData({ ...formData, quantidade_funcionarios: Number(e.target.value) })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="possui_dividas"
                    checked={formData.possui_dividas}
                    onCheckedChange={(checked) => setFormData({ ...formData, possui_dividas: checked })}
                  />
                  <Label htmlFor="possui_dividas">Possui dívidas ou processos?</Label>
                </div>

                {formData.possui_dividas && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="valor_dividas">Valor das Dívidas</Label>
                      <Input
                        id="valor_dividas"
                        type="number"
                        value={formData.valor_dividas}
                        onChange={(e) => setFormData({ ...formData, valor_dividas: Number(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instituicao_financeira">Instituição Financeira</Label>
                      <Input
                        id="instituicao_financeira"
                        value={formData.instituicao_financeira}
                        onChange={(e) => setFormData({ ...formData, instituicao_financeira: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="dividas_processos">Detalhes das Dívidas ou Processos</Label>
                      <Textarea
                        id="dividas_processos"
                        value={formData.dividas_processos}
                        onChange={(e) => setFormData({ ...formData, dividas_processos: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imovel">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Imóvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tipos de Imóvel</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tiposImovel.map((tipo) => (
                    <div key={tipo.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tipo-${tipo.id}`}
                        checked={formData.tipos_imovel.includes(tipo.id)}
                        onCheckedChange={() => toggleTipoImovel(tipo.id)}
                      />
                      <Label htmlFor={`tipo-${tipo.id}`}>{tipo.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="imovel_alugado"
                    checked={formData.imovel_alugado}
                    onCheckedChange={(checked) => setFormData({ ...formData, imovel_alugado: checked })}
                  />
                  <Label htmlFor="imovel_alugado">Imóvel é alugado?</Label>
                </div>

                {formData.imovel_alugado && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="valor_aluguel">Valor do Aluguel</Label>
                    <Input
                      id="valor_aluguel"
                      type="number"
                      value={formData.valor_aluguel}
                      onChange={(e) => setFormData({ ...formData, valor_aluguel: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {tipoPessoa === "juridica" && (
          <TabsContent value="socios">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sócios</CardTitle>
                <Button size="sm" onClick={adicionarSocio}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Sócio
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {socios.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum sócio cadastrado. Clique em "Adicionar Sócio" para incluir.
                  </p>
                ) : (
                  socios.map((socio, index) => (
                    <div key={socio.id} className="border rounded-md p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Sócio {index + 1}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerSocio(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`socio-${index}-nome`}>Nome</Label>
                          <Input
                            id={`socio-${index}-nome`}
                            value={socio.nome}
                            onChange={(e) => atualizarSocio(index, "nome", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`socio-${index}-cpf`}>CPF</Label>
                          <Input
                            id={`socio-${index}-cpf`}
                            value={socio.cpf}
                            onChange={(e) => atualizarSocio(index, "cpf", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`socio-${index}-email`}>Email</Label>
                          <Input
                            id={`socio-${index}-email`}
                            type="email"
                            value={socio.email}
                            onChange={(e) => atualizarSocio(index, "email", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`socio-${index}-telefone`}>Telefone</Label>
                          <Input
                            id={`socio-${index}-telefone`}
                            value={socio.telefone}
                            onChange={(e) => atualizarSocio(index, "telefone", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`socio-${index}-estado-civil`}>Estado Civil</Label>
                          <Select
                            value={socio.estado_civil}
                            onValueChange={(value) => atualizarSocio(index, "estado_civil", value)}
                          >
                            <SelectTrigger id={`socio-${index}-estado-civil`}>
                              <SelectValue placeholder="Selecione o estado civil" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                              <SelectItem value="casado">Casado(a)</SelectItem>
                              <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                              <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                              <SelectItem value="uniao_estavel">União Estável</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`socio-${index}-participacao`}>Percentual de Participação (%)</Label>
                          <Input
                            id={`socio-${index}-participacao`}
                            type="number"
                            min="0"
                            max="100"
                            value={socio.percentual_participacao}
                            onChange={(e) => atualizarSocio(index, "percentual_participacao", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
