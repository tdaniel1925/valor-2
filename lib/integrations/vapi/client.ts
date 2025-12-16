/**
 * VAPI API Client for Voice AI Integration
 */

import { BaseIntegration } from '../base-integration';
import { vapiConfig } from '../config';
import { startTimer } from '../audit';
import {
  VapiCall,
  CreateCallRequest,
  CreateCallResponse,
  GetCallResponse,
  ListCallsRequest,
  ListCallsResponse,
  UpdateCallRequest,
  VapiCallStatus,
  VapiAssistant,
  CreateAssistantRequest,
  VapiPhoneNumber,
  VapiHealthCheck,
} from './types';

export class VapiClient extends BaseIntegration {
  get name(): string {
    return 'VAPI';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.vapi.ai';
  }

  constructor() {
    super(vapiConfig);
  }

  /**
   * Override auth headers to use VAPI's API key format
   */
  protected getAuthHeaders(): Record<string, string> {
    if (this.config.apiKey) {
      return {
        Authorization: `Bearer ${this.config.apiKey}`,
      };
    }
    return {};
  }

  /**
   * Create a new phone call
   */
  async createCall(request: CreateCallRequest): Promise<CreateCallResponse> {
    if (!this.config.enabled) {
      console.log('[VAPI_MOCK] Call would be created:', {
        phoneNumberId: request.phoneNumberId,
        customer: request.customer,
      });
      return {
        id: `mock-call-${Date.now()}`,
        status: VapiCallStatus.QUEUED,
        phoneNumberId: request.phoneNumberId,
        customer: request.customer,
        createdAt: new Date().toISOString(),
      };
    }

    return this.request<CreateCallResponse>('/call', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get call details by ID
   */
  async getCall(callId: string): Promise<GetCallResponse> {
    if (!this.config.enabled) {
      throw new Error('VAPI integration is not enabled');
    }

    return this.request<GetCallResponse>(`/call/${callId}`, {
      method: 'GET',
    });
  }

  /**
   * List calls with optional filters
   */
  async listCalls(request?: ListCallsRequest): Promise<ListCallsResponse> {
    if (!this.config.enabled) {
      return {
        calls: [],
        hasMore: false,
      };
    }

    const params = new URLSearchParams();
    if (request?.phoneNumberId) params.append('phoneNumberId', request.phoneNumberId);
    if (request?.status) params.append('status', request.status);
    if (request?.customerNumber) params.append('customerNumber', request.customerNumber);
    if (request?.limit) params.append('limit', request.limit.toString());
    if (request?.cursor) params.append('cursor', request.cursor);

    const queryString = params.toString();
    const endpoint = queryString ? `/call?${queryString}` : '/call';

    return this.request<ListCallsResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Update a call (e.g., end call, update metadata)
   */
  async updateCall(callId: string, request: UpdateCallRequest): Promise<GetCallResponse> {
    if (!this.config.enabled) {
      throw new Error('VAPI integration is not enabled');
    }

    return this.request<GetCallResponse>(`/call/${callId}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  /**
   * End a call
   */
  async endCall(callId: string): Promise<GetCallResponse> {
    return this.updateCall(callId, {
      status: VapiCallStatus.ENDED,
    });
  }

  /**
   * Create an assistant
   */
  async createAssistant(request: CreateAssistantRequest): Promise<VapiAssistant> {
    if (!this.config.enabled) {
      throw new Error('VAPI integration is not enabled');
    }

    return this.request<VapiAssistant>('/assistant', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get assistant by ID
   */
  async getAssistant(assistantId: string): Promise<VapiAssistant> {
    if (!this.config.enabled) {
      throw new Error('VAPI integration is not enabled');
    }

    return this.request<VapiAssistant>(`/assistant/${assistantId}`, {
      method: 'GET',
    });
  }

  /**
   * List assistants
   */
  async listAssistants(): Promise<VapiAssistant[]> {
    if (!this.config.enabled) {
      return [];
    }

    return this.request<VapiAssistant[]>('/assistant', {
      method: 'GET',
    });
  }

  /**
   * Get phone numbers
   */
  async getPhoneNumbers(): Promise<VapiPhoneNumber[]> {
    if (!this.config.enabled) {
      return [];
    }

    return this.request<VapiPhoneNumber[]>('/phone-number', {
      method: 'GET',
    });
  }

  /**
   * Health check for VAPI API
   */
  async healthCheck() {
    if (!this.config.enabled) {
      return {
        healthy: false,
        message: 'VAPI integration is disabled',
        lastChecked: new Date(),
      };
    }

    if (!this.config.apiKey) {
      return {
        healthy: false,
        message: 'VAPI API key not configured',
        lastChecked: new Date(),
      };
    }

    const timer = startTimer();
    try {
      // Try to list phone numbers as a health check
      await this.getPhoneNumbers();

      return {
        healthy: true,
        message: 'VAPI API is accessible',
        lastChecked: new Date(),
        responseTime: timer(),
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'VAPI API health check failed',
        lastChecked: new Date(),
        responseTime: timer(),
      };
    }
  }
}

// Export singleton instance
export const vapiClient = new VapiClient();

