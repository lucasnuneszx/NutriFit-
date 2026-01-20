"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export type MealPhoto = {
  id: string;
  url: string;
  data: string;
  calorias?: number;
  descricao?: string;
};

interface MealGalleryProps {
  meals: MealPhoto[];
  onAddPhoto: () => void;
  onDeletePhoto: (id: string) => void;
  isUploading?: boolean;
}

export function MealGallery({
  meals,
  onAddPhoto,
  onDeletePhoto,
  isUploading = false,
}: MealGalleryProps) {
  return (
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
        <Button
          onClick={onAddPhoto}
          disabled={isUploading}
          size="sm"
          className="bg-neon-cyan text-black hover:bg-neon-cyan/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <Separator className="bg-white/10 mb-6" />

      {meals.length > 0 ? (
        <ScrollArea className="h-[300px]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pr-4">
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
                  className="w-full h-32 object-cover"
                  unoptimized={meal.url.startsWith("data:")}
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex flex-col justify-end p-2">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-semibold text-white truncate">
                      {meal.descricao}
                    </p>
                    <p className="text-xs text-white/70">{meal.data}</p>
                    {meal.calorias && (
                      <p className="text-xs text-neon-cyan mt-1">
                        {meal.calorias} kcal
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeletePhoto(meal.id)}
                  className="absolute top-1 right-1 p-1.5 rounded bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex items-center justify-center h-[300px] rounded-lg border-2 border-dashed border-cyber-glass-border">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Nenhuma refeição registrada
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
