/**
 * Perfect Pay API Integration
 * Documentação: https://perfectpay.com.br/docs
 */

export interface PerfectPayConfig {
  apiToken: string; // JWT Token da Perfect Pay
  baseUrl?: string;
}

export interface CreatePixPaymentRequest {
  amount: number; // Valor em centavos
  description: string;
  customer: {
    name: string;
    email: string;
    document?: string; // CPF/CNPJ
    phone?: string;
  };
  metadata?: Record<string, string>;
  expiresIn?: number; // Minutos até expirar (padrão: 30)
}

export interface PerfectPayPixResponse {
  success: boolean;
  data?: {
    id: string; // ID da transação na Perfect Pay
    qr_code: string; // QR Code PIX (base64 ou string)
    qr_code_url: string; // URL do QR Code
    copy_paste: string; // Código PIX para copiar e colar
    expires_at: string; // Data de expiração
    status: 'pending' | 'paid' | 'expired' | 'cancelled';
    amount: number; // Valor em centavos
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface CheckPaymentStatusResponse {
  success: boolean;
  data?: {
    id: string;
    status: 'pending' | 'paid' | 'expired' | 'cancelled';
    paid_at?: string;
    amount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class PerfectPayClient {
  private apiToken: string;
  private baseUrl: string;

  constructor(config: PerfectPayConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://api.perfectpay.com.br/v1';
  }

  /**
   * Cria um pagamento PIX
   */
  async createPixPayment(request: CreatePixPaymentRequest): Promise<PerfectPayPixResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          amount: request.amount,
          description: request.description,
          customer: request.customer,
          metadata: request.metadata || {},
          expires_in: request.expiresIn || 30, // 30 minutos padrão
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'UNKNOWN_ERROR',
            message: data.error?.message || 'Erro ao criar pagamento PIX',
          },
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          qr_code: data.qr_code,
          qr_code_url: data.qr_code_url || data.qr_code,
          copy_paste: data.copy_paste || data.pix_code,
          expires_at: data.expires_at,
          status: data.status || 'pending',
          amount: data.amount,
        },
      };
    } catch (error) {
      console.error('[Perfect Pay] Erro ao criar pagamento:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de conexão',
        },
      };
    }
  }

  /**
   * Verifica status de um pagamento
   */
  async checkPaymentStatus(paymentId: string): Promise<CheckPaymentStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'UNKNOWN_ERROR',
            message: data.error?.message || 'Erro ao verificar pagamento',
          },
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          status: data.status,
          paid_at: data.paid_at,
          amount: data.amount,
        },
      };
    } catch (error) {
      console.error('[Perfect Pay] Erro ao verificar pagamento:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de conexão',
        },
      };
    }
  }

  /**
   * Valida webhook signature (segurança)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    // Implementar validação de assinatura se a Perfect Pay fornecer
    // Por enquanto, retorna true (implementar quando tiver a documentação)
    return true;
  }
}

/**
 * Helper para criar cliente Perfect Pay a partir de variáveis de ambiente
 */
export function createPerfectPayClient(): PerfectPayClient | null {
  const apiToken = process.env.PERFECT_PAY_API_TOKEN;
  const baseUrl = process.env.PERFECT_PAY_BASE_URL;

  if (!apiToken) {
    console.error('[Perfect Pay] PERFECT_PAY_API_TOKEN é obrigatório');
    return null;
  }

  return new PerfectPayClient({
    apiToken,
    baseUrl,
  });
}

