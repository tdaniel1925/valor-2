const fs = require('fs');
const path = require('path');

const files = [
  'app/api/smartoffice/import/route.ts',
  'app/api/smartoffice/stats/route.ts',
  'app/api/smartoffice/policies/route.ts',
  'app/api/smartoffice/agents/route.ts',
  'app/api/quotes/aggregated/route.ts',
  'app/api/quotes/save/route.ts',
  'app/api/integrations/winflex/sso/xml/route.ts',
  'app/api/integrations/winflex/sso/route.ts',
  'app/api/integrations/ipipeline/sso/route.ts',
  'app/api/integrations/ipipeline/route.ts',
  'app/api/admin/contracts/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/audit-logs/route.ts',
  'app/api/notifications/route.ts',
  'app/api/contracts/route.ts',
  'app/api/goals/route.ts',
  'app/api/organizations/route.ts',
  'app/api/commissions/route.ts',
  'app/api/quotes/route.ts',
  'app/api/cases/route.ts'
];

let count = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Replace getTenantContext with getTenantFromRequest
    content = content.replace(/getTenantContext/g, 'getTenantFromRequest');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
      console.log(`✓ Fixed: ${file}`);
    }
  } else {
    console.log(`✗ Not found: ${file}`);
  }
});

console.log(`\n✅ Fixed ${count} files`);
