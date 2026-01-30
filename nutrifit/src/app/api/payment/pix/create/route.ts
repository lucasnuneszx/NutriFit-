import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { createPerfectPayClient } from "@/lib/perfect-pay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cria um pagamento PIX via Perfect Pay
 * POST /api/payment/pix/create
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Validar Perfect Pay
    const perfectPay = createPerfectPayClient();
    if (!perfectPay) {
      return NextResponse.json(
        {
          ok: false,
          error: "perfect_pay_not_configured",
          message: "Perfect Pay não está configurado. Verifique as variáveis de ambiente.",
        },
        { status: 500 }
      );
    }

    // Ler body
    let body: { plan?: "plus"; amount?: number } = {};
    try {
      body = (await request.json()) as { plan?: "plus"; amount?: number };
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_body" },
        { status: 400 }
      );
    }

    const plan = body.plan === "plus" ? "plus" : "free";
    const amount = body.amount || 3999; // R$ 39,99 em centavos (padrão)

    // Buscar perfil do usuário
    const profileResult = await query<{ nome: string | null; email: string | null }>(
      `SELECT nome, email FROM profiles WHERE id = $1`,
      [user.id]
    );

    const profile = profileResult.rows[0];

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          error: "profile_not_found",
          message: "Perfil do usuário não encontrado.",
        },
        { status: 404 }
      );
    }

    // Criar pagamento PIX na Perfect Pay
    const pixResponse = await perfectPay.createPixPayment({
      amount: amount,
      description: `NutriFit+ - Assinatura ${plan === "plus" ? "NutriPlus" : "Free"}`,
      customer: {
        name: profile.nome || user.email || "Usuário",
        email: profile.email || user.email || "",
      },
      metadata: {
        user_id: user.id,
        plan: plan,
        app: "nutrifit",
      },
      expiresIn: 30, // 30 minutos
    });

    if (!pixResponse.success || !pixResponse.data) {
      return NextResponse.json(
        {
          ok: false,
          error: "perfect_pay_error",
          message: pixResponse.error?.message || "Erro ao criar pagamento PIX",
        },
        { status: 500 }
      );
    }

    // Salvar transação no banco
    let transactionId: string | null = null;
    try {
      const transactionResult = await query(
        `INSERT INTO transactions (user_id, tipo, plano, valor, status, metodo_pagamento, referencia_externa, notas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, criado_em`,
        [
          user.id,
          "assinatura",
          plan,
          amount / 100, // Converter centavos para reais
          "pendente",
          "pix",
          pixResponse.data.id, // ID da Perfect Pay
          `PIX - QR Code: ${pixResponse.data.id}`,
        ]
      );

      transactionId = transactionResult.rows[0]?.id || null;
    } catch (error) {
      console.error("[Payment API] Erro ao salvar transação:", error);
      // Continuar mesmo assim, o pagamento foi criado na Perfect Pay
    }

    return NextResponse.json({
      ok: true,
      payment: {
        id: pixResponse.data.id,
        qr_code: pixResponse.data.qr_code,
        qr_code_url: pixResponse.data.qr_code_url,
        copy_paste: pixResponse.data.copy_paste,
        expires_at: pixResponse.data.expires_at,
        amount: pixResponse.data.amount,
      },
      transaction_id: transactionId,
    });
  } catch (error) {
    console.error("[Payment API] Erro:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        message: "Erro ao processar pagamento",
      },
      { status: 500 }
    );
  }
}
