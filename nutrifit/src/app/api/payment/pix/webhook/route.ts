import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook da Sync Pay para receber confirmações de pagamento
 * POST /api/payment/pix/webhook
 */
export async function POST(request: Request) {
  try {
    // Ler body do webhook
    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_body" },
        { status: 400 }
      );
    }

    const webhookData = body as {
      event?: string;
      data?: {
        id: string;
        status: string;
        paid_at?: string;
        amount: number;
        metadata?: {
          user_id?: string;
          plan?: string;
        };
      };
    };

    console.log("[Webhook] Recebido:", JSON.stringify(webhookData, null, 2));

    // Validar evento
    if (webhookData.event !== "payment.paid" && webhookData.data?.status !== "paid") {
      return NextResponse.json({ ok: true, message: "Evento ignorado" });
    }

    const paymentId = webhookData.data?.id;
    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: "missing_payment_id" },
        { status: 400 }
      );
    }

    // Buscar transação pelo ID externo (Sync Pay)
    const transactionResult = await query<{ id: number; user_id: string; plano: string; status: string }>(
      `SELECT id, user_id, plano, status
       FROM transactions
       WHERE referencia_externa = $1`,
      [paymentId]
    );

    const transaction = transactionResult.rows[0];

    if (!transaction) {
      console.error("[Webhook] Transação não encontrada:", paymentId);
      return NextResponse.json(
        { ok: false, error: "transaction_not_found" },
        { status: 404 }
      );
    }

    // Se já foi pago, não fazer nada
    if (transaction.status === "pago") {
      return NextResponse.json({ ok: true, message: "Já processado" });
    }

    // Atualizar transação para "pago"
    await query(
      `UPDATE transactions
       SET status = $1,
           notas = $2,
           atualizado_em = NOW()
       WHERE id = $3`,
      [
        "pago",
        `PIX Pago em ${webhookData.data?.paid_at || new Date().toISOString()}`,
        transaction.id,
      ]
    );

    // Atualizar plano do usuário para "plus"
    if (transaction.plano === "plus") {
      await query(
        `UPDATE profiles
         SET tipo_plano = $1,
             plano_pausado = false,
             plano_iniciado_em = NOW(),
             plano_expira_em = NOW() + INTERVAL '30 days'
         WHERE id = $2`,
        ["plus", transaction.user_id]
      );
    }

    console.log("[Webhook] Pagamento processado com sucesso:", paymentId);

    return NextResponse.json({ ok: true, message: "Pagamento processado" });
  } catch (error) {
    console.error("[Webhook] Erro:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        message: "Erro ao processar webhook",
      },
      { status: 500 }
    );
  }
}
