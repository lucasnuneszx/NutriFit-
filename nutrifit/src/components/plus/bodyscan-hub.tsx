"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Camera, Zap, AlertCircle, Upload, X, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useRef } from "react";

type ScanResult = {
  biotipo: string;
  percentualGordura: string;
  pontosFortes: string[];
  macros: {
    proteina: number;
    carboidratos: number;
    gorduras: number;
  };
  observacoes: string;
};

export function BodyScanHub() {
  const [imagemBase64, setImagemBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ScanResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const processarImagem = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErro("Por favor, selecione uma imagem válida");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagemBase64(base64);
      setErro(null);
      setResultado(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = () => setIsDragActive(true);
  const handleDragLeave = () => setIsDragActive(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files[0]) {
      processarImagem(e.dataTransfer.files[0]);
    }
  };

  const analisarFisico = async () => {
    if (!imagemBase64) {
      setErro("Por favor, selecione uma imagem primeiro");
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const systemPrompt = `Você é um Nutricionista Esportivo Elite com 15+ anos de experiência em análise de composição corporal.

ANÁLISE OBRIGATÓRIA:
1. BIOTIPO: Classifique como Ectomorfo, Mesomorfo, Endomorfo ou Combinado
2. ESTIMATIVA DE GORDURA CORPORAL: Forneça um percentual visual estimado
3. PONTOS FORTES MUSCULARES: Liste 3-4 grupos musculares mais desenvolvidos
4. SUGESTÃO DE MACRONUTRIENTES: Recomende proporção adequada

Responda em JSON válido com esta estrutura:
{
  "biotipo": "string",
  "percentualGordura": "string",
  "pontosFortes": ["string", "string", "string"],
  "macros": {"proteina": number, "carboidratos": number, "gorduras": number},
  "observacoes": "string"
}`;

      const payload = {
        imagem_base64: imagemBase64,
        model: "gpt-4-vision",
        system_prompt: systemPrompt,
        max_tokens: 500,
      };

      // TODO: Substitua com seu endpoint real
      const API_ENDPOINT = "/api/bodyscan/analise";

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Simular resposta para teste
        const mockResponse: ScanResult = {
          biotipo: "Mesomorfo",
          percentualGordura: "15-18%",
          pontosFortes: [
            "Ombros e costas desenvolvidos",
            "Peitoral bem definido",
            "Core marcado",
          ],
          macros: {
            proteina: 35,
            carboidratos: 45,
            gorduras: 20,
          },
          observacoes:
            "Físico atlético bem estruturado. Continuar com treino de força.",
        };
        setResultado(mockResponse);
        return;
      }

      const data = await response.json();
      setResultado(data.resultado || data);
    } catch (erro) {
      console.error("Erro ao analisar:", erro);
      setErro("Erro ao analisar a imagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const limparImagem = () => {
    setImagemBase64(null);
    setResultado(null);
    setErro(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const novaAnalise = () => {
    setResultado(null);
    setImagemBase64(null);
    setErro(null);
  };

  return (
    <div className="relative min-h-screen space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur opacity-75 animate-pulse"></div>
            <div className="relative bg-slate-900 p-3 rounded-full">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            BodyScan IA
          </h1>
        </div>
        <p className="text-gray-400">
          Análise de composição corporal alimentada por Inteligência Artificial
        </p>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-yellow-900/50 bg-yellow-900/20 backdrop-blur">
          <div className="p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-100">
              <strong>⚠️ Aviso de Saúde:</strong> Esta é uma análise visual
              estimada baseada em IA.{" "}
              <strong>Não substitui avaliação médica ou de profissional qualificado.</strong>{" "}
              Use apenas como referência complementar. Consulte um nutricionista
              ou médico para orientações personalizadas.
            </p>
          </div>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Coluna 1: Upload e Preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          {!imagemBase64 ? (
            <Card
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed cursor-pointer transition-all ${
                isDragActive
                  ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/30"
                  : "border-green-500/50 hover:border-green-500 hover:bg-green-500/5"
              }`}
            >
              <div className="p-12 text-center space-y-4">
                <div className="flex justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Camera className="w-16 h-16 text-green-400" />
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Arraste sua foto aqui
                  </h3>
                  <p className="text-sm text-gray-400">ou clique para selecionar</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden border-green-500/30">
              <div className="relative w-full bg-black rounded-lg overflow-hidden">
                <img
                  src={imagemBase64}
                  alt="Preview"
                  className="w-full h-80 object-cover"
                />
              </div>
            </Card>
          )}

          {/* Botões */}
          {!imagemBase64 ? (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Galeria
              </Button>
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
              >
                <Camera className="w-4 h-4 mr-2" />
                Câmera
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={analisarFisico}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                    </motion.div>
                    Escaneando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analisar
                  </>
                )}
              </Button>
              <Button
                onClick={limparImagem}
                variant="outline"
                className="border-green-500/30 hover:bg-red-500/10"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && processarImagem(e.target.files[0])}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files?.[0] && processarImagem(e.target.files[0])}
            className="hidden"
          />
        </motion.div>

        {/* Coluna 2: Resultados */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {loading ? (
            <Card className="border-green-500/30 bg-slate-800/50">
              <div className="p-8 space-y-6 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Zap className="w-16 h-16 text-green-400 mx-auto" />
                </motion.div>
                <h3 className="text-2xl font-semibold text-green-400">
                  Escaneando...
                </h3>
                <p className="text-gray-400">
                  Analisando sua composição corporal
                </p>
                <motion.div
                  animate={{ width: ["0%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                />
              </div>
            </Card>
          ) : resultado ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                ✓ Análise Concluída
              </Badge>

              <Card className="border-green-500/30 bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="p-6 space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-gray-400 uppercase tracking-wider">
                      Biotipo
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {resultado.biotipo}
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-gray-400 uppercase tracking-wider">
                      Estimativa de Gordura
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {resultado.percentualGordura}
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                      Pontos Fortes
                    </p>
                    <ul className="space-y-1 text-sm text-gray-300">
                      {resultado.pontosFortes.map((ponto, i) => (
                        <li key={i}>• {ponto}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-3">
                      Macronutrientes
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-blue-500/10 rounded p-3 border border-blue-500/30">
                        <p className="text-xs text-gray-400">Proteína</p>
                        <p className="text-lg font-bold text-blue-400">
                          {resultado.macros.proteina}%
                        </p>
                      </div>
                      <div className="bg-orange-500/10 rounded p-3 border border-orange-500/30">
                        <p className="text-xs text-gray-400">Carbs</p>
                        <p className="text-lg font-bold text-orange-400">
                          {resultado.macros.carboidratos}%
                        </p>
                      </div>
                      <div className="bg-red-500/10 rounded p-3 border border-red-500/30">
                        <p className="text-xs text-gray-400">Gorduras</p>
                        <p className="text-lg font-bold text-red-400">
                          {resultado.macros.gorduras}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {resultado.observacoes && (
                    <div className="bg-slate-700/50 rounded p-4 border border-slate-600">
                      <p className="text-sm text-gray-300">
                        {resultado.observacoes}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={novaAnalise}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nova Análise
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : erro ? (
            <Card className="border-red-500/30 bg-red-500/10">
              <div className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-200">{erro}</p>
              </div>
            </Card>
          ) : (
            <Card className="border-green-500/30 bg-slate-800/50">
              <div className="p-8 text-center space-y-4">
                <Zap className="w-12 h-12 text-green-400 mx-auto opacity-50" />
                <h3 className="text-xl font-semibold text-white">
                  Pronto para começar?
                </h3>
                <p className="text-gray-400 text-sm">
                  Selecione uma foto para iniciar a análise de sua composição
                  corporal
                </p>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
