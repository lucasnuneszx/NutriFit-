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
   * Endpoint: /api/partner/v1/auth-token
   */
  private async getAccessToken(): Promise<string> {
    // Verificar se o token ainda é válido (com margem de 5 minutos)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 5 * 60 * 1000) {
      return this.accessToken;
    }

    try {
      // Endpoint de autenticação da Sync Pay
      // Documentação: https://syncpay.apidog.io/
      const authUrl = this.baseUrl.endsWith('/')
        ? `${this.baseUrl}api/partner/v1/auth-token`
        : `${this.baseUrl}/api/partner/v1/auth-token`;
      
      console.log('[Sync Pay] Obtendo token de acesso:', { 
        url: authUrl,
        baseUrl: this.baseUrl,
        hasClientId: !!this.clientId,
        hasClientSecret: !!this.clientSecret,
        clientIdPreview: this.clientId ? `${this.clientId.substring(0, 8)}...` : 'NÃO CONFIGURADO',
        clientSecretPreview: this.clientSecret ? `${this.clientSecret.substring(0, 8)}...` : 'NÃO CONFIGURADO',
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
      
      // Conforme documentação: https://syncpay.apidog.io/
      // Resposta: { "access_token": "...", "token_type": "Bearer", "expires_in": 3600, "expires_at": "..." }
      if (!data.access_token || typeof data.access_token !== 'string') {
        console.error('[Sync Pay] Resposta da API:', JSON.stringify(data, null, 2));
        throw new Error('Token de acesso inválido na resposta da API. Verifique a estrutura da resposta.');
      }
      
      this.accessToken = data.access_token;
      // Token expira em 3600 segundos (1 hora) conforme documentação
      // Expirar 5 minutos antes do tempo real para garantir validade
      const expiresIn = (data.expires_in || 3600) - 300; // 300 segundos = 5 minutos
      this.tokenExpiresAt = Date.now() + expiresIn * 1000;
      
      console.log('[Sync Pay] Token obtido com sucesso:', {
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt: data.expires_at,
      });
      
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
   * Endpoint: /api/partner/v1/cash-in
   */
  async createPixPayment(request: CreatePixPaymentRequest): Promise<SyncPayPixResponse> {
    try {
      // Obter token de acesso
      const token = await this.getAccessToken();

      // Endpoint para criar pagamento PIX (CashIn)
      // Documentação: https://syncpay.apidog.io/
      const cashInUrl = this.baseUrl.endsWith('/')
        ? `${this.baseUrl}api/partner/v1/cash-in`
        : `${this.baseUrl}/api/partner/v1/cash-in`;
      
      // Converter valor de centavos para reais (SyncPay espera valor em reais)
      const valorEmReais = request.amount / 100;
      
      // Configurar URL do webhook se disponível
      const webhookUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/pix/webhook`
        : undefined;
      
      const payload = {
        amount: valorEmReais, // Valor em reais (double)
        description: request.description,
        ...(webhookUrl && { webhook_url: webhookUrl }),
      };
      
      console.log('[Sync Pay] Criando pagamento PIX:', { 
        url: cashInUrl,
        amount: valorEmReais,
        amountCents: request.amount,
        baseUrl: this.baseUrl,
        hasToken: !!token,
        payload: payload,
      });
      
      // Adicionar timeout de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(cashInUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
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
            rawResponse: responseText.substring(0, 500)
          };
        }
        
        console.error('[Sync Pay] Erro na resposta:', {
          status: response.status,
          statusText: response.statusText,
          url: cashInUrl,
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
      console.log('[Sync Pay] Pagamento criado com sucesso:', { identifier: data.identifier });

      // Adaptar resposta da SyncPay para formato esperado
      // SyncPay retorna: { identifier, pix_code, status, amount, ... }
      return {
        success: true,
        data: {
          id: data.identifier || data.id,
          qr_code: data.qr_code || null, // SyncPay pode não retornar QR code base64
          qr_code_url: data.qr_code_url || null,
          copy_paste: data.pix_code || data.pixCode || '', // Código PIX EMV completo
          expires_at: data.expires_at || new Date(Date.now() + (request.expiresIn || 30) * 60 * 1000).toISOString(),
          status: (data.status?.toLowerCase() || 'pending') as 'pending' | 'paid' | 'expired' | 'cancelled',
          amount: request.amount, // Manter em centavos para compatibilidade
        },
      };
    } catch (error) {
      console.error('[Sync Pay] Erro ao criar pagamento:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        baseUrl: this.baseUrl,
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
   * Endpoint: /api/partner/v1/transaction/{transactionId}
   */
  async checkPaymentStatus(paymentId: string): Promise<CheckPaymentStatusResponse> {
    try {
      const token = await this.getAccessToken();
      
      const statusUrl = this.baseUrl.endsWith('/')
        ? `${this.baseUrl}api/partner/v1/transaction/${paymentId}`
        : `${this.baseUrl}/api/partner/v1/transaction/${paymentId}`;
      
      console.log('[Sync Pay] Verificando status de pagamento:', { url: statusUrl, paymentId });

      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 404) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transação não encontrada',
          },
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: errorData.error?.code || 'UNKNOWN_ERROR',
            message: errorData.error?.message || errorData.message || 'Erro ao verificar pagamento',
          },
        };
      }

      const data = await response.json();
      console.log('[Sync Pay] Status de pagamento:', { identifier: data.identifier, status: data.status });

      // Adaptar resposta da SyncPay
      const transactionData = data.data || data;
      const status = transactionData.status?.toLowerCase() || 'pending';
      
      // Mapear status do SyncPay
      let mappedStatus: 'pending' | 'paid' | 'expired' | 'cancelled' = 'pending';
      if (status === 'completed') {
        mappedStatus = 'paid';
      } else if (status === 'pending' || status === 'processing') {
        mappedStatus = 'pending';
      } else if (status === 'cancelled' || status === 'canceled') {
        mappedStatus = 'cancelled';
      }

      return {
        success: true,
        data: {
          id: transactionData.identifier || transactionData.reference_id || paymentId,
          status: mappedStatus,
          paid_at: transactionData.transaction_date || transactionData.paid_at,
          amount: transactionData.amount ? Math.round(transactionData.amount * 100) : 0, // Converter para centavos
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
