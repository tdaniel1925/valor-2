# Push Prisma Schema to Supabase Production

$env:DATABASE_URL = "postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres?sslmode=require"
$env:DIRECT_URL = "postgresql://postgres:ttandSellaBella1234@db.buteoznuikfowbwofabs.supabase.co:5432/postgres?sslmode=require"

Write-Host "Pushing schema to Supabase production..." -ForegroundColor Green
npx prisma db push --skip-generate

Write-Host "`nDone! Check Supabase dashboard to verify tables were created." -ForegroundColor Cyan
