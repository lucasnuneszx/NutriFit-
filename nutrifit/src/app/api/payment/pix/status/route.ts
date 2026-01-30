import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { query } from "@/lib/db";
import { createSyncPayClient } from "@/lib/sync-pay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verifica status de um pagamento PIX
 * GET /api/payment/pix/status?payment_id=xxx
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Buscar payment_id na query string
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("payment_id");

  if (!paymentId) {
    return NextResponse.json({ ok: false, error: "missing_payment_id" }, { status: 400 });
  }

  try {
    // Verificar se a transação pertence ao usuário
    const transactionResult = await query<{ id: number; referencia_externa: string; status: string; plano: string }>(
      `SELECT id, referencia_externa, status, plano
       FROM transactions
       WHERE referencia_externa = $1 AND user_id = $2`,
      [paymentId, user.id]
    );

    const transaction = transactionResult.rows[0];

    if (!transaction) {
      return NextResponse.json({ ok: false, error: "transaction_not_found" }, { status: 404 });
    }

    // Se já está pago no banco, retornar direto
    if (transaction.status === "pago") {
      return NextResponse.json({
        ok: true,
        status: "paid",
        paid: true,
      });
    }

    // Verificar status na Sync Pay
    const syncPay = createSyncPayClient();
    if (!syncPay) {
      return NextResponse.json(
        { ok: false, error: "sync_pay_not_configured" },
        { status: 500 },
      );
    }

    const statusResponse = await syncPay.checkPaymentStatus(paymentId);

    if (!statusResponse.success || !statusResponse.data) {
      return NextResponse.json(
        {
          ok: false,
          error: "sync_pay_error",
          message: statusResponse.error?.message,
        },
        { status: 500 },
      );
    }

    // Se foi pago, atualizar no banco (polling)
    if (statusResponse.data.status === "paid" && transaction.status !== "pago") {
      // Atualizar transação
      await query(
        `UPDATE transactions
         SET status = $1,
             notas = $2,
             atualizado_em = NOW()
         WHERE id = $3`,
        [
          "pago",
          `PIX Pago em ${statusResponse.data.paid_at || new Date().toISOString()}`,
          transaction.id,
        ]
      );

      // Atualizar plano do usuário
      if (transaction.plano === "plus") {
        await query(
          `UPDATE profiles
           SET tipo_plano = $1,
               plano_pausado = false,
               plano_iniciado_em = NOW(),
               plano_expira_em = NOW() + INTERVAL '30 days',
               atualizado_em = NOW()
           WHERE id = $2`,
          ["plus", user.id]
        );
      }
    }

    return NextResponse.json({
      ok: true,
      status: statusResponse.data.status,
      paid: statusResponse.data.status === "paid",
      paid_at: statusResponse.data.paid_at,
    });
  } catch (error) {
    console.error("[Payment Status] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
