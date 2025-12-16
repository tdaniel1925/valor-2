/**
 * VAPI Workflow Integration Examples
 * 
 * These functions demonstrate how to integrate AI calling into your insurance workflows
 */

import { vapiClient } from './client';
import { CreateCallRequest } from './types';
import { prisma } from '@/lib/db/prisma';

/**
 * Call a client about a quote follow-up
 * Use case: After sending a quote, automatically call the client to answer questions
 */
export async function callClientAboutQuote(quoteId: string) {
  // Get quote details
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { user: true },
  });

  if (!quote || !quote.clientPhone) {
    throw new Error('Quote not found or client phone number missing');
  }

  // Create AI call
  const call = await vapiClient.createCall({
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
    customer: {
      number: quote.clientPhone,
      name: quote.clientName,
    },
    assistantId: process.env.VAPI_QUOTE_FOLLOWUP_ASSISTANT_ID!,
    metadata: {
      quoteId: quote.id,
      quoteType: quote.type,
      carrier: quote.carrier,
      productName: quote.productName,
      premium: quote.premium,
      agentName: `${quote.user.firstName} ${quote.user.lastName}`.trim() || 'Insurance Agent',
      type: 'quote-followup',
    },
  });

  return call;
}

/**
 * Call a client about application status
 * Use case: Notify client when application status changes (approved, needs requirements, etc.)
 */
export async function callClientAboutApplication(caseId: string) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: { user: true },
  });

  if (!caseData || !caseData.clientPhone) {
    throw new Error('Case not found or client phone number missing');
  }

  const call = await vapiClient.createCall({
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
    customer: {
      number: caseData.clientPhone,
      name: caseData.clientName,
    },
    assistantId: process.env.VAPI_APPLICATION_STATUS_ASSISTANT_ID!,
    metadata: {
      caseId: caseData.id,
      status: caseData.status,
      applicationNumber: caseData.applicationNumber,
      carrier: caseData.carrier,
      productName: caseData.productName,
      pendingRequirements: caseData.pendingRequirements,
      agentName: `${caseData.user.firstName} ${caseData.user.lastName}`.trim() || 'Insurance Agent',
      type: 'application-status',
    },
  });

  return call;
}

/**
 * Call client about pending requirements
 * Use case: Remind clients about incomplete application requirements
 */
export async function callClientAboutRequirements(caseId: string) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: { user: true },
  });

  if (!caseData || !caseData.clientPhone || caseData.pendingRequirements.length === 0) {
    throw new Error('Case not found, no phone number, or no pending requirements');
  }

  const call = await vapiClient.createCall({
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
    customer: {
      number: caseData.clientPhone,
      name: caseData.clientName,
    },
    assistantId: process.env.VAPI_REQUIREMENTS_REMINDER_ASSISTANT_ID!,
    metadata: {
      caseId: caseData.id,
      applicationNumber: caseData.applicationNumber,
      pendingRequirements: caseData.pendingRequirements,
      carrier: caseData.carrier,
      agentName: `${caseData.user.firstName} ${caseData.user.lastName}`.trim() || 'Insurance Agent',
      type: 'requirements-reminder',
    },
  });

  return call;
}

/**
 * Call client about policy renewal
 * Use case: Automated renewal reminders before policy expiration
 */
export async function callClientAboutRenewal(policyNumber: string, clientPhone: string, clientName: string) {
  const call = await vapiClient.createCall({
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
    customer: {
      number: clientPhone,
      name: clientName,
    },
    assistantId: process.env.VAPI_RENEWAL_ASSISTANT_ID!,
    metadata: {
      policyNumber,
      type: 'renewal-reminder',
    },
  });

  return call;
}

/**
 * Call client for quote request
 * Use case: Call client who requested a quote but hasn't responded
 */
export async function callClientForQuoteRequest(clientPhone: string, clientName: string, agentName: string) {
  const call = await vapiClient.createCall({
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
    customer: {
      number: clientPhone,
      name: clientName,
    },
    assistantId: process.env.VAPI_QUOTE_REQUEST_ASSISTANT_ID!,
    metadata: {
      agentName,
      type: 'quote-request',
    },
  });

  return call;
}

/**
 * Schedule a call for later
 * Use case: Queue calls for specific times or after certain events
 */
export async function scheduleCallForQuote(quoteId: string, delayMinutes: number = 30) {
  // In a real implementation, you'd use a job queue (like Bull, BullMQ, etc.)
  // For now, this is a placeholder showing the concept
  
  setTimeout(async () => {
    try {
      await callClientAboutQuote(quoteId);
    } catch (error) {
      console.error('Failed to make scheduled call:', error);
    }
  }, delayMinutes * 60 * 1000);
}

/**
 * Get call history for a quote or case
 */
export async function getCallHistoryForEntity(entityType: 'quote' | 'case', entityId: string) {
  const calls = await vapiClient.listCalls({
    limit: 50,
  });

  // Filter calls that match this entity
  return calls.calls.filter(call => 
    call.metadata?.[`${entityType}Id`] === entityId
  );
}

/**
 * Create a custom assistant for insurance workflows
 */
export async function createInsuranceAssistant(
  name: string,
  purpose: 'quote-followup' | 'application-status' | 'requirements' | 'renewal' | 'general'
) {
  const assistantConfigs = {
    'quote-followup': {
      firstMessage: 'Hi {{customer.name}}, this is an automated call from {{agentName}} regarding your recent insurance quote. I can answer questions about your quote and help you move forward.',
      model: {
        provider: 'openai',
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful insurance assistant helping clients understand their insurance quotes. Be friendly, professional, and answer questions clearly.',
          },
        ],
      },
    },
    'application-status': {
      firstMessage: 'Hi {{customer.name}}, this is an automated call from {{agentName}} regarding your insurance application status.',
      model: {
        provider: 'openai',
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful insurance assistant providing application status updates. Be clear about what information is needed and next steps.',
          },
        ],
      },
    },
    'requirements': {
      firstMessage: 'Hi {{customer.name}}, this is an automated call from {{agentName}} about your insurance application. We need some additional information to process your application.',
      model: {
        provider: 'openai',
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are helping clients understand what documents or information they need to provide for their insurance application. Be specific and helpful.',
          },
        ],
      },
    },
    'renewal': {
      firstMessage: 'Hi {{customer.name}}, this is an automated call from {{agentName}} about your policy renewal.',
      model: {
        provider: 'openai',
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are helping clients with policy renewals. Be clear about renewal dates, premium changes, and next steps.',
          },
        ],
      },
    },
    'general': {
      firstMessage: 'Hi {{customer.name}}, this is an automated call from {{agentName}}. How can I help you today?',
      model: {
        provider: 'openai',
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful insurance assistant. Answer questions about insurance products, quotes, applications, and policies professionally.',
          },
        ],
      },
    },
  };

  const config = assistantConfigs[purpose];

  const assistant = await vapiClient.createAssistant({
    name,
    ...config,
    voice: {
      provider: '11labs',
      voiceId: process.env.VAPI_VOICE_ID || 'default',
    },
    recordingEnabled: true,
    silenceTimeoutSeconds: 5,
    responseDelaySeconds: 1,
    maxDurationSeconds: 600, // 10 minutes
  });

  return assistant;
}




