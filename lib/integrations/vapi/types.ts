/**
 * VAPI - Voice AI Integration Types
 */

export interface VapiCall {
  id: string;
  phoneNumberId: string;
  customer: {
    number: string;
  };
  phoneNumber?: {
    number: string;
  };
  status: VapiCallStatus;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  costBreakdown?: {
    model?: number;
    transcription?: number;
    tts?: number;
    transport?: number;
  };
  transcript?: string;
  messages?: VapiMessage[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export enum VapiCallStatus {
  QUEUED = 'queued',
  RINGING = 'ringing',
  IN_PROGRESS = 'in-progress',
  ENDED = 'ended',
  BUSY = 'busy',
  FAILED = 'failed',
  NO_ANSWER = 'no-answer',
  CANCELLED = 'cancelled',
}

export interface VapiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface CreateCallRequest {
  phoneNumberId: string;
  customer: {
    number: string;
    name?: string;
  };
  assistantId?: string;
  assistantOverrides?: {
    model?: {
      provider: string;
      model: string;
      messages?: Array<{
        role: string;
        content: string;
      }>;
    };
    voice?: {
      provider: string;
      voiceId: string;
    };
    firstMessage?: string;
    voicemailMessage?: string;
    endCallFunction?: string;
    endCallPhrases?: string[];
    recordingEnabled?: boolean;
    silenceTimeoutSeconds?: number;
    responseDelaySeconds?: number;
    maxDurationSeconds?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface CreateCallResponse {
  id: string;
  status: VapiCallStatus;
  phoneNumberId: string;
  customer: {
    number: string;
  };
  createdAt: string;
}

export interface GetCallResponse extends VapiCall {}

export interface ListCallsRequest {
  phoneNumberId?: string;
  status?: VapiCallStatus;
  customerNumber?: string;
  limit?: number;
  cursor?: string;
}

export interface ListCallsResponse {
  calls: VapiCall[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface UpdateCallRequest {
  status?: VapiCallStatus;
  metadata?: Record<string, unknown>;
}

export interface VapiAssistant {
  id: string;
  name: string;
  model: {
    provider: string;
    model: string;
  };
  voice: {
    provider: string;
    voiceId: string;
  };
  firstMessage?: string;
  voicemailMessage?: string;
  endCallFunction?: string;
  endCallPhrases?: string[];
  recordingEnabled?: boolean;
  silenceTimeoutSeconds?: number;
  responseDelaySeconds?: number;
  maxDurationSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssistantRequest {
  name: string;
  model: {
    provider: string;
    model: string;
    messages?: Array<{
      role: string;
      content: string;
    }>;
  };
  voice: {
    provider: string;
    voiceId: string;
  };
  firstMessage?: string;
  voicemailMessage?: string;
  endCallFunction?: string;
  endCallPhrases?: string[];
  recordingEnabled?: boolean;
  silenceTimeoutSeconds?: number;
  responseDelaySeconds?: number;
  maxDurationSeconds?: number;
}

export interface VapiPhoneNumber {
  id: string;
  number: string;
  name?: string;
  assistantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VapiHealthCheck {
  healthy: boolean;
  message?: string;
  version?: string;
}



