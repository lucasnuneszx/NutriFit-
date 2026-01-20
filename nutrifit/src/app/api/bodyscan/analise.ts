import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imagem_base64, model, system_prompt, max_tokens } = body;

    if (!imagem_base64) {
      return NextResponse.json(
        { erro: "Imagem é obrigatória" },
        { status: 400 }
      );
    }

    // TODO: Integre com sua IA de Visão (GPT-4 Vision, Claude Vision, etc.)
    // Exemplo com OpenAI:
    /*
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: system_prompt,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imagem_base64,
                },
              },
              {
                type: "text",
                text: "Analise esta imagem de acordo com as instruções.",
              },
            ],
          },
        ],
        max_tokens: max_tokens || 500,
        temperature: 0.3,
      }),
    });

    const data = await openaiResponse.json();
    const resposta_ia = data.choices[0]?.message?.content;

    // Parse da resposta JSON
    const resultado = JSON.parse(resposta_ia);

    return NextResponse.json({
      ok: true,
      resultado,
      raw_response: resposta_ia,
    });
    */

    // Resposta simulada para teste
    const mockResponse = {
      ok: true,
      resultado: {
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
          "Físico atlético bem estruturado. Continue com treino de força e mantenha um déficit calórico leve para definição.",
      },
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error("Erro em /api/bodyscan/analise:", error);
    return NextResponse.json(
      { erro: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
