/**
 * Iron Pay API Integration
 * Documentação: https://docs.ironpayapp.com.br/
 */

export interface IronPayConfig {
  apiToken: string; // Token da Iron Pay
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

export interface IronPayPixResponse {
  success: boolean;
  data?: {
    id: string; // ID da transação na Iron Pay
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

export class IronPayClient {
  private apiToken: string;
  private baseUrl: string;

  constructor(config: IronPayConfig) {
    this.apiToken = config.apiToken;
    // URL base da API Iron Pay (conforme documentação oficial)
    // Documentação: https://docs.ironpayapp.com.br/
    this.baseUrl = config.baseUrl || 'https://api.ironpayapp.com.br/v1';
    
    if (!this.baseUrl.startsWith('http://') && !this.baseUrl.startsWith('https://')) {
      throw new Error('IRON_PAY_BASE_URL deve começar com http:// ou https://');
    }
  }

  /**
   * Cria um pagamento PIX
   */
  async createPixPayment(request: CreatePixPaymentRequest): Promise<IronPayPixResponse> {
    try {
      // Endpoint para criar pagamento PIX
      // Verificar na documentação da Iron Pay o endpoint correto
      // Possíveis endpoints:
      // - /pix
      // - /payments/pix
      // - /transactions/pix
      const url = `${this.baseUrl}/pix`;
      
      const payload = {
        amount: request.amount,
        description: request.description,
        customer: request.customer,
        metadata: request.metadata || {},
        expires_in: request.expiresIn || 30, // 30 minutos padrão
      };
      
      console.log('[Iron Pay] Criando pagamento PIX:', { 
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
        let responseText = '';
        try {
          responseText = await response.text();
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { 
            message: `HTTP ${response.status}: ${response.statusText}`,
            rawResponse: responseText.substring(0, 500) // Limitar tamanho
          };
        }
        
        console.error('[Iron Pay] Erro na resposta:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          error: errorData,
          responseHeaders: Object.fromEntries(response.headers.entries()),
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
      console.log('[Iron Pay] Pagamento criado com sucesso:', { id: data.id });

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
      console.error('[Iron Pay] Erro ao criar pagamento:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        baseUrl: this.baseUrl,
        url: `${this.baseUrl}/pix`,
      });
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro de conexão';
      let errorCode = 'NETWORK_ERROR';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout: A requisição demorou muito. Tente novamente.';
          errorCode = 'TIMEOUT_ERROR';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = `Erro de conexão com a API da Iron Pay. Verifique se a URL está correta: ${this.baseUrl}`;
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
      console.error('[Iron Pay] Erro ao verificar pagamento:', error);
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
    // Implementar validação de assinatura se a Iron Pay fornecer
    // Por enquanto, retorna true (implementar quando tiver a documentação)
    return true;
  }
}

/**
 * Helper para criar cliente Iron Pay a partir de variáveis de ambiente
 */
export function createIronPayClient(): IronPayClient | null {
  const apiToken = process.env.IRON_PAY_API_TOKEN;
  const baseUrl = process.env.IRON_PAY_BASE_URL;

  if (!apiToken) {
    console.error('[Iron Pay] ❌ IRON_PAY_API_TOKEN é obrigatório');
    console.error('[Iron Pay] Configure no Railway Dashboard → Variables');
    return null;
  }

  if (!baseUrl) {
    console.warn('[Iron Pay] ⚠️ IRON_PAY_BASE_URL não configurada. Usando URL padrão.');
    console.warn('[Iron Pay] 📋 Verifique a documentação: https://docs.ironpayapp.com.br/');
  } else {
    console.log('[Iron Pay] ✅ URL configurada:', baseUrl);
  }

  try {
    return new IronPayClient({
      apiToken,
      baseUrl,
    });
  } catch (error) {
    console.error('[Iron Pay] Erro ao criar cliente:', error);
    return null;
  }
}

