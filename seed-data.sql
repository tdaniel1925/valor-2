-- Seed Data for Valor Insurance Platform
-- Run this in Supabase SQL Editor to populate demo data

-- Insert Demo User
INSERT INTO users (id, email, "firstName", "lastName", phone, role, status, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'demo-user-id',
  'demo@valorfinancial.com',
  'Alex',
  'Thompson',
  '(555) 123-4567',
  'AGENT',
  'ACTIVE',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert User Profile
INSERT INTO user_profiles (id, "userId", "licenseNumber", "licenseState", "licenseExpiration", npn, gaid, "agencyName", "yearsOfExperience", specializations, "emailNotifications", "smsNotifications", "pushNotifications", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'demo-user-id',
  'CA-LIC-123456',
  'CA',
  '2026-12-31',
  '12345678',
  'AG-001',
  'Thompson Insurance Group',
  5,
  ARRAY['Life Insurance', 'Annuities'],
  true,
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("userId") DO NOTHING;

-- Insert Demo Organization
INSERT INTO organizations (id, name, type, ein, phone, email, address, city, state, "zipCode", status, "createdAt", "updatedAt")
VALUES (
  'demo-org-id',
  'Valor Financial Specialists',
  'IMO',
  '12-3456789',
  '(555) 100-0000',
  'hq@valorfinancial.com',
  '123 Main Street',
  'Los Angeles',
  'CA',
  '90001',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Organization Member
INSERT INTO organization_members (id, "organizationId", "userId", role, "commissionSplit", permissions, "isActive", "joinedAt")
VALUES (
  gen_random_uuid(),
  'demo-org-id',
  'demo-user-id',
  'AGENT',
  85.0,
  ARRAY['quotes.create', 'cases.view'],
  true,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert Sample Contract
INSERT INTO contracts (id, "userId", "organizationId", "carrierName", "productType", "commissionLevel", status, "effectiveDate", "requestedAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'demo-user-id',
  'demo-org-id',
  'Pacific Life',
  'Life Insurance',
  100.0,
  'ACTIVE',
  '2024-01-01',
  NOW(),
  NOW()
);

INSERT INTO contracts (id, "userId", "organizationId", "carrierName", "productType", "commissionLevel", status, "effectiveDate", "requestedAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'demo-user-id',
  'demo-org-id',
  'Athene Annuities',
  'Annuity',
  95.0,
  'ACTIVE',
  '2024-01-01',
  NOW(),
  NOW()
);

-- Insert Sample Quotes
INSERT INTO quotes (id, "userId", "clientName", "clientEmail", "clientAge", "clientState", type, carrier, "productName", "coverageAmount", premium, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'demo-user-id',
  'John Smith',
  'john.smith@email.com',
  45,
  'CA',
  'TERM_LIFE',
  'Pacific Life',
  'Pacific Term Life 20',
  500000,
  85.50,
  'GENERATED',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
);

INSERT INTO quotes (id, "userId", "clientName", "clientEmail", "clientAge", "clientState", type, carrier, "productName", "coverageAmount", premium, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'demo-user-id',
  'Sarah Johnson',
  'sarah.j@email.com',
  62,
  'CA',
  'FIXED_ANNUITY',
  'Athene Annuities',
  'Athene Performance Elite 5',
  250000,
  0,
  'SENT',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
);

-- Insert Sample Cases
INSERT INTO cases (id, "userId", "clientName", "clientEmail", carrier, "productType", "productName", "applicationNumber", "coverageAmount", premium, status, "submittedAt", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'demo-user-id',
  'John Smith',
  'john.smith@email.com',
  'Pacific Life',
  'Life Insurance',
  'Pacific Term Life 20',
  'APP-2024-001',
  500000,
  85.50,
  'IN_UNDERWRITING',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '5 days',
  NOW()
);

INSERT INTO cases (id, "userId", "clientName", "clientEmail", carrier, "productType", "productName", "policyNumber", "coverageAmount", premium, status, "submittedAt", "issuedAt", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'demo-user-id',
  'Mary Williams',
  'mary.w@email.com',
  'Nationwide',
  'Life Insurance',
  'Nationwide YourLife Term',
  'POL-2024-789',
  750000,
  125.75,
  'ISSUED',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '35 days',
  NOW()
);

-- Insert Sample Commissions
INSERT INTO commissions (id, "userId", "caseId", type, status, carrier, "policyNumber", amount, percentage, "periodStart", "periodEnd", "paidAt", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'demo-user-id',
  id,
  'FIRST_YEAR',
  'PAID',
  carrier,
  "policyNumber",
  premium * 12 * 0.85,
  85.0,
  NOW() - INTERVAL '1 month',
  NOW(),
  NOW() - INTERVAL '5 days',
  NOW(),
  NOW()
FROM cases
WHERE "userId" = 'demo-user-id' AND status = 'ISSUED'
LIMIT 1;

-- Insert Sample Notification
INSERT INTO notifications (id, "userId", type, title, message, link, "isRead", "createdAt")
VALUES (
  gen_random_uuid(),
  'demo-user-id',
  'CASE_UPDATE',
  'Case Approved',
  'Your case for Mary Williams has been approved and issued.',
  '/cases',
  false,
  NOW() - INTERVAL '1 day'
);

-- Success message
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM organizations) as organizations,
  (SELECT COUNT(*) FROM contracts) as contracts,
  (SELECT COUNT(*) FROM quotes) as quotes,
  (SELECT COUNT(*) FROM cases) as cases,
  (SELECT COUNT(*) FROM commissions) as commissions,
  (SELECT COUNT(*) FROM notifications) as notifications;
