import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface ChatRequest {
  message: string;
  sessionId?: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  data?: any[];
  queryType?: string;
  sqlGenerated?: string;
  error?: string;
}

/**
 * POST /api/smartoffice/chat
 *
 * Natural language chat interface for SmartOffice data
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Require authentication
    const user = await requireAuth(request);

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI chat is not configured. Please contact your administrator.'
        },
        { status: 503 }
      );
    }

    const body: ChatRequest = await request.json();
    const { message, sessionId = `session-${Date.now()}` } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // System prompt for Claude
    const systemPrompt = `You are SmartOffice Intelligence Assistant for Valor Financial, an AI that helps insurance agents query their SmartOffice data using natural language.

AVAILABLE DATA SCHEMA:
1. SmartOfficePolicy table:
   - policyNumber (string)
   - primaryAdvisor (string)
   - productName (string)
   - carrierName (string)
   - primaryInsured (string)
   - statusDate (datetime)
   - type (enum: LIFE, ANNUITY, OTHER)
   - status (enum: ACTIVE, PENDING, ISSUED, DECLINED, LAPSED, SURRENDERED, UNKNOWN)
   - targetAmount (number)
   - commAnnualizedPrem (number) - annual commission/premium
   - weightedPremium (number)
   - firstYearCommission (number)
   - renewalCommission (number)

2. SmartOfficeAgent table:
   - fullName (string)
   - email (string)
   - phones (string)
   - supervisor (string)
   - npn (string)
   - subSource (string)
   - contractList (string)

TENANT ID: ${tenantContext.tenantId}

CRITICAL RULES:
1. ALL queries MUST filter by tenantId: "${tenantContext.tenantId}"
2. ONLY generate SELECT queries - NEVER UPDATE, DELETE, INSERT, or DROP
3. Use Prisma Client syntax, not raw SQL
4. Return responses in this JSON format:
{
  "queryType": "search" | "aggregate" | "count" | "info",
  "prismaQuery": "db.smartOfficePolicy.findMany({ where: { tenantId, ... } })",
  "explanation": "Natural language explanation of what you found",
  "suggestedFollowUps": ["Question 1?", "Question 2?"]
}

EXAMPLE CONVERSATIONS:
User: "Show me pending policies"
Response: {
  "queryType": "search",
  "prismaQuery": "db.smartOfficePolicy.findMany({ where: { tenantId, status: 'PENDING' }, take: 50 })",
  "explanation": "Here are your pending policies",
  "suggestedFollowUps": ["Show only pending from this month", "Which advisors have pending policies?"]
}

User: "How much commission did I make this month?"
Response: {
  "queryType": "aggregate",
  "prismaQuery": "db.smartOfficePolicy.aggregate({ where: { tenantId, statusDate: { gte: new Date('2026-02-01') } }, _sum: { commAnnualizedPrem: true } })",
  "explanation": "Your total commission this month is the result",
  "suggestedFollowUps": ["Compare to last month", "Show top earning policies"]
}

User: "Who is my top advisor?"
Response: {
  "queryType": "aggregate",
  "prismaQuery": "db.smartOfficePolicy.groupBy({ by: ['primaryAdvisor'], where: { tenantId }, _count: { id: true }, _sum: { commAnnualizedPrem: true }, orderBy: { _sum: { commAnnualizedPrem: 'desc' } }, take: 1 })",
  "explanation": "Your top advisor based on total commission",
  "suggestedFollowUps": ["Show all advisor rankings", "Show policies for this advisor"]
}

Respond ONLY with valid JSON. If the question is unclear or not about SmartOffice data, set queryType to "info" and explain in the explanation field.`;

    // Call Claude API
    const completion = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      system: systemPrompt,
    });

    // Parse Claude's response
    const responseText = completion.content[0].type === 'text'
      ? completion.content[0].text
      : '';

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (e) {
      // If Claude didn't return valid JSON, wrap the response
      parsedResponse = {
        queryType: 'info',
        explanation: responseText,
        suggestedFollowUps: [],
      };
    }

    // Execute the query if it's not just info
    let queryResults: any[] = [];
    let actualQuery = '';

    if (parsedResponse.prismaQuery && parsedResponse.queryType !== 'info') {
      try {
        // Validate that the query includes tenantId filter
        if (!parsedResponse.prismaQuery.includes('tenantId')) {
          throw new Error('Query must filter by tenantId');
        }

        // Validate that it's a safe read-only operation
        const safeOperations = ['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'];
        const hasSafeOp = safeOperations.some(op => parsedResponse.prismaQuery.includes(op));

        if (!hasSafeOp) {
          throw new Error('Only read operations are allowed');
        }

        // Execute the Prisma query
        queryResults = await withTenantContext(tenantContext.tenantId, async (db) => {
          // Use eval in a controlled way (only for generated Prisma code)
          // Replace the prismaQuery string with executable code
          const tenantId = tenantContext.tenantId;
          const query = parsedResponse.prismaQuery.replace(/^db\./, '');

          // Execute based on query type
          if (query.startsWith('smartOfficePolicy.')) {
            const method = query.replace('smartOfficePolicy.', '');
            const result = await eval(`db.smartOfficePolicy.${method}`);
            return Array.isArray(result) ? result : [result];
          } else if (query.startsWith('smartOfficeAgent.')) {
            const method = query.replace('smartOfficeAgent.', '');
            const result = await eval(`db.smartOfficeAgent.${method}`);
            return Array.isArray(result) ? result : [result];
          }

          return [];
        });

        actualQuery = parsedResponse.prismaQuery;
      } catch (queryError: any) {
        console.error('[SmartOffice Chat] Query execution error:', queryError);
        parsedResponse.explanation = `I understood your question, but encountered an error executing the query: ${queryError.message}. Please try rephrasing your question.`;
        parsedResponse.queryType = 'info';
      }
    }

    // Save chat history
    await withTenantContext(tenantContext.tenantId, async (db) => {
      await db.smartOfficeChatHistory.create({
        data: {
          tenantId: tenantContext.tenantId,
          userId: user.id,
          sessionId,
          role: 'user',
          message,
          queryType: parsedResponse.queryType,
          sqlGenerated: actualQuery || null,
          resultsCount: queryResults.length,
          results: queryResults.length > 0 ? queryResults : null,
          tokensUsed: completion.usage.input_tokens + completion.usage.output_tokens,
          responseTime: null, // Could track this with timestamps
        },
      });

      await db.smartOfficeChatHistory.create({
        data: {
          tenantId: tenantContext.tenantId,
          userId: user.id,
          sessionId,
          role: 'assistant',
          message: parsedResponse.explanation,
          queryType: parsedResponse.queryType,
          sqlGenerated: actualQuery || null,
          resultsCount: queryResults.length,
          results: null,
          tokensUsed: 0,
          responseTime: null,
        },
      });
    });

    const response: ChatResponse = {
      success: true,
      response: parsedResponse.explanation,
      data: queryResults,
      queryType: parsedResponse.queryType,
      sqlGenerated: actualQuery || undefined,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process chat message'
      },
      { status: 500 }
    );
  }
}
