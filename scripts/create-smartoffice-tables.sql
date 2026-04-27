-- Create SmartOfficeContract table
CREATE TABLE IF NOT EXISTS "smartoffice_contracts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "advisorName" TEXT NOT NULL,
    "advisorEmail" TEXT,
    "advisorPhone" TEXT,
    "subSource" TEXT,
    "supervisor" TEXT,
    "contractName" TEXT NOT NULL,
    "contractType" TEXT,
    "contractNumber" TEXT,
    "commissionLevel" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "carrierName" TEXT,
    "importId" TEXT,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncDate" TIMESTAMP(3) NOT NULL,
    "sourceFile" TEXT,
    "rawData" JSONB,
    "additionalData" JSONB,
    "searchText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smartoffice_contracts_pkey" PRIMARY KEY ("id")
);

-- Create SmartOfficeCommission table
CREATE TABLE IF NOT EXISTS "smartoffice_commissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "policyNumber" TEXT,
    "checkDate" TIMESTAMP(3),
    "actualAmountPaid" DOUBLE PRECISION,
    "receivable" DOUBLE PRECISION,
    "primaryAdvisor" TEXT,
    "advisorName" TEXT,
    "subSource" TEXT,
    "supervisor" TEXT,
    "statusDate" TIMESTAMP(3),
    "planType" TEXT,
    "carrierName" TEXT,
    "primaryInsured" TEXT,
    "commAnnualizedPrem" DOUBLE PRECISION,
    "premiumMode" TEXT,
    "importId" TEXT,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncDate" TIMESTAMP(3) NOT NULL,
    "sourceFile" TEXT,
    "rawData" JSONB,
    "additionalData" JSONB,
    "searchText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smartoffice_commissions_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "smartoffice_contracts" ADD CONSTRAINT "smartoffice_contracts_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "smartoffice_contracts" ADD CONSTRAINT "smartoffice_contracts_importId_fkey"
    FOREIGN KEY ("importId") REFERENCES "smartoffice_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "smartoffice_commissions" ADD CONSTRAINT "smartoffice_commissions_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "smartoffice_commissions" ADD CONSTRAINT "smartoffice_commissions_importId_fkey"
    FOREIGN KEY ("importId") REFERENCES "smartoffice_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for smartoffice_contracts
CREATE INDEX IF NOT EXISTS "smartoffice_contracts_tenantId_idx" ON "smartoffice_contracts"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_contracts_advisorName_idx" ON "smartoffice_contracts"("advisorName");
CREATE INDEX IF NOT EXISTS "smartoffice_contracts_advisorEmail_idx" ON "smartoffice_contracts"("advisorEmail");
CREATE INDEX IF NOT EXISTS "smartoffice_contracts_contractNumber_idx" ON "smartoffice_contracts"("contractNumber");
CREATE INDEX IF NOT EXISTS "smartoffice_contracts_carrierName_idx" ON "smartoffice_contracts"("carrierName");
CREATE INDEX IF NOT EXISTS "smartoffice_contracts_importId_idx" ON "smartoffice_contracts"("importId");

-- Create indexes for smartoffice_commissions
CREATE INDEX IF NOT EXISTS "smartoffice_commissions_tenantId_idx" ON "smartoffice_commissions"("tenantId");
CREATE INDEX IF NOT EXISTS "smartoffice_commissions_policyNumber_idx" ON "smartoffice_commissions"("policyNumber");
CREATE INDEX IF NOT EXISTS "smartoffice_commissions_primaryAdvisor_idx" ON "smartoffice_commissions"("primaryAdvisor");
CREATE INDEX IF NOT EXISTS "smartoffice_commissions_advisorName_idx" ON "smartoffice_commissions"("advisorName");
CREATE INDEX IF NOT EXISTS "smartoffice_commissions_carrierName_idx" ON "smartoffice_commissions"("carrierName");
CREATE INDEX IF NOT EXISTS "smartoffice_commissions_checkDate_idx" ON "smartoffice_commissions"("checkDate");
CREATE INDEX IF NOT EXISTS "smartoffice_commissions_importId_idx" ON "smartoffice_commissions"("importId");

-- Enable RLS on the new tables
ALTER TABLE "smartoffice_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "smartoffice_commissions" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for smartoffice_contracts
CREATE POLICY "smartoffice_contracts_tenant_isolation_policy" ON "smartoffice_contracts"
    AS RESTRICTIVE
    USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY "smartoffice_contracts_select_policy" ON "smartoffice_contracts"
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY "smartoffice_contracts_insert_policy" ON "smartoffice_contracts"
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY "smartoffice_contracts_update_policy" ON "smartoffice_contracts"
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY "smartoffice_contracts_delete_policy" ON "smartoffice_contracts"
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

-- Create RLS policies for smartoffice_commissions
CREATE POLICY "smartoffice_commissions_tenant_isolation_policy" ON "smartoffice_commissions"
    AS RESTRICTIVE
    USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY "smartoffice_commissions_select_policy" ON "smartoffice_commissions"
    FOR SELECT
    USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY "smartoffice_commissions_insert_policy" ON "smartoffice_commissions"
    FOR INSERT
    WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY "smartoffice_commissions_update_policy" ON "smartoffice_commissions"
    FOR UPDATE
    USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);

CREATE POLICY "smartoffice_commissions_delete_policy" ON "smartoffice_commissions"
    FOR DELETE
    USING ("tenantId" = current_setting('app.current_tenant_id', TRUE)::text);
