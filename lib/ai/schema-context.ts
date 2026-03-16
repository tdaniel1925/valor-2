export function buildSchemaContext(tenantId: string): string {
  return `# Database Schema for Tenant: ${tenantId}

You have access to these tables. ALWAYS filter by tenantId.

## smartoffice_policies
- id: String
- tenantId: String (REQUIRED in WHERE clause)
- policyNumber: String
- agentName: String
- insuredName: String
- productType: String (LIFE, ANNUITY, DISABILITY, etc.)
- carrier: String
- premium: Decimal
- status: String (ACTIVE, PENDING, CANCELLED, LAPSED)
- statusDate: DateTime
- createdAt: DateTime
- updatedAt: DateTime

## smartoffice_agents
- id: String
- tenantId: String (REQUIRED in WHERE clause)
- name: String
- email: String
- phone: String
- supervisor: String
- npn: String
- source: String
- createdAt: DateTime
- updatedAt: DateTime

## users
- id: String
- tenantId: String (REQUIRED in WHERE clause)
- email: String
- firstName: String
- lastName: String
- role: String (AGENT, MANAGER, ADMINISTRATOR, EXECUTIVE)
- status: String (ACTIVE, INACTIVE, SUSPENDED, PENDING)
- createdAt: DateTime
- updatedAt: DateTime

## IMPORTANT RULES:
1. EVERY query MUST include: WHERE "tenantId" = '${tenantId}'
2. Use PostgreSQL syntax
3. Use double quotes for column names: "tenantId", "agentName", "productType"
4. Return only SELECT queries (no INSERT/UPDATE/DELETE)
5. For aggregations, use SQL functions: COUNT, SUM, AVG, MAX, MIN
6. For dates, use PostgreSQL date functions

## Example Queries:

Q: "Who is my top agent by premium?"
SQL: SELECT "agentName", SUM(premium) as total_premium FROM smartoffice_policies WHERE "tenantId" = '${tenantId}' AND status = 'ACTIVE' GROUP BY "agentName" ORDER BY total_premium DESC LIMIT 1;

Q: "How many pending policies do I have?"
SQL: SELECT COUNT(*) as count FROM smartoffice_policies WHERE "tenantId" = '${tenantId}' AND status = 'PENDING';

Q: "Show me my top 5 carriers by policy count"
SQL: SELECT carrier, COUNT(*) as policy_count FROM smartoffice_policies WHERE "tenantId" = '${tenantId}' GROUP BY carrier ORDER BY policy_count DESC LIMIT 5;

Q: "What's my total premium for active policies?"
SQL: SELECT SUM(premium) as total_premium FROM smartoffice_policies WHERE "tenantId" = '${tenantId}' AND status = 'ACTIVE';

Q: "List agents with more than 10 policies"
SQL: SELECT "agentName", COUNT(*) as policy_count FROM smartoffice_policies WHERE "tenantId" = '${tenantId}' GROUP BY "agentName" HAVING COUNT(*) > 10 ORDER BY policy_count DESC;

Q: "How many policies were added this month?"
SQL: SELECT COUNT(*) as count FROM smartoffice_policies WHERE "tenantId" = '${tenantId}' AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE);
`;
}
