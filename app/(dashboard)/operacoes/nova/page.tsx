"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { File, ImageIcon, Loader2, Plus, Star, Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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

const socioSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  estado_civil: z.string().min(1, "Estado civil é obrigatório"),
  percentual_participacao: z.coerce.number().min(0).max(100),
})

// Schema base para ambos os tipos de pessoa
const baseFormSchema = z.object({
  tipo_pessoa: z.enum(["fisica", "juridica"]),
  estado_civil: z.string().min(1, "Estado civil é obrigatório"),
  faturamento: z.coerce.number().min(0, "Faturamento deve ser maior que zero"),
  periodo_faturamento: z.enum(["mensal", "anual"]),
  quantidade_funcionarios: z.coerce.number().min(0, "Quantidade inválida"),
  possui_dividas: z.boolean().default(false),
  valor_dividas: z.coerce.number().optional(),
  instituicao_financeira: z.string().optional(),
  dividas_processos: z.string().optional(),
  imovel_alugado: z.boolean().default(false),
  valor_aluguel: z.coerce.number().optional(),
  tipos_imovel: z.array(z.string()).min(1, "Selecione pelo menos um tipo de imóvel"),
  status: z.string().min(1, "Status é obrigatório"),
  socios: z.array(socioSchema).optional(),
  parceiro_id: z.string().optional(),
  valor: z.coerce.number().default(0),
})

// Schema específico para pessoa jurídica
const pessoaJuridicaSchema = baseFormSchema.extend({
  tipo_pessoa: z.literal("juridica"),
  cnpj_empresa: z.string().min(14, "CNPJ inválido").max(18, "CNPJ inválido"),
  socios: z.array(socioSchema).min(1, "Adicione pelo menos um sócio"),
})

// Schema específico para pessoa física
const pessoaFisicaSchema = baseFormSchema.extend({
  tipo_pessoa: z.literal("fisica"),
  cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  nome: z.string().min(1, "Nome é obrigatório"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
})

// Schema combinado com discriminação por tipo_pessoa
const formSchema = z.discriminatedUnion("tipo_pessoa", [pessoaJuridicaSchema, pessoaFisicaSchema])

interface ImagemPreview {
  id: string
  file: File
  preview: string
  isCapa: boolean
}

interface DocumentoPreview {
  id: string
  file: File
  nome: string
  tipo: string
}

interface Parceiro {
  id: string
  nome: string
  documento: string
}

export default function NovaOperacaoPage() {
  const { profile, isMaster } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagens, setImagens] = useState<ImagemPreview[]>([])
  const [documentos, setDocumentos] = useState<DocumentoPreview[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [isLoadingParceiros, setIsLoadingParceiros] = useState(false)

  // Carregar parceiros
  useEffect(() => {
    const fetchParceiros = async () => {
      setIsLoadingParceiros(true)
      try {
        const { data, error } = await supabase.from("parceiros").select("id, nome, documento").order("nome")

        if (error) throw error
        setParceiros(data || [])
      } catch (error) {
        console.error("Erro ao buscar parceiros:", error)
      } finally {
        setIsLoadingParceiros(false)
      }
    }

    fetchParceiros()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_pessoa: "juridica",
      estado_civil: "solteiro",
      faturamento: 0,
      periodo_faturamento: "mensal",
      quantidade_funcionarios: 0,
      possui_dividas: false,
      valor_dividas: 0,
      instituicao_financeira: "",
      dividas_processos: "",
      imovel_alugado: false,
      valor_aluguel: 0,
      tipos_imovel: [],
      status: "pre_analise",
      parceiro_id: undefined,
      valor: 0,
      socios: [
        {
          id: uuidv4(),
          nome: "",
          cpf: "",
          telefone: "",
          email: "",
          estado_civil: "solteiro",
          percentual_participacao: 0,
        },
      ],
    },
  })

  const { watch, setValue, resetField } = form
  const tipoPessoa = watch("tipo_pessoa")
  const possuiDividas = watch("possui_dividas")
  const imovelAlugado = watch("imovel_alugado")

  // Efeito para resetar campos quando o tipo de pessoa muda
  useEffect(() => {
    if (tipoPessoa === "fisica") {
      // Limpar campos específicos de pessoa jurídica
      resetField("cnpj_empresa")
      resetField("socios")
    } else {
      // Limpar campos específicos de pessoa física
      resetField("cpf")
      resetField("nome")
      resetField("telefone")
      resetField("email")

      // Garantir que haja pelo menos um sócio para pessoa jurídica
      if (!watch("socios") || watch("socios").length === 0) {
        setValue("socios", [
          {
            id: uuidv4(),
            nome: "",
            cpf: "",
            telefone: "",
            email: "",
            estado_civil: "solteiro",
            percentual_participacao: 0,
          },
        ])
      }
    }
  }, [tipoPessoa, resetField, setValue, watch])

  const handleImagensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const novasImagens: ImagemPreview[] = []

      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const preview = event.target?.result as string
          const isCapa = imagens.length === 0 && novasImagens.length === 0

          novasImagens.push({
            id: uuidv4(),
            file,
            preview,
            isCapa,
          })

          if (novasImagens.length === e.target.files!.length) {
            setImagens((prev) => [...prev, ...novasImagens])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDocumentosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const novosDocumentos: DocumentoPreview[] = []

      Array.from(e.target.files).forEach((file) => {
        novosDocumentos.push({
          id: uuidv4(),
          file,
          nome: file.name,
          tipo: file.type,
        })
      })

      setDocumentos((prev) => [...prev, ...novosDocumentos])
    }
  }

  const removerImagem = (id: string) => {
    const imagemRemovida = imagens.find((img) => img.id === id)
    const novasImagens = imagens.filter((img) => img.id !== id)

    // Se a imagem removida era a capa e ainda existem outras imagens, definir a primeira como capa
    if (imagemRemovida?.isCapa && novasImagens.length > 0) {
      novasImagens[0].isCapa = true
    }

    setImagens(novasImagens)
  }

  const definirComoCapa = (id: string) => {
    setImagens((prev) =>
      prev.map((img) => ({
        ...img,
        isCapa: img.id === id,
      })),
    )
  }

  const removerDocumento = (id: string) => {
    setDocumentos((prev) => prev.filter((doc) => doc.id !== id))
  }

  const addSocio = () => {
    const currentSocios = form.getValues("socios") || []
    setValue("socios", [
      ...currentSocios,
      {
        id: uuidv4(),
        nome: "",
        cpf: "",
        telefone: "",
        email: "",
        estado_civil: "solteiro",
        percentual_participacao: 0,
      },
    ])
  }

  const removeSocio = (index: number) => {
    const currentSocios = form.getValues("socios") || []
    if (currentSocios.length > 1) {
      setValue(
        "socios",
        currentSocios.filter((_, i) => i !== index),
      )
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!profile) return

    setIsSubmitting(true)

    try {
      // Preparar dados da operação com base no tipo de pessoa
      const operacaoData: any = {
        estado_civil: data.estado_civil,
        faturamento: data.faturamento,
        periodo_faturamento: data.periodo_faturamento,
        quantidade_funcionarios: data.quantidade_funcionarios,
        possui_dividas: data.possui_dividas,
        valor_dividas: data.possui_dividas ? data.valor_dividas : null,
        instituicao_financeira: data.possui_dividas ? data.instituicao_financeira : null,
        dividas_processos: data.possui_dividas ? data.dividas_processos : null,
        imovel_alugado: data.imovel_alugado,
        valor_aluguel: data.imovel_alugado ? data.valor_aluguel : null,
        tipos_imovel: data.tipos_imovel,
        status: data.status,
        parceiro_id: data.parceiro_id || null,
        created_by: profile.id,
        tipo_pessoa: data.tipo_pessoa,
        valor: data.valor || 0,
      }

      // Adicionar campos específicos com base no tipo de pessoa
      if (data.tipo_pessoa === "juridica") {
        operacaoData.cnpj_empresa = data.cnpj_empresa
      } else {
        operacaoData.cpf = data.cpf
        operacaoData.nome_cliente = data.nome
        operacaoData.telefone_cliente = data.telefone
        operacaoData.email_cliente = data.email
      }

      // Criar a operação
      const { data: operacao, error } = await supabase.from("operacoes").insert(operacaoData).select().single()

      if (error) {
        throw new Error(`Erro ao criar operação: ${error.message}`)
      }

      // Inserir os sócios na tabela de sócios (apenas para pessoa jurídica)
      if (data.tipo_pessoa === "juridica" && data.socios && data.socios.length > 0) {
        const sociosComOperacaoId = data.socios.map((socio) => ({
          ...socio,
          operacao_id: operacao.id,
        }))

        const { error: sociosError } = await supabase.from("socios").insert(sociosComOperacaoId)

        if (sociosError) {
          console.error(`Erro ao inserir sócios: ${sociosError.message}`)
          // Não vamos interromper o fluxo se houver erro ao inserir sócios
        }
      }

      // Upload das imagens
      if (imagens.length > 0) {
        for (const imagem of imagens) {
          const fileExt = imagem.file.name.split(".").pop()
          const fileName = `${uuidv4()}.${fileExt}`
          const filePath = `operacoes/${operacao.id}/${fileName}`

          const { error: uploadError } = await supabase.storage.from("images").upload(filePath, imagem.file)

          if (uploadError) {
            console.error(`Erro ao fazer upload da imagem: ${uploadError.message}`)
            continue
          }

          const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath)

          // Registrar imagem no banco
          await supabase.from("imagens_imovel").insert({
            operacao_id: operacao.id,
            url: urlData.publicUrl,
            is_capa: imagem.isCapa,
          })
        }
      }

      // Upload dos documentos
      if (documentos.length > 0) {
        for (const documento of documentos) {
          const fileExt = documento.file.name.split(".").pop()
          const fileName = `${uuidv4()}.${fileExt}`
          const filePath = `operacoes/${operacao.id}/${fileName}`

          const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, documento.file)

          if (uploadError) {
            console.error(`Erro ao fazer upload do documento: ${uploadError.message}`)
            continue
          }

          const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

          // Registrar documento no banco
          await supabase.from("documentos").insert({
            operacao_id: operacao.id,
            nome: documento.nome,
            tipo: documento.tipo,
            url: urlData.publicUrl,
          })
        }
      }

      toast({
        title: "Operação criada com sucesso!",
        description: "A operação foi registrada no sistema.",
      })

      router.push("/operacoes")
    } catch (error: any) {
      console.error("Erro ao criar operação:", error)
      toast({
        title: "Erro ao criar operação",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Nova Operação</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulário de Operação</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                {/* Seleção de tipo de pessoa */}
                <FormField
                  control={form.control}
                  name="tipo_pessoa"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Pessoa</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valor da operação */}
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Operação (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>Informe o valor total da operação</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos específicos para pessoa jurídica */}
                {tipoPessoa === "juridica" && (
                  <FormField
                    control={form.control}
                    name="cnpj_empresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ da Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="00.000.000/0000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Campos específicos para pessoa física */}
                {tipoPessoa === "fisica" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="estado_civil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado civil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro</SelectItem>
                          <SelectItem value="casado">Casado</SelectItem>
                          <SelectItem value="divorciado">Divorciado</SelectItem>
                          <SelectItem value="viuvo">Viúvo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo de parceiro indicador */}
                <FormField
                  control={form.control}
                  name="parceiro_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parceiro Indicador (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um parceiro (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parceiros.map((parceiro) => (
                            <SelectItem key={parceiro.id} value={parceiro.id}>
                              {parceiro.nome} - {parceiro.documento}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Selecione o parceiro que indicou esta operação, se aplicável.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="faturamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faturamento</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="periodo_faturamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Período</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidade_funcionarios"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Funcionários</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="possui_dividas"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Possui dívidas?</FormLabel>
                          <FormDescription>Marque esta opção se possui dívidas</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {possuiDividas && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6 border-l-2 border-primary/20">
                      <FormField
                        control={form.control}
                        name="valor_dividas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor das Dívidas</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instituicao_financeira"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instituição Financeira</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dividas_processos"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Dívidas ou Processos (PF ou PJ)</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="imovel_alugado"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Imóvel Alugado?</FormLabel>
                          <FormDescription>Marque esta opção se o imóvel é alugado</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {imovelAlugado && (
                    <div className="pl-6 border-l-2 border-primary/20">
                      <FormField
                        control={form.control}
                        name="valor_aluguel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor do Aluguel</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="tipos_imovel"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Tipos de Imóvel</FormLabel>
                        <FormDescription>Selecione os tipos de imóvel aplicáveis</FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {tiposImovel.map((tipo) => (
                          <FormField
                            key={tipo.id}
                            control={form.control}
                            name="tipos_imovel"
                            render={({ field }) => {
                              return (
                                <FormItem key={tipo.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(tipo.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, tipo.id])
                                          : field.onChange(field.value?.filter((value) => value !== tipo.id))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{tipo.label}</FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div>
                    <Label>Imagens do Imóvel</Label>
                    <div className="mt-2">
                      <Label
                        htmlFor="imagens"
                        className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                      >
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">Selecionar imagens</span>
                        <span className="mt-1 text-xs text-gray-400">Clique para adicionar</span>
                        <Input
                          id="imagens"
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={handleImagensChange}
                        />
                      </Label>
                    </div>

                    {imagens.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagens.map((imagem) => (
                          <div key={imagem.id} className="relative group">
                            <div className="relative h-32 w-full overflow-hidden rounded-md border">
                              <Image
                                src={imagem.preview || "/placeholder.svg"}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                              {imagem.isCapa && (
                                <div className="absolute top-1 left-1 bg-primary text-white p-1 rounded-full">
                                  <Star className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {!imagem.isCapa && (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => definirComoCapa(imagem.id)}
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removerImagem(imagem.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Documentos</Label>
                    <div className="mt-2">
                      <Label
                        htmlFor="documentos"
                        className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                      >
                        <File className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">Selecionar documentos</span>
                        <span className="mt-1 text-xs text-gray-400">PDF, DOC, imagens, etc.</span>
                        <Input
                          id="documentos"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleDocumentosChange}
                        />
                      </Label>
                    </div>

                    {documentos.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {documentos.map((documento) => (
                          <div key={documento.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <File className="h-5 w-5 text-blue-500" />
                              <span className="text-sm truncate max-w-xs">{documento.nome}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removerDocumento(documento.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status da Operação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pre_analise">Pré-análise</SelectItem>
                          {isMaster && (
                            <>
                              <SelectItem value="analise">Análise</SelectItem>
                              <SelectItem value="analise_credito">Análise de Crédito</SelectItem>
                              <SelectItem value="analise_juridica_laudo">
                                Análise Jurídica e Laudo de Engenharia
                              </SelectItem>
                              <SelectItem value="comite">Comitê</SelectItem>
                              <SelectItem value="credito_aprovado">Crédito Aprovado</SelectItem>
                              <SelectItem value="contrato_assinado">Contrato Assinado</SelectItem>
                              <SelectItem value="contrato_registrado">Contrato Registrado</SelectItem>
                              <SelectItem value="recusada">Recusada</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {!isMaster && (
                        <FormDescription>
                          Novas operações são criadas com status "Pré-análise". Apenas administradores podem definir
                          outros status.
                        </FormDescription>
                      )}
                    </FormItem>
                  )}
                />

                {/* Seção de sócios (apenas para pessoa jurídica) */}
                {tipoPessoa === "juridica" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Sócios</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addSocio}>
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Sócio
                      </Button>
                    </div>

                    {form.watch("socios")?.map((_, index) => (
                      <div key={index} className="rounded-md border p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Sócio {index + 1}</h4>
                          {form.watch("socios")?.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeSocio(index)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`socios.${index}.nome`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`socios.${index}.cpf`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`socios.${index}.telefone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`socios.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`socios.${index}.estado_civil`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado Civil</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o estado civil" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="solteiro">Solteiro</SelectItem>
                                    <SelectItem value="casado">Casado</SelectItem>
                                    <SelectItem value="divorciado">Divorciado</SelectItem>
                                    <SelectItem value="viuvo">Viúvo</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`socios.${index}.percentual_participacao`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Percentual de Participação (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" max="100" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Operação
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
