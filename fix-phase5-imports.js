const fs = require('fs');
const path = require('path');

const files = [
  'app/api/smartoffice/dashboards/route.ts',
  'app/api/smartoffice/dashboards/[id]/route.ts',
  'app/api/smartoffice/saved-filters/route.ts',
  'app/api/smartoffice/saved-filters/[id]/route.ts',
  'app/api/smartoffice/widgets/data/route.ts',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace incorrect imports
  content = content.replace(
    /import { db } from '@\/lib\/db';/g,
    "import { prisma as db } from '@/lib/db/prisma';"
  );
  content = content.replace(
    /import { getCurrentUser } from '@\/lib\/auth-context';/g,
    "import { getAuthenticatedUser } from '@/lib/auth/server-auth';"
  );
  content = content.replace(
    /import { getTenantContext } from '@\/lib\/tenant-context';/g,
    "import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';"
  );

  // Replace function calls
  content = content.replace(/const user = await getCurrentUser\(\);/g, 'const user = await getAuthenticatedUser(request);');
  content = content.replace(/const tenantContext = await getTenantContext\(\);/g, 'const tenantContext = getTenantFromRequest(request);');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${file}`);
});

console.log('All files fixed!');
