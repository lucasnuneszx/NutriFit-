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
      const url = `${this.baseUrl}/payments/pix`;
      const payload = {
        amount: request.amount,
        description: request.description,
        customer: request.customer,
        metadata: request.metadata || {},
        expires_in: request.expiresIn || 30, // 30 minutos padrão
      };
      
      console.log('[Perfect Pay] Criando pagamento PIX:', { 
        url, 
        amount: request.amount,
        baseUrl: this.baseUrl,
        hasToken: !!this.apiToken,
        tokenLength: this.apiToken?.length || 0,
      });
      
      // Adicionar timeout de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Verificar se a resposta é válida
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('[Perfect Pay] Erro na resposta:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        
        return {
          success: false,
          error: {
            code: errorData.error?.code || `HTTP_${response.status}`,
            message: errorData.error?.message || errorData.message || `Erro ${response.status}: ${response.statusText}`,
          },
        };
      }

      const data = await response.json();
      console.log('[Perfect Pay] Pagamento criado com sucesso:', { id: data.id });

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
      console.error('[Perfect Pay] Erro ao criar pagamento:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        baseUrl: this.baseUrl,
        url: `${this.baseUrl}/payments/pix`,
      });
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro de conexão';
      let errorCode = 'NETWORK_ERROR';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout: A requisição demorou muito. Tente novamente.';
          errorCode = 'TIMEOUT_ERROR';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = `Erro de conexão com a API da Perfect Pay. Verifique se a URL está correta: ${this.baseUrl}`;
          errorCode = 'NETWORK_ERROR';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
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

