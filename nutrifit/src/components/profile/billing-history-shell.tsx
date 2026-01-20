"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowLeft, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CyberBackground } from "@/components/landing/cyber-background";
import { createClient } from "@/lib/supabase/client";

type Invoice = {
  id: string;
  user_id: string;
  numero: string;
  data_emissao: string;
  data_vencimento: string;
  valor: number;
  status: "paga" | "pendente" | "cancelada";
  descricao: string;
  url_pdf?: string;
};

export function BillingHistoryShell() {
  const supabase = createClient();
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterStatus, setFilterStatus] = React.useState<string>("todos");
  const [filterDate, setFilterDate] = React.useState<string>("");

  React.useEffect(() => {
    loadInvoices();
  }, []);

  React.useEffect(() => {
    applyFilters();
  }, [invoices, filterStatus, filterDate]);

  const loadInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("faturas")
        .select("*")
        .eq("user_id", user.id)
        .order("data_emissao", { ascending: false });

      if (!error && data) {
        setInvoices(data);
      }
    } catch (error) {
      console.error("Erro ao carregar faturas:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = invoices;

    if (filterStatus !== "todos") {
      filtered = filtered.filter((inv) => inv.status === filterStatus);
    }

    if (filterDate) {
      filtered = filtered.filter((inv) =>
        inv.data_emissao.includes(filterDate)
      );
    }

    setFilteredInvoices(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paga":
        return "text-neon-green";
      case "pendente":
        return "text-neon-violet";
      case "cancelada":
        return "text-neon-red";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "paga":
        return "bg-neon-green/10";
      case "pendente":
        return "bg-neon-violet/10";
      case "cancelada":
        return "bg-neon-red/10";
      default:
        return "bg-black/20";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="relative min-h-screen">
      <CyberBackground />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/perfil" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Histórico de Faturas
            </h1>
          </div>

          <Card className="border-cyber-glass-border bg-black/40 backdrop-blur-xl">
            <div className="p-6">
              <div className="mb-6 flex items-center gap-2">
                <Filter className="h-5 w-5 text-neon-cyan" />
                <h2 className="text-lg font-semibold">Filtros</h2>
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="border-cyber-glass-border bg-black/25">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="paga">Pagas</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                      <SelectItem value="cancelada">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Data de Emissão</Label>
                  <Input
                    type="month"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border-cyber-glass-border bg-black/25"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterStatus("todos");
                      setFilterDate("");
                    }}
                    className="w-full border-cyber-glass-border"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>

              <Separator className="my-6 bg-white/10" />

              {loading ? (
                <div className="text-center text-muted-foreground">Carregando...</div>
              ) : filteredInvoices.length > 0 ? (
                <div className="space-y-3">
                  {filteredInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between rounded-lg border border-cyber-glass-border bg-black/20 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-6 w-6 text-neon-cyan" />
                        <div>
                          <p className="font-semibold">{invoice.numero}</p>
                          <p className="text-sm text-muted-foreground">
                            Emissão: {formatDate(invoice.data_emissao)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.descricao}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(invoice.valor)}
                          </p>
                          <p
                            className={`text-xs font-semibold ${getStatusColor(
                              invoice.status
                            )} capitalize`}
                          >
                            {invoice.status === "paga"
                              ? "Paga"
                              : invoice.status === "pendente"
                              ? "Pendente"
                              : "Cancelada"}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="border border-cyber-glass-border"
                          asChild
                        >
                          <a href={invoice.url_pdf} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-cyber-glass-border bg-black/20 p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    Nenhuma fatura encontrada com os filtros aplicados
                  </p>
                </div>
              )}

              <div className="mt-6 rounded-lg bg-black/30 p-4 text-sm text-muted-foreground">
                <p>Total de faturas: {filteredInvoices.length}</p>
                <p>
                  Valor total: {formatCurrency(
                    filteredInvoices.reduce((sum, inv) => sum + inv.valor, 0)
                  )}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
