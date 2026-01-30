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
    // URL base da API Perfect Pay (conforme documentação oficial)
    // Documentação: https://support.perfectpay.com.br/doc/perfect-pay/perfectpay-api/conhecendo-a-api
    this.baseUrl = config.baseUrl || 'https://app.perfectpay.com.br/api';
    
    if (!this.baseUrl.startsWith('http://') && !this.baseUrl.startsWith('https://')) {
      throw new Error('PERFECT_PAY_BASE_URL deve começar com http:// ou https://');
    }
  }

  /**
   * Cria um pagamento PIX
   */
  async createPixPayment(request: CreatePixPaymentRequest): Promise<PerfectPayPixResponse> {
    try {
      // Perfect Pay não tem endpoint público direto POST /pix
      // O PIX é gerado através do checkout
      // Tentando endpoint de checkout que gera PIX
      const url = `${this.baseUrl}/checkout`;
      
      // Payload conforme estrutura da Perfect Pay para checkout
      // A Perfect Pay pode usar uma estrutura diferente - verificar documentação
      const payload = {
        amount: request.amount,
        description: request.description,
        customer: request.customer,
        metadata: request.metadata || {},
        expires_in: request.expiresIn || 30, // 30 minutos padrão
        payment_method: 'pix', // Especificar método de pagamento como PIX
        // Possíveis campos adicionais necessários:
        // product_code: request.metadata?.product_code,
        // plan_code: request.metadata?.plan_code,
      };
      
      console.log('[Perfect Pay] Criando pagamento PIX:', { 
        url, 
        fullUrl: url,
        amount: request.amount,
        baseUrl: this.baseUrl,
        hasToken: !!this.apiToken,
        tokenLength: this.apiToken?.length || 0,
        payload: payload,
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
    console.error('[Perfect Pay] ❌ PERFECT_PAY_API_TOKEN é obrigatório');
    console.error('[Perfect Pay] Configure no Railway Dashboard → Variables');
    return null;
  }

  // Avisar se a URL padrão está sendo usada (pode estar incorreta)
  if (!baseUrl) {
    console.error('[Perfect Pay] ⚠️ PERFECT_PAY_BASE_URL não configurada!');
    console.error('[Perfect Pay] A URL padrão (api.perfectpay.com.br) NÃO EXISTE (erro DNS)');
    console.error('[Perfect Pay] 📋 Acesse: app.perfectpay.com.br → Ferramentas → API');
    console.error('[Perfect Pay] 📋 Encontre a URL correta e configure PERFECT_PAY_BASE_URL no Railway');
    console.error('[Perfect Pay] 📋 Veja o arquivo: COMO_ENCONTRAR_URL_PERFECT_PAY.md');
  } else {
    console.log('[Perfect Pay] ✅ URL configurada:', baseUrl);
  }

  try {
    return new PerfectPayClient({
      apiToken,
      baseUrl,
    });
  } catch (error) {
    console.error('[Perfect Pay] Erro ao criar cliente:', error);
    return null;
  }
}

