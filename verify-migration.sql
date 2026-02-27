-- ============================================
-- VERIFY MULTI-TENANT MIGRATION
-- Check which tables have tenantId column
-- ============================================

SELECT
  t.table_name,
  CASE
    WHEN c.column_name IS NOT NULL THEN '✓ Has tenantId'
    ELSE '✗ Missing tenantId'
  END as status,
  CASE
    WHEN c.is_nullable = 'NO' THEN 'NOT NULL'
    ELSE 'NULLABLE'
  END as nullable_status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_name = c.table_name
  AND c.column_name = 'tenantId'
  AND c.table_schema = 'public'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE '_prisma%'
ORDER BY
  CASE WHEN c.column_name IS NOT NULL THEN 1 ELSE 2 END,
  t.table_name;
