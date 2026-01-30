/**
 * Sync Pay API Integration
 * Documentação: https://syncpay.apidog.io/
 * Base URL: https://api.syncpayments.com.br/
 */

export interface SyncPayConfig {
  clientId: string; // Client ID (pública)
  clientSecret: string; // Client Secret (privada)
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

export interface SyncPayPixResponse {
  success: boolean;
  data?: {
    id: string; // ID da transação na Sync Pay
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

export class SyncPayClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: SyncPayConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    // URL base da API Sync Pay (conforme documentação oficial)
    // Documentação: https://syncpay.apidog.io/
    this.baseUrl = config.baseUrl || 'https://api.syncpayments.com.br';
    
    if (!this.baseUrl.startsWith('http://') && !this.baseUrl.startsWith('https://')) {
      throw new Error('SYNC_PAY_BASE_URL deve começar com http:// ou https://');
    }
  }

  /**
   * Obtém token de acesso OAuth2
   */
  private async getAccessToken(): Promise<string> {
    // Verificar se o token ainda é válido (com margem de 5 minutos)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 5 * 60 * 1000) {
      return this.accessToken;
    }

    try {
      // Endpoint de autenticação da Sync Pay
      // Verificar na documentação: https://syncpay.apidog.io/
      // Possíveis endpoints:
      // - /api/partner/v1/auth-token
      // - /v1/auth/token
      // - /auth/token
      const authUrl = `${this.baseUrl}/api/partner/v1/auth-token`;
      
      console.log('[Sync Pay] Obtendo token de acesso:', { 
        url: authUrl,
        baseUrl: this.baseUrl,
        hasClientId: !!this.clientId,
        hasClientSecret: !!this.clientSecret,
      });
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        let errorData;
        let responseText = '';
        try {
          responseText = await response.text();
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { 
            message: `HTTP ${response.status}: ${response.statusText}`,
            rawResponse: responseText.substring(0, 500)
          };
        }
        
        console.error('[Sync Pay] Erro ao obter token:', {
          status: response.status,
          statusText: response.statusText,
          url: authUrl,
          error: errorData,
        });
        
        throw new Error(`Erro ao obter token: ${errorData.error || errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      // A Sync Pay pode retornar o token em diferentes campos
      // Verificar: access_token, token, data.token, etc.
      const token = data.access_token || data.token || data.data?.token || data.data?.access_token;
      
      if (!token || typeof token !== 'string') {
        console.error('[Sync Pay] Resposta da API:', JSON.stringify(data, null, 2));
        throw new Error('Token de acesso inválido na resposta da API. Verifique a estrutura da resposta.');
      }
      
      this.accessToken = token;
      // Token geralmente expira em 3600 segundos (1 hora)
      this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

      // Garantir que sempre retornamos uma string válida
      if (!this.accessToken) {
        throw new Error('Token de acesso não foi definido');
      }
      
      return this.accessToken;
    } catch (error) {
      console.error('[Sync Pay] Erro ao obter token:', error);
      throw error;
    }
  }

  /**
   * Cria um pagamento PIX
   */
  async createPixPayment(request: CreatePixPaymentRequest): Promise<SyncPayPixResponse> {
    try {
      // Obter token de acesso
      const token = await this.getAccessToken();

      // Endpoint para criar pagamento PIX
      // Verificar na documentação da Sync Pay o endpoint correto
      // Possíveis endpoints:
      // - /v1/pix
      // - /v1/payments/pix
      // - /v1/transactions/pix
      const url = `${this.baseUrl}/v1/pix`;
      
      const payload = {
        amount: request.amount,
        description: request.description,
        customer: request.customer,
        metadata: request.metadata || {},
        expires_in: request.expiresIn || 30, // 30 minutos padrão
      };
      
      console.log('[Sync Pay] Criando pagamento PIX:', { 
        url, 
        fullUrl: url,
        amount: request.amount,
        baseUrl: this.baseUrl,
        hasClientId: !!this.clientId,
        hasClientSecret: !!this.clientSecret,
        payload: payload,
      });
      
      // Adicionar timeout de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
        
        console.error('[Sync Pay] Erro na resposta:', {
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
      console.log('[Sync Pay] Pagamento criado com sucesso:', { id: data.id });

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
      console.error('[Sync Pay] Erro ao criar pagamento:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        baseUrl: this.baseUrl,
        url: `${this.baseUrl}/v1/pix`,
      });
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro de conexão';
      let errorCode = 'NETWORK_ERROR';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout: A requisição demorou muito. Tente novamente.';
          errorCode = 'TIMEOUT_ERROR';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = `Erro de conexão com a API da Sync Pay. Verifique se a URL está correta: ${this.baseUrl}`;
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
      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      console.error('[Sync Pay] Erro ao verificar pagamento:', error);
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
    // Implementar validação de assinatura se a Sync Pay fornecer
    // Por enquanto, retorna true (implementar quando tiver a documentação)
    return true;
  }
}

/**
 * Helper para criar cliente Sync Pay a partir de variáveis de ambiente
 */
export function createSyncPayClient(): SyncPayClient | null {
  const clientId = process.env.SYNC_PAY_CLIENT_ID;
  const clientSecret = process.env.SYNC_PAY_CLIENT_SECRET;
  const baseUrl = process.env.SYNC_PAY_BASE_URL;

  if (!clientId || !clientSecret) {
    console.error('[Sync Pay] ❌ SYNC_PAY_CLIENT_ID e SYNC_PAY_CLIENT_SECRET são obrigatórios');
    console.error('[Sync Pay] Configure no Railway Dashboard → Variables');
    console.error('[Sync Pay] 📋 Documentação: https://syncpay.apidog.io/');
    return null;
  }

  if (!baseUrl) {
    console.warn('[Sync Pay] ⚠️ SYNC_PAY_BASE_URL não configurada. Usando URL padrão.');
    console.warn('[Sync Pay] 📋 URL padrão: https://api.syncpayments.com.br');
    console.warn('[Sync Pay] 📋 Documentação: https://syncpay.apidog.io/');
  } else {
    console.log('[Sync Pay] ✅ URL configurada:', baseUrl);
  }

  try {
    return new SyncPayClient({
      clientId,
      clientSecret,
      baseUrl,
    });
  } catch (error) {
    console.error('[Sync Pay] Erro ao criar cliente:', error);
    return null;
  }
}

