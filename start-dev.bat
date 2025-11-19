@echo off
cd /d c:\dev\valor-2
set DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
set DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
echo Starting dev server with local database...
echo DATABASE_URL=%DATABASE_URL%
npm run dev
