"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Activity,
  Database,
  LogOut,
  Shield,
  TrendingUp,
  FileText,
  Settings,
  Pause,
  Play,
  Calendar,
  Plus,
  Search,
  DollarSign,
  CreditCard,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
} from "lucide-react";
import { CyberBackground } from "@/components/landing/cyber-background";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  nome: string | null;
  email: string | null;
  tipo_plano: "free" | "plus";
  nome_assistente: string | null;
  contagem_streak: number;
  plano_pausado: boolean;
  plano_expira_em: string | null;
  plano_iniciado_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = React.useState({
    users: 0,
    plus: 0,
    free: 0,
    scans: 0,
    workouts: 0,
    diets: 0,
  });
  const [financialStats, setFinancialStats] = React.useState({
    receitaTotal: 0,
    receitaMesAtual: 0,
    receitaMesAnterior: 0,
    assinaturasAtivas: 0,
    assinaturasCanceladas: 0,
    transacoesPagas: 0,
    transacoesPendentes: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [financialLoading, setFinancialLoading] = React.useState(true);
  const [users, setUsers] = React.useState<User[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [transactions, setTransactions] = React.useState<Array<{
    id: number;
    user_id: string;
    tipo: string;
    plano: string;
    valor: number;
    status: string;
    metodo_pagamento: string | null;
    referencia_externa: string | null;
    notas: string | null;
    criado_em: string;
    user_nome: string | null;
    user_email: string | null;
  }>>([]);
  const [transactionsLoading, setTransactionsLoading] = React.useState(false);

  const loadStats = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{
        ok: boolean;
        stats: {
          users: number;
          plus: number;
          free: number;
          scans: number;
          workouts: number;
          diets: number;
        };
      }>;
      if (data.ok && data.stats) {
        setStats(data.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadUsers = React.useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean; users: User[] }>;
      if (data.ok && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch {
      // ignore
    } finally {
      setUsersLoading(false);
    }
  }, [router]);

  const loadFinancialStats = React.useCallback(async () => {
    setFinancialLoading(true);
    try {
      const res = await fetch("/api/admin/financial/stats");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{
        ok: boolean;
        stats: {
          receitaTotal: number;
          receitaMesAtual: number;
          receitaMesAnterior: number;
          assinaturasAtivas: number;
          assinaturasCanceladas: number;
          transacoesPagas: number;
          transacoesPendentes: number;
        };
      }>;
      if (data.ok && data.stats) {
        setFinancialStats(data.stats);
      }
    } catch {
      // ignore
    } finally {
      setFinancialLoading(false);
    }
  }, [router]);

  const loadTransactions = React.useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const res = await fetch("/api/admin/financial/transactions?limit=20");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{
        ok: boolean;
        transactions: Array<{
          id: number;
          user_id: string;
          tipo: string;
          plano: string;
          valor: number;
          status: string;
          metodo_pagamento: string | null;
          referencia_externa: string | null;
          notas: string | null;
          criado_em: string;
          user_nome: string | null;
          user_email: string | null;
        }>;
      }>;
      if (data.ok && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch {
      // ignore
    } finally {
      setTransactionsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    void loadStats();
    void loadUsers();
    void loadFinancialStats();
    void loadTransactions();
  }, [loadStats, loadUsers, loadFinancialStats, loadTransactions]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleSaveUser = async (updates: {
    tipo_plano?: "free" | "plus";
    plano_pausado?: boolean;
    adicionar_dias?: number;
  }) => {
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean }>;
      if (data.ok) {
        setEditDialogOpen(false);
        setEditingUser(null);
        await loadUsers();
        await loadStats();
      }
    } catch {
      // ignore
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    return (
      (u.nome?.toLowerCase().includes(query) ?? false) ||
      (u.email?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <div className="relative min-h-screen">
      <CyberBackground />
      <div className="relative z-10">
        <header className="border-b border-cyber-glass-border bg-cyber-glass/25 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyber-glass-border bg-black/20">
                <Shield className="h-5 w-5 text-neon-cyan" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">Painel Administrativo</div>
                <div className="text-xs text-muted-foreground">NutriFit+</div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:bg-cyber-glass/35 hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Visão geral da plataforma e estatísticas
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card
                  key={i}
                  className="border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl"
                >
                  <div className="h-20 animate-pulse rounded-2xl bg-black/20" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={Users}
                label="Total de Usuários"
                value={stats.users}
                accent="cyan"
                subtitle={`${stats.plus} Plus • ${stats.free} Free`}
              />
              <StatCard
                icon={Activity}
                label="Scans Realizados"
                value={stats.scans}
                accent="green"
                subtitle="Total de análises"
              />
              <StatCard
                icon={TrendingUp}
                label="Treinos Registrados"
                value={stats.workouts}
                accent="violet"
                subtitle="Sessões de treino"
              />
              <StatCard
                icon={FileText}
                label="Dietas Geradas"
                value={stats.diets}
                accent="cyan"
                subtitle="Planos criados"
              />
              <StatCard
                icon={Database}
                label="Dados Armazenados"
                value="Ativo"
                accent="green"
                subtitle="Supabase"
              />
              <StatCard
                icon={Settings}
                label="Sistema"
                value="Online"
                accent="violet"
                subtitle="Todos os serviços"
              />
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Financeiro</h2>
            {financialLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card
                    key={i}
                    className="border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl"
                  >
                    <div className="h-20 animate-pulse rounded-2xl bg-black/20" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FinancialCard
                  icon={DollarSign}
                  label="Receita Total"
                  value={financialStats.receitaTotal}
                  accent="green"
                  subtitle="Todas as transações pagas"
                  format="currency"
                />
                <FinancialCard
                  icon={TrendingUp}
                  label="Receita Mês Atual"
                  value={financialStats.receitaMesAtual}
                  accent="cyan"
                  subtitle={financialStats.receitaMesAnterior > 0
                    ? `vs R$ ${financialStats.receitaMesAnterior.toFixed(2)} mês anterior`
                    : "Este mês"}
                  format="currency"
                  trend={
                    financialStats.receitaMesAnterior > 0
                      ? ((financialStats.receitaMesAtual - financialStats.receitaMesAnterior) /
                          financialStats.receitaMesAnterior) *
                        100
                      : undefined
                  }
                />
                <FinancialCard
                  icon={CreditCard}
                  label="Assinaturas Ativas"
                  value={financialStats.assinaturasAtivas}
                  accent="violet"
                  subtitle={`${financialStats.assinaturasCanceladas} canceladas`}
                />
                <FinancialCard
                  icon={Activity}
                  label="Transações"
                  value={financialStats.transacoesPagas}
                  accent="cyan"
                  subtitle={`${financialStats.transacoesPendentes} pendentes`}
                />
              </div>
            )}
          </div>

          <div className="mt-8">
            <Card className="border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold tracking-tight">Transações Recentes</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Últimas transações financeiras
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={loadTransactions}
                  disabled={transactionsLoading}
                >
                  {transactionsLoading ? "Carregando..." : "Atualizar"}
                </Button>
              </div>

              <Separator className="mb-4 bg-white/10" />

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {transactionsLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Carregando transações...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma transação registrada
                  </div>
                ) : (
                  transactions.map((t) => (
                    <TransactionRow key={t.id} transaction={t} />
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold tracking-tight">Ações Rápidas</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Gerenciamento da plataforma
                  </div>
                </div>
                <Badge className="border-cyber-glass-border bg-black/30 text-neon-cyan">
                  Admin
                </Badge>
              </div>
              <Separator className="my-4 bg-white/10" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={() => {
                    void loadStats();
                    void loadFinancialStats();
                  }}
                >
                  Atualizar Estatísticas
                </Button>
                <Button
                  variant="secondary"
                  className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                  onClick={() => router.push("/dashboard")}
                >
                  Ver Dashboard Usuário
                </Button>
              </div>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold tracking-tight">Gerenciar Usuários</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Lista completa de usuários e gerenciamento de planos
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
                    onClick={loadUsers}
                    disabled={usersLoading}
                  >
                    {usersLoading ? "Carregando..." : "Atualizar"}
                  </Button>
                  <Button
                    className="bg-neon-cyan text-black hover:bg-neon-cyan/90"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Usuário
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="pl-10 border-cyber-glass-border bg-black/25"
                  />
                </div>
              </div>

              <Separator className="mb-4 bg-white/10" />

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {usersLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Carregando usuários...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    {search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <UserRow key={user.id} user={user} onEdit={handleEditUser} />
                  ))
                )}
              </div>
            </Card>
          </div>

          <UserEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            user={editingUser}
            onSave={handleSaveUser}
          />

          <UserCreateDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={() => {
              void loadUsers();
              void loadStats();
            }}
          />
        </main>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent: "cyan" | "green" | "violet";
  subtitle: string;
}) {
  const colors = {
    cyan: "text-neon-cyan",
    green: "text-neon-green",
    violet: "text-neon-violet",
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
    >
      <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium tracking-wide text-muted-foreground">{label}</div>
            <div className={`mt-2 text-3xl font-semibold tracking-tight ${colors[accent]}`}>
              {value}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyber-glass-border bg-black/20">
            <Icon className={`h-6 w-6 ${colors[accent]}`} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function UserRow({ user, onEdit }: { user: User; onEdit: (user: User) => void }) {
  const expiraEm = user.plano_expira_em ? new Date(user.plano_expira_em) : null;
  const isExpired = expiraEm && expiraEm < new Date();
  const isExpiringSoon = expiraEm && expiraEm < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
    >
      <Card className="border-cyber-glass-border bg-black/20 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-semibold tracking-tight truncate">
                {user.nome || "Sem nome"}
              </div>
              <Badge
                className={cn(
                  "border-cyber-glass-border bg-black/30",
                  user.tipo_plano === "plus" ? "text-neon-violet" : "text-muted-foreground",
                )}
              >
                {user.tipo_plano === "plus" ? "Plus" : "Free"}
              </Badge>
              {user.plano_pausado && (
                <Badge className="border-cyber-glass-border bg-black/30 text-neon-red">
                  Pausado
                </Badge>
              )}
              {isExpired && (
                <Badge className="border-cyber-glass-border bg-black/30 text-neon-red">
                  Expirado
                </Badge>
              )}
              {isExpiringSoon && !isExpired && (
                <Badge className="border-cyber-glass-border bg-black/30 text-neon-red">
                  Expira em breve
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">{user.email || "—"}</div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Streak: {user.contagem_streak}</span>
              {expiraEm && (
                <span>
                  Expira: {expiraEm.toLocaleDateString("pt-BR")} {expiraEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <span>Criado: {new Date(user.criado_em).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <Button
            variant="secondary"
            className="border border-cyber-glass-border bg-black/20 text-foreground hover:bg-cyber-glass/40"
            onClick={() => onEdit(user)}
          >
            Gerenciar
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function UserEditDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSave: (updates: {
    tipo_plano?: "free" | "plus";
    plano_pausado?: boolean;
    adicionar_dias?: number;
  }) => void;
}) {
  const [tipoPlano, setTipoPlano] = React.useState<"free" | "plus">("free");
  const [pausado, setPausado] = React.useState(false);
  const [adicionarDias, setAdicionarDias] = React.useState("");

  React.useEffect(() => {
    if (user) {
      setTipoPlano(user.tipo_plano);
      setPausado(user.plano_pausado);
      setAdicionarDias("");
    }
  }, [user]);

  if (!user) return null;

  const handleSave = () => {
    onSave({
      tipo_plano: tipoPlano,
      plano_pausado: pausado,
      adicionar_dias: adicionarDias ? Number(adicionarDias) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-cyber-glass-border bg-cyber-glass/40 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Gerenciar Usuário
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <div className="text-sm font-medium mb-2">{user.nome || "Sem nome"}</div>
            <div className="text-xs text-muted-foreground">{user.email || "—"}</div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Plano</Label>
            <Select value={tipoPlano} onValueChange={(v) => setTipoPlano(v as "free" | "plus")}>
              <SelectTrigger className="border-cyber-glass-border bg-black/25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pausado"
              checked={pausado}
              onChange={(e) => setPausado(e.target.checked)}
              className="h-4 w-4 rounded border-cyber-glass-border bg-black/25"
            />
            <Label htmlFor="pausado" className="cursor-pointer">
              Plano Pausado
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Adicionar Dias ao Plano</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={adicionarDias}
                onChange={(e) => setAdicionarDias(e.target.value)}
                placeholder="Ex: 30"
                className="border-cyber-glass-border bg-black/25"
                min="1"
              />
              <Button
                variant="secondary"
                className="border border-cyber-glass-border bg-black/20"
                onClick={() => {
                  const dias = Number(adicionarDias);
                  if (dias > 0) {
                    onSave({ adicionar_dias: dias });
                    setAdicionarDias("");
                  }
                }}
                disabled={!adicionarDias || Number(adicionarDias) <= 0}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {user.plano_expira_em
                ? `Expira em: ${new Date(user.plano_expira_em).toLocaleDateString("pt-BR")}`
                : "Sem data de expiração"}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1 bg-neon-cyan text-black hover:bg-neon-cyan/90"
              onClick={handleSave}
            >
              Salvar Alterações
            </Button>
            <Button
              variant="secondary"
              className="border border-cyber-glass-border bg-black/20"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [nome, setNome] = React.useState("");
  const [tipoPlano, setTipoPlano] = React.useState<"free" | "plus">("free");
  const [planoExpiraEm, setPlanoExpiraEm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setNome("");
      setTipoPlano("free");
      setPlanoExpiraEm("");
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    setError(null);
    setLoading(true);

    if (!email || !password || !nome) {
      setError("Preencha todos os campos obrigatórios");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          nome,
          tipo_plano: tipoPlano,
          plano_expira_em: planoExpiraEm || null,
          plano_iniciado_em: new Date().toISOString(),
        }),
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean; error: string; message: string }>;

      if (!data.ok) {
        setError(data.message || data.error || "Erro ao criar usuário");
        setLoading(false);
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-cyber-glass-border bg-cyber-glass/40 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Criar Novo Usuário
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="text-xs text-muted-foreground">
            Usuários criados pelo admin não precisam verificar email.
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-email">Email *</Label>
            <Input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              className="border-cyber-glass-border bg-black/25"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-password">Senha *</Label>
            <Input
              id="create-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="border-cyber-glass-border bg-black/25"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-nome">Nome *</Label>
            <Input
              id="create-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              className="border-cyber-glass-border bg-black/25"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Plano *</Label>
            <Select
              value={tipoPlano}
              onValueChange={(v) => setTipoPlano(v as "free" | "plus")}
              disabled={loading}
            >
              <SelectTrigger className="border-cyber-glass-border bg-black/25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-expira">Data de Expiração (opcional)</Label>
            <Input
              id="create-expira"
              type="datetime-local"
              value={planoExpiraEm}
              onChange={(e) => setPlanoExpiraEm(e.target.value)}
              className="border-cyber-glass-border bg-black/25"
              disabled={loading}
            />
            <div className="text-xs text-muted-foreground">
              Deixe em branco para sem expiração
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-neon-red/30 bg-black/25 px-4 py-3 text-sm text-neon-red">
              {error}
            </div>
          ) : null}

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1 bg-neon-cyan text-black hover:bg-neon-cyan/90"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Usuário"}
            </Button>
            <Button
              variant="secondary"
              className="border border-cyber-glass-border bg-black/20"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FinancialCard({
  icon: Icon,
  label,
  value,
  accent,
  subtitle,
  format,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: "cyan" | "green" | "violet";
  subtitle: string;
  format?: "currency" | "number";
  trend?: number;
}) {
  const colors = {
    cyan: "text-neon-cyan",
    green: "text-neon-green",
    violet: "text-neon-violet",
  };

  const formattedValue =
    format === "currency"
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
      : value.toLocaleString("pt-BR");

  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
    >
      <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium tracking-wide text-muted-foreground">{label}</div>
            <div className={`mt-2 text-2xl font-semibold tracking-tight ${colors[accent]}`}>
              {formattedValue}
            </div>
            {trend !== undefined && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {trendUp ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-neon-green" />
                    <span className="text-neon-green">+{Math.abs(trend).toFixed(1)}%</span>
                  </>
                ) : trendDown ? (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-neon-red" />
                    <span className="text-neon-red">-{Math.abs(trend).toFixed(1)}%</span>
                  </>
                ) : null}
              </div>
            )}
            <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyber-glass-border bg-black/20">
            <Icon className={`h-6 w-6 ${colors[accent]}`} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function TransactionRow({
  transaction: t,
}: {
  transaction: {
    id: number;
    tipo: string;
    plano: string;
    valor: number;
    status: string;
    metodo_pagamento: string | null;
    criado_em: string;
    user_nome: string | null;
    user_email: string | null;
  };
}) {
  const tipoLabels: Record<string, string> = {
    assinatura: "Assinatura",
    renovacao: "Renovação",
    upgrade: "Upgrade",
    cancelamento: "Cancelamento",
    reembolso: "Reembolso",
  };

  const statusColors: Record<string, string> = {
    pago: "text-neon-green",
    pendente: "text-yellow-400",
    cancelado: "text-neon-red",
    reembolsado: "text-muted-foreground",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
    >
      <Card className="border-cyber-glass-border bg-black/20 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-semibold tracking-tight">
                {tipoLabels[t.tipo] || t.tipo}
              </div>
              <Badge
                className={cn(
                  "border-cyber-glass-border bg-black/30",
                  t.plano === "plus" ? "text-neon-violet" : "text-muted-foreground",
                )}
              >
                {t.plano === "plus" ? "Plus" : "Free"}
              </Badge>
              <Badge className={cn("border-cyber-glass-border bg-black/30", statusColors[t.status])}>
                {t.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {t.user_nome || t.user_email || "Usuário desconhecido"}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="text-neon-green font-semibold">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  t.valor,
                )}
              </span>
              {t.metodo_pagamento && <span>• {t.metodo_pagamento}</span>}
              <span>• {new Date(t.criado_em).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
