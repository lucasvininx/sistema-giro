"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MoreHorizontal, Plus, Search } from "lucide-react";
import Link from "next/link";

export default function ParceirosPage() {
  const { profile } = useAuth();
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [apenasMeusParceiros, setApenasMeusParceiros] = useState(true);

  const isAdmin = profile?.role === "master";

  useEffect(() => {
    if (profile) {
      fetchParceiros();
    }
  }, [profile, apenasMeusParceiros]);

  const fetchParceiros = async () => {
    setIsLoading(true);

    let query = supabase.from("parceiros").select(`
        *,
        profiles(nome)
      `);

    // Aplicar filtro por usuário, exceto se for admin e o filtro estiver desativado
    if (!isAdmin || (isAdmin && apenasMeusParceiros)) {
      query = query.eq("created_by", profile?.id);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar parceiros:", error);
    } else {
      setParceiros(data || []);
    }

    setIsLoading(false);
  };

  const filteredParceiros = parceiros.filter((parceiro) => {
    return (
      searchTerm === "" ||
      parceiro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parceiro.documento.includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Parceiros</h1>
        <Link href="/parceiros/novo">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" /> Novo Parceiro
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Todos os Parceiros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-auto sm:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome ou documento..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="meus-parceiros"
                  checked={apenasMeusParceiros}
                  onCheckedChange={setApenasMeusParceiros}
                />
                <Label htmlFor="meus-parceiros">Apenas meus parceiros</Label>
              </div>
            )}
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
                    <TableHead>Documento</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cadastrado por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParceiros.length > 0 ? (
                    filteredParceiros.map((parceiro) => (
                      <TableRow key={parceiro.id}>
                        <TableCell className="font-medium">
                          {parceiro.nome}
                        </TableCell>
                        <TableCell>
                          {parceiro.tipo_documento === "cpf"
                            ? "CPF: "
                            : "CNPJ: "}
                          {parceiro.documento}
                        </TableCell>
                        <TableCell>{parceiro.telefone}</TableCell>
                        <TableCell>{parceiro.email}</TableCell>
                        <TableCell>{parceiro.profiles?.nome}</TableCell>
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
                                <Link href={`/parceiros/${parceiro.id}`}>
                                  Ver detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/parceiros/${parceiro.id}/editar`}>
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-gray-500"
                      >
                        {!isAdmin || apenasMeusParceiros
                          ? "Você não possui parceiros cadastrados"
                          : "Nenhum parceiro encontrado no sistema"}
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
  );
}
