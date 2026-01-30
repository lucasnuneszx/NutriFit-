"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  LogOut,
  Menu,
  X,
  User,
  Settings,
  BarChart3,
  Camera,
  Diamond,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Footer } from "@/components/app/footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/dieta", label: "Dieta & Compras", icon: UtensilsCrossed },
  { href: "/bodyscan", label: "BodyScan IA", icon: Zap },
  { href: "/dashboard?tab=historico", label: "Histórico", icon: BarChart3 },
  { href: "/perfil", label: "Perfil", icon: User },
];

type ProfileData = {
  nome: string | null;
  foto_url: string | null;
  tipo_plano: "free" | "plus" | null;
};

function ProfileHeader({ isMobile = false }: { isMobile?: boolean }) {
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [cropDialogOpen, setCropDialogOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [cropScale, setCropScale] = React.useState(1);
  const [cropX, setCropX] = React.useState(0);
  const [cropY, setCropY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [imageKey, setImageKey] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile/me", { 
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        }
      });
      if (res.status === 401) {
        setIsLoading(false);
        return;
      }
      const json = (await res.json()) as unknown;
      const data = json as Partial<{ ok: boolean; profile: ProfileData | null }>;
      
      if (data?.ok) {
        if (data.profile) {
          const profileData = data.profile;
          // Se tem perfil, usa os dados reais (mesmo que alguns campos sejam null)
          const tipoPlano = profileData.tipo_plano?.toLowerCase()?.trim();
          const nomeReal = profileData.nome?.trim();
          
          setProfile({
            nome: nomeReal || "Atleta",
            foto_url: profileData.foto_url ?? null,
            tipo_plano: tipoPlano === "plus" ? "plus" : "free",
          });
        } else {
          // Se não tem perfil ainda, usa valores padrão
          setProfile({
            nome: "Atleta",
            foto_url: null,
            tipo_plano: "free",
          });
        }
      }
    } catch (error) {
      console.error("[ProfileHeader] Erro ao carregar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Carrega imediatamente
    void loadProfile();
    
    // Recarrega o perfil quando a janela ganha foco (útil após mudanças no admin)
    const handleFocus = () => {
      void loadProfile();
    };
    window.addEventListener("focus", handleFocus);
    
    // Recarrega quando a página fica visível novamente
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadProfile();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Listener para quando o perfil é atualizado na página de perfil
    const handleProfileUpdated = (event: CustomEvent<{ foto_url?: string }>) => {
      const updatedProfile = event.detail;
      if (updatedProfile?.foto_url) {
        setImageKey((prev) => prev + 1); // Force reload da imagem
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            foto_url: updatedProfile.foto_url ?? null,
            nome: updatedProfile.nome || prev.nome,
          };
        });
      }
    };
    window.addEventListener('profileUpdated', handleProfileUpdated as EventListener);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener('profileUpdated', handleProfileUpdated as EventListener);
    };
  }, [loadProfile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setSelectedImage(result);
        setCropDialogOpen(true);
        setCropScale(1);
        setCropX(0);
        setCropY(0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!selectedImage || !canvasRef.current || !imageRef.current) return;

    setIsUploading(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsUploading(false);
        return;
      }

      const size = 400; // Tamanho final do avatar
      canvas.width = size;
      canvas.height = size;

      // Carrega a imagem
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (err) => {
          console.error("Erro ao carregar imagem:", err);
          reject(err);
        };
        img.src = selectedImage;
      });

      // Calcula o crop baseado na imagem original
      // O container de preview tem 400px, mas a imagem pode ter qualquer tamanho
      const containerSize = 400;
      
      // Calcula a escala da imagem no container
      const imgDisplayWidth = containerSize;
      const imgDisplayHeight = (img.height / img.width) * containerSize;
      const scaleX = img.width / imgDisplayWidth;
      const scaleY = img.height / imgDisplayHeight;
      
      // Ajusta cropX e cropY para a escala da imagem real
      const adjustedX = cropX * scaleX;
      const adjustedY = cropY * scaleY;
      
      // Calcula o tamanho do crop na imagem original
      // O crop circle ocupa 80% do container (320px)
      const cropCircleDisplaySize = containerSize * 0.8;
      const cropSize = cropCircleDisplaySize * cropScale * scaleX;
      
      // Calcula a posição do crop no centro da imagem, ajustada pelo drag
      const centerX = img.width / 2;
      const centerY = img.height / 2;
      const sourceX = Math.max(0, Math.min(img.width - cropSize, centerX - cropSize / 2 + adjustedX));
      const sourceY = Math.max(0, Math.min(img.height - cropSize, centerY - cropSize / 2 + adjustedY));

      // Desenha a imagem recortada em formato circular
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        cropSize,
        cropSize,
        0,
        0,
        size,
        size
      );
      ctx.restore();

      // Converte para blob e faz upload
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append("photo", blob, "profile.jpg");

        try {
          const res = await fetch("/api/profile/photo", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const json = (await res.json()) as unknown;
            const data = json as Partial<{ ok: boolean; foto_url: string }>;
            if (data?.ok && data.foto_url) {
              // Atualiza o estado imediatamente com a nova URL e força reload da imagem
              setImageKey((prev) => prev + 1);
              setProfile((prev) => {
                if (!prev) return prev;
                return { ...prev, foto_url: data.foto_url! };
              });
              
              // Recarrega o perfil completo após upload para garantir sincronização
              const profileRes = await fetch("/api/profile/me", {
                cache: "no-store",
                headers: {
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  "Pragma": "no-cache",
                },
              });
              if (profileRes.ok) {
                const profileJson = (await profileRes.json()) as unknown;
                const profileData = profileJson as Partial<{ ok: boolean; profile: ProfileData | null }>;
                if (profileData?.ok && profileData.profile) {
                  const p = profileData.profile;
                  const tipoPlano = p.tipo_plano?.toLowerCase()?.trim();
                  setProfile({
                    nome: p.nome?.trim() || "Atleta",
                    foto_url: p.foto_url ?? null,
                    tipo_plano: tipoPlano === "plus" ? "plus" : "free",
                  });
                }
              }
            }
          } else {
            console.error("Erro ao fazer upload da foto:", await res.text());
          }
        } catch (error) {
          console.error("Erro ao fazer upload:", error);
        }

        setCropDialogOpen(false);
        setSelectedImage(null);
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, "image/jpeg", 0.9);
    } catch (error) {
      console.error("Erro ao processar foto:", error);
      setIsUploading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropX, y: e.clientY - cropY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setCropX(newX);
    setCropY(newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setCropScale((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // Mostra skeleton enquanto carrega para evitar flash de dados incorretos
  if (isLoading || !profile) {
    if (isMobile) {
      return (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full border-2 border-cyber-glass-border bg-black/30 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-3 w-20 bg-black/30 rounded animate-pulse" />
          </div>
        </div>
      );
    }
    return (
      <div className="border-b border-cyber-glass-border px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full border-2 border-cyber-glass-border bg-black/30 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-24 bg-black/30 rounded animate-pulse mb-2" />
            <div className="h-3 w-16 bg-black/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const isPremium = profile.tipo_plano === "plus";
  const initials = profile.nome
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AT";

  if (isMobile) {
    return (
      <div className="flex items-center gap-4 flex-1 min-w-0 py-3">
        <div className="relative">
          <Avatar className="h-14 w-14 border-2 border-cyber-glass-border">
            <AvatarImage 
              src={profile.foto_url || ""} 
              alt={profile.nome || "Perfil"}
            />
            <AvatarFallback className="bg-cyber-glass/30 text-neon-cyan font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-black bg-neon-cyan text-black hover:bg-neon-cyan/90 transition-colors disabled:opacity-50"
            title="Alterar foto"
          >
            <Camera className="h-3 w-3" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold tracking-tight truncate">
              {profile.nome}
            </h3>
            {isPremium ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-green border border-cyber-glass-border shadow-lg shadow-neon-cyan/20">
                <Diamond className="h-3 w-3 text-white" fill="currentColor" />
                <span className="text-[10px] font-bold tracking-wider text-white uppercase">
                  Nutri+
                </span>
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-black/30 border border-cyber-glass-border text-[10px] font-medium text-muted-foreground uppercase">
                free
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-cyber-glass-border px-6 py-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16 border-2 border-cyber-glass-border">
            <AvatarImage 
              src={profile.foto_url || ""} 
              alt={profile.nome || "Perfil"}
            />
            <AvatarFallback className="bg-cyber-glass/30 text-neon-cyan font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-black bg-neon-cyan text-black hover:bg-neon-cyan/90 transition-colors disabled:opacity-50"
            title="Alterar foto"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Canvas oculto para processar o crop */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Dialog de Crop */}
        <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
          <DialogContent className="max-w-md bg-cyber-glass/95 border-cyber-glass-border">
            <DialogHeader>
              <DialogTitle className="text-neon-cyan">Recortar Foto de Perfil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div
                ref={containerRef}
                className="relative w-full aspect-square bg-black/50 rounded-lg overflow-hidden border-2 border-cyber-glass-border"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{ cursor: isDragging ? "grabbing" : "grab" }}
              >
                {selectedImage && (
                  <>
                    <img
                      ref={imageRef}
                      src={selectedImage}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        transform: `scale(${cropScale}) translate(${cropX / cropScale}px, ${cropY / cropScale}px)`,
                        transformOrigin: "center center",
                      }}
                      draggable={false}
                    />
                    {/* Overlay circular para mostrar área de crop */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-black/50" />
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-neon-cyan shadow-lg shadow-neon-cyan/50"
                        style={{
                          width: "80%",
                          height: "80%",
                          maxWidth: "300px",
                          maxHeight: "300px",
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Arraste para mover • Scroll para zoom
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setCropDialogOpen(false);
                  setSelectedImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCropConfirm}
                disabled={isUploading || !selectedImage}
                className="bg-neon-cyan text-black hover:bg-neon-cyan/90"
              >
                {isUploading ? "Enviando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold tracking-tight truncate">
              {profile.nome}
            </h3>
            {isPremium ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-green border border-cyber-glass-border shadow-lg shadow-neon-cyan/30">
                <Diamond className="h-3 w-3 text-white" fill="currentColor" />
                <span className="text-[10px] font-bold tracking-wider text-white uppercase">
                  Nutri+
                </span>
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-black/30 border border-cyber-glass-border text-[10px] font-medium text-muted-foreground uppercase">
                free
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isPremium ? "Plano Premium" : "Plano Gratuito"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      
      // Limpa a sessão do Supabase (remove cookies e tokens)
      const { error } = await supabase.auth.signOut({ scope: "global" });
      
      if (error) {
        console.error("Erro ao fazer logout:", error);
      }
      
      // Limpa qualquer storage local relacionado ao perfil
      try {
        localStorage.removeItem("local_profile");
        sessionStorage.clear();
      } catch {
        // Ignora erros de storage
      }
      
      // Aguarda um pouco para garantir que o signOut foi processado
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Redireciona para a página inicial com reload completo
      window.location.href = "/";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, força redirecionamento
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
        <div className="flex flex-col flex-grow border-r border-cyber-glass-border bg-cyber-glass/10 backdrop-blur-xl">
          <ProfileHeader />

          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-12",
                      isActive
                        ? "bg-cyber-glass/30 text-neon-cyan border border-cyber-glass-border"
                        : "text-muted-foreground hover:bg-cyber-glass/20 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-cyber-glass-border space-y-2">
            <Link href="/dashboard?tab=perfil">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-muted-foreground hover:bg-cyber-glass/20 hover:text-foreground"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Perfil</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-muted-foreground hover:bg-cyber-glass/20 hover:text-foreground"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">{isLoggingOut ? "Saindo..." : "Sair"}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-cyber-glass-border bg-cyber-glass/25 backdrop-blur-xl">
        <div className="flex items-center justify-between px-3 py-4 gap-3 min-h-[70px]">
          <ProfileHeader isMobile />
          <Button
            variant="ghost"
            className="h-10 w-10 p-0 shrink-0"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-cyber-glass-border bg-cyber-glass/40 backdrop-blur-xl lg:hidden"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-cyber-glass-border gap-3">
                <div className="flex-1 min-w-0">
                  <ProfileHeader isMobile />
                </div>
                <Button
                  variant="ghost"
                  className="h-9 w-9 p-0 shrink-0"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-12",
                          isActive
                            ? "bg-cyber-glass/30 text-neon-cyan border border-cyber-glass-border"
                            : "text-muted-foreground hover:bg-cyber-glass/20 hover:text-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>

              <div className="px-4 py-4 border-t border-cyber-glass-border space-y-2">
                <Link href="/dashboard?tab=perfil" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-muted-foreground hover:bg-cyber-glass/20 hover:text-foreground"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">Perfil</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-muted-foreground hover:bg-cyber-glass/20 hover:text-foreground"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">{isLoggingOut ? "Saindo..." : "Sair"}</span>
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 w-full overflow-x-hidden flex flex-col bg-black">
        <div className="flex-1 min-h-screen pt-20 lg:pt-0 px-4 sm:px-6 lg:px-8 bg-black">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
