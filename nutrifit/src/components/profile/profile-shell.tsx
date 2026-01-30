"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { User, Mail, Settings, LogOut, Camera, Upload, Trash2, Edit2, Save, X, CreditCard, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CyberBackground } from "@/components/landing/cyber-background";

type Profile = {
  id: string;
  nome: string;
  email: string;
  tipo_plano: "free" | "plus" | null;
  nome_assistente: string;
  foto_url: string | null;
  bio?: string;
  peso?: number;
  altura?: number;
  objetivo?: string;
  criado_em?: string;
};

type MealPhoto = {
  id: string;
  url: string;
  data: string;
  calorias?: number;
  descricao?: string;
};

export function ProfileShell() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [meals, setMeals] = React.useState<MealPhoto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [editForm, setEditForm] = React.useState<Partial<Profile>>({});
  const [hasChanges, setHasChanges] = React.useState(false);
  const [originalProfile, setOriginalProfile] = React.useState<Profile | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    loadProfile();
    loadMealPhotos();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/profile/me");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to load profile: ${res.status} - ${JSON.stringify(errorData)}`);
      }
      const apiResponse = (await res.json()) as {
        ok?: boolean;
        profile?: {
          id: string;
          nome: string;
          email: string;
          tipo_plano: "free" | "plus" | null;
          nome_assistente?: string;
          foto_url?: string;
          bio?: string;
          peso?: number;
          altura?: number;
          objetivo?: string;
        } | null;
      };

      if (!apiResponse.profile) {
        throw new Error("No profile data returned");
      }

      const data = apiResponse.profile;
      const fullProfile: Profile = {
        id: data.id,
        nome: data.nome || "Usuário",
        email: data.email || "",
        tipo_plano: data.tipo_plano || "free",
        nome_assistente: data.nome_assistente || "Athena",
        foto_url: data.foto_url || null,
        bio: data.bio || "Começando minha jornada fitness! 💪",
        peso: data.peso || 75,
        altura: data.altura || 180,
        objetivo: data.objetivo || "Ganho de massa",
      };
      setProfile(fullProfile);
      setOriginalProfile(fullProfile);
      setEditForm(fullProfile);
      setHasChanges(false);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMealPhotos = async () => {
    try {
      const res = await fetch("/api/profile/meals");
      if (!res.ok) return;
      
      const data = (await res.json()) as { ok: boolean; meals: Array<{ id: number; imagem_url: string; criado_em: string; descricao?: string }> };
      
      if (data.ok && data.meals && Array.isArray(data.meals)) {
        const formattedMeals: MealPhoto[] = data.meals.map((meal) => ({
          id: meal.id.toString(),
          url: meal.imagem_url,
          data: new Date(meal.criado_em).toLocaleDateString("pt-BR"),
          descricao: meal.descricao || "Refeição",
        }));
        setMeals(formattedMeals);
      }
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
    }
  };

  const handleProfilePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Upload failed: ${res.status} - ${JSON.stringify(errorData)}`);
      }
      const data = (await res.json()) as { photoUrl: string };
      
      // Atualizar edit form e marcar como mudança
      handleEditChange({ foto_url: data.photoUrl });
      // Também atualizar profile para sincronizar com sidebar
      setProfile((p) => (p ? { ...p, foto_url: data.photoUrl } : null));
      
      setIsEditing(true); // Abrir modo de edição automaticamente
      alert("Foto alterada! Clique em 'Salvar Alterações' para confirmar.");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert(`Erro no upload: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMealPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("descricao", "Nova refeição");

      const res = await fetch("/api/profile/meals", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Upload failed: ${res.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = (await res.json()) as { ok: boolean; meal: { id: number; imagem_url: string; criado_em: string; descricao?: string } };
      
      if (data.ok && data.meal) {
        const newMeal: MealPhoto = {
          id: data.meal.id.toString(),
          url: data.meal.imagem_url,
          data: new Date(data.meal.criado_em).toLocaleDateString("pt-BR"),
          descricao: data.meal.descricao || "Nova refeição",
        };
        setMeals((m) => [newMeal, ...m]);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert(`Erro no upload: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleEditChange = (updates: Partial<Profile>) => {
    const newForm = { ...editForm, ...updates };
    setEditForm(newForm);
    
    // Detectar mudanças comparando com o perfil original
    const hasAnyChange = JSON.stringify(newForm) !== JSON.stringify(originalProfile);
    setHasChanges(hasAnyChange);
  };

  const handleSaveProfile = async () => {
    if (!hasChanges) return;
    
    try {
      setIsSaving(true);
      
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nome: editForm.nome,
          bio: editForm.bio,
          peso: editForm.peso,
          altura: editForm.altura,
          objetivo: editForm.objetivo,
          foto_url: editForm.foto_url,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Falha ao salvar: ${JSON.stringify(errorData)}`);
      }

      const data = (await res.json()) as { ok: boolean; profile: Profile };
      const updatedProfile = data.profile || (editForm as Profile);
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setEditForm(updatedProfile);
      setHasChanges(false);
      setIsEditing(false);
      
      // Notificar sidebar para recarregar o perfil (especialmente a foto)
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
      
      alert("Perfil salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert(`Erro ao salvar: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMeal = (id: string) => {
    setMeals((m) => m.filter((meal) => meal.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-neon-cyan mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <p className="text-foreground mb-4">⚠️ Erro ao carregar perfil</p>
          <p className="text-muted-foreground text-sm mb-4">
            Verifique seu console para mais detalhes
          </p>
          <Button onClick={() => loadProfile()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <CyberBackground />
      <div className="relative z-10 pt-14 lg:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Meu Perfil
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerenciador de informações e histórico de refeições
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Sidebar Perfil */}
            <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl h-fit">
              <div className="relative">
                {/* Foto de Perfil */}
                <div className="relative mx-auto w-32 h-32 mb-4">
                  {profile.foto_url ? (
                    <Image
                      src={profile.foto_url}
                      alt={profile.nome}
                      fill
                      className="rounded-full object-cover border-4 border-neon-cyan/30"
                      unoptimized={profile.foto_url.startsWith("data:")}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-black/50 border-4 border-neon-cyan/30 flex items-center justify-center">
                      <User className="h-12 w-12 text-neon-cyan/50" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-neon-cyan text-black hover:bg-neon-cyan/90 disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePhotoChange}
                />

                {/* Informações */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-foreground">
                    {profile.nome}
                  </h2>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>

                <Separator className="bg-white/10 mb-6" />

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Plano</p>
                    <Badge className="w-full justify-center border-neon-cyan/50 bg-black/30 text-neon-cyan">
                      {profile.tipo_plano === "plus" ? "NutriPlus" : "Free"}
                    </Badge>
                  </div>

                  {profile.tipo_plano === "plus" && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Forma de Pagamento
                        </p>
                        <p className="font-semibold text-foreground text-sm">
                          Cartão de Crédito
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Vencimento
                        </p>
                        <p className="font-semibold text-foreground text-sm">
                          15/02/2026
                        </p>
                      </div>
                    </>
                  )}

                  {profile.peso && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Peso
                      </p>
                      <p className="font-semibold text-foreground">
                        {profile.peso} kg
                      </p>
                    </div>
                  )}

                  {profile.altura && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Altura
                      </p>
                      <p className="font-semibold text-foreground">
                        {profile.altura} cm
                      </p>
                    </div>
                  )}

                  {profile.objetivo && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Objetivo
                      </p>
                      <p className="font-semibold text-foreground">
                        {profile.objetivo}
                      </p>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/90"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>

                    <Separator className="bg-white/10 my-4" />

                    {profile.tipo_plano === "plus" && (
                      <>
                        <Button
                          asChild
                          variant="secondary"
                          className="w-full border border-cyber-glass-border justify-start"
                        >
                          <Link href="/perfil/pagamentos">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Métodos de Pagamento
                          </Link>
                        </Button>

                        <Button
                          asChild
                          variant="secondary"
                          className="w-full border border-cyber-glass-border justify-start mt-2"
                        >
                          <Link href="/perfil/faturas">
                            <FileText className="h-4 w-4 mr-2" />
                            Histórico de Faturas
                          </Link>
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* Conteúdo Principal */}
            <div className="space-y-6">
              {/* Edição de Perfil */}
              {isEditing && (
                <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Editar Informações
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Nome</Label>
                      <Input
                        value={editForm.nome || ""}
                        onChange={(e) =>
                          handleEditChange({ nome: e.target.value })
                        }
                        className="mt-2 border-cyber-glass-border bg-black/25"
                      />
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Bio</Label>
                      <Textarea
                        value={editForm.bio || ""}
                        onChange={(e) =>
                          handleEditChange({ bio: e.target.value })
                        }
                        className="mt-2 border-cyber-glass-border bg-black/25 min-h-[80px]"
                        placeholder="Conte um pouco sobre você..."
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Peso (kg)</Label>
                        <Input
                          type="number"
                          value={editForm.peso || ""}
                          onChange={(e) =>
                            handleEditChange({
                              peso: parseFloat(e.target.value),
                            })
                          }
                          className="mt-2 border-cyber-glass-border bg-black/25"
                        />
                      </div>

                      <div>
                        <Label className="text-muted-foreground">
                          Altura (cm)
                        </Label>
                        <Input
                          type="number"
                          value={editForm.altura || ""}
                          onChange={(e) =>
                            handleEditChange({
                              altura: parseFloat(e.target.value),
                            })
                          }
                          className="mt-2 border-cyber-glass-border bg-black/25"
                        />
                      </div>

                      <div>
                        <Label className="text-muted-foreground">Objetivo</Label>
                        <Input
                          value={editForm.objetivo || ""}
                          onChange={(e) =>
                            handleEditChange({
                              objetivo: e.target.value,
                            })
                          }
                          className="mt-2 border-cyber-glass-border bg-black/25"
                          placeholder="Ex: Ganho de massa"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving || !hasChanges}
                        className="flex-1 bg-neon-cyan text-black hover:bg-neon-cyan/90 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm(originalProfile || profile);
                          setHasChanges(false);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Galeria de Fotos de Refeições */}
              <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Histórico de Refeições
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {meals.length} refeições registradas
                    </p>
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="p-2 rounded-lg bg-neon-cyan text-black hover:bg-neon-cyan/90 disabled:opacity-50"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMealPhotoChange}
                />

                {meals.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-4">
                      {meals.map((meal) => (
                        <motion.div
                          key={meal.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative rounded-xl overflow-hidden border border-cyber-glass-border"
                        >
                          <Image
                            src={meal.url}
                            alt={meal.descricao || "Refeição"}
                            width={300}
                            height={300}
                            className="w-full h-48 object-cover"
                            unoptimized={meal.url.startsWith("data:")}
                          />

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex flex-col justify-end p-3">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-sm font-semibold text-white">
                                {meal.descricao}
                              </p>
                              <p className="text-xs text-white/70">
                                {meal.data}
                              </p>
                              {meal.calorias && (
                                <p className="text-xs text-neon-cyan mt-1">
                                  {meal.calorias} kcal
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => deleteMeal(meal.id)}
                            className="absolute top-2 right-2 p-2 rounded bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-[400px] rounded-lg border-2 border-dashed border-cyber-glass-border">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        Nenhuma refeição registrada ainda
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Clique no botão acima para adicionar uma foto
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Seção de Pagamentos e Faturas */}
              {/* {profile.tipo_plano === "plus" && (
                <Card className="relative overflow-hidden border-cyber-glass-border bg-cyber-glass/25 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="h-6 w-6 text-neon-cyan" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Pagamentos e Faturas
                    </h3>
                  </div>
                  <BillingSection />
                </Card>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
