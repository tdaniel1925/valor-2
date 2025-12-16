# VAPI Integration Setup Guide

This guide will help you set up VAPI (Voice AI) integration for the Valor Insurance Platform.

## Overview

VAPI integration allows you to:
- Make AI-powered voice calls to customers
- Manage call assistants and phone numbers
- Track call status and transcripts
- Integrate voice AI into your insurance workflows

## Prerequisites

1. VAPI account and API key (get from [VAPI Dashboard](https://dashboard.vapi.ai))
2. Node.js installed
3. Access to configure environment variables

## Setup Steps

### 1. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# VAPI Configuration
VAPI_ENABLED=true
VAPI_API_KEY=your_vapi_api_key_here
VAPI_BASE_URL=https://api.vapi.ai
VAPI_TIMEOUT=30000
VAPI_RETRY_ATTEMPTS=3
VAPI_RETRY_DELAY=1000
```

### 2. Install VAPI MCP Server (Optional - for Cursor IDE)

The MCP server allows you to control VAPI directly from Cursor IDE.

#### Option A: Use Remote MCP Server (Recommended)

1. Open Cursor Settings
2. Navigate to MCP/Extensions section
3. Add MCP server configuration:
   - URL: `https://mcp.vapi.ai/mcp`
   - Authorization: `Bearer YOUR_VAPI_API_KEY`

#### Option B: Install Local MCP Server

1. Clone the VAPI MCP server repository:
```bash
git clone https://github.com/VapiAI/mcp-server.git
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

4. Create `.env` file in the `mcp-server` directory:
```env
VAPI_TOKEN=your_vapi_api_key_here
```

5. Start the server:
```bash
npm start
```

6. Configure in Cursor:
   - Open Cursor Settings
   - Navigate to MCP/Extensions section
   - Add configuration pointing to your local server (see `.cursor/mcp-config.example.json`)

### 3. Verify Integration

1. Check integration status:
   - Navigate to `/admin/integrations` in your app
   - Verify VAPI shows as configured

2. Test API endpoints:
   - `GET /api/vapi/phone-numbers` - List available phone numbers
   - `GET /api/vapi/assistants` - List assistants
   - `GET /api/vapi/calls` - List calls

## API Usage Examples

### Create a Call

```typescript
import { vapiClient } from '@/lib/integrations/vapi/client';

const call = await vapiClient.createCall({
  phoneNumberId: 'your-phone-number-id',
  customer: {
    number: '+1234567890',
    name: 'John Doe',
  },
  assistantId: 'your-assistant-id',
  metadata: {
    quoteId: 'quote-123',
    caseId: 'case-456',
  },
});
```

### List Calls

```typescript
const calls = await vapiClient.listCalls({
  status: 'in-progress',
  limit: 10,
});
```

### End a Call

```typescript
await vapiClient.endCall('call-id');
```

## API Routes

The following API routes are available:

- `GET /api/vapi/calls` - List calls
- `POST /api/vapi/calls` - Create a call
- `GET /api/vapi/calls/[id]` - Get call details
- `PATCH /api/vapi/calls/[id]` - Update call
- `POST /api/vapi/calls/[id]/end` - End call
- `GET /api/vapi/assistants` - List assistants
- `POST /api/vapi/assistants` - Create assistant
- `GET /api/vapi/assistants/[id]` - Get assistant details
- `GET /api/vapi/phone-numbers` - List phone numbers

## Integration with Insurance Workflows

### ✅ What You Can Do Now

**AI Call Agent Management:**
- ✅ Create and manage AI assistants (call agents)
- ✅ Configure different assistants for different purposes (quotes, applications, renewals)
- ✅ Customize AI behavior, voice, and responses
- ✅ Set up phone numbers for outbound calling

**AI Calling Features:**
- ✅ Make AI-powered calls to clients automatically
- ✅ Track call status in real-time
- ✅ Receive call transcripts
- ✅ Get call recordings
- ✅ Link calls to quotes, cases, and other entities
- ✅ Schedule calls for later

**Workflow Integration:**
- ✅ Quote follow-up calls (`/api/vapi/workflows/quote-followup`)
- ✅ Application status calls (`/api/vapi/workflows/application-status`)
- ✅ Requirements reminder calls (`/api/vapi/workflows/requirements-reminder`)
- ✅ Policy renewal calls
- ✅ Custom workflow calls

### Use Cases

1. **Quote Follow-up Calls**: Automatically call clients after sending quotes
   ```typescript
   // Call client about their quote
   POST /api/vapi/workflows/quote-followup
   { "quoteId": "quote-123" }
   ```

2. **Application Status Updates**: Notify clients when application status changes
   ```typescript
   // Call client about application status
   POST /api/vapi/workflows/application-status
   { "caseId": "case-456" }
   ```

3. **Requirements Reminders**: Remind clients about incomplete applications
   ```typescript
   // Call client about pending requirements
   POST /api/vapi/workflows/requirements-reminder
   { "caseId": "case-456" }
   ```

4. **Policy Renewal Calls**: Automated renewal reminders
5. **Customer Support**: AI-powered customer support calls

### Example: Quote Follow-up Call

```typescript
import { callClientAboutQuote } from '@/lib/integrations/vapi/workflows';

// Simple one-line call
const call = await callClientAboutQuote('quote-123');

// Or use the API endpoint
fetch('/api/vapi/workflows/quote-followup', {
  method: 'POST',
  body: JSON.stringify({ quoteId: 'quote-123' }),
});
```

### Example: Create Custom AI Assistant

```typescript
import { createInsuranceAssistant } from '@/lib/integrations/vapi/workflows';

// Create an assistant for quote follow-ups
const assistant = await createInsuranceAssistant(
  'Quote Follow-up Assistant',
  'quote-followup'
);
```

## Troubleshooting

### Integration Not Working

1. Check environment variables are set correctly
2. Verify `VAPI_ENABLED=true` is set
3. Check API key is valid
4. Review server logs for errors

### MCP Server Not Connecting

1. Verify the server is running (if using local)
2. Check API key is correct
3. Verify network connectivity (if using remote)
4. Check Cursor MCP configuration

## Resources

- [VAPI Documentation](https://docs.vapi.ai)
- [VAPI Dashboard](https://dashboard.vapi.ai)
- [VAPI MCP Server GitHub](https://github.com/VapiAI/mcp-server)

## Support

For issues or questions:
1. Check VAPI documentation
2. Review integration logs
3. Contact development team

