import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createPerfectPayClient } from "@/lib/perfect-pay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verifica status de um pagamento PIX
 * GET /api/payment/pix/status?payment_id=xxx
 */
export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "missing_env" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Buscar payment_id na query string
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("payment_id");

  if (!paymentId) {
    return NextResponse.json({ ok: false, error: "missing_payment_id" }, { status: 400 });
  }

  // Verificar se a transação pertence ao usuário
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id, referencia_externa, status")
    .eq("referencia_externa", paymentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (transactionError || !transaction) {
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

  // Verificar status na Perfect Pay
  const perfectPay = createPerfectPayClient();
  if (!perfectPay) {
    return NextResponse.json(
      { ok: false, error: "perfect_pay_not_configured" },
      { status: 500 },
    );
  }

  const statusResponse = await perfectPay.checkPaymentStatus(paymentId);

  if (!statusResponse.success || !statusResponse.data) {
    return NextResponse.json(
      {
        ok: false,
        error: "perfect_pay_error",
        message: statusResponse.error?.message,
      },
      { status: 500 },
    );
  }

  // Se foi pago, atualizar no banco (polling)
  if (statusResponse.data.status === "paid" && transaction.status !== "pago") {
    // Atualizar transação
    await supabase
      .from("transactions")
      .update({
        status: "pago",
        notas: `PIX Pago em ${statusResponse.data.paid_at || new Date().toISOString()}`,
      })
      .eq("id", transaction.id);

    // Atualizar plano do usuário
    const { data: trans } = await supabase
      .from("transactions")
      .select("plano")
      .eq("id", transaction.id)
      .single();

    if (trans?.plano === "plus") {
      await supabase
        .from("profiles")
        .update({
          tipo_plano: "plus",
          plano_pausado: false,
          plano_iniciado_em: new Date().toISOString(),
          plano_expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", user.id);
    }
  }

  return NextResponse.json({
    ok: true,
    status: statusResponse.data.status,
    paid: statusResponse.data.status === "paid",
    paid_at: statusResponse.data.paid_at,
  });
}

